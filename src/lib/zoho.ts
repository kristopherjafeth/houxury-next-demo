import type { Property } from '../data/properties'
import { DEFAULT_PROPERTY_TYPES, DEFAULT_PROPERTY_VALUES } from '../data/properties'

const TOKEN_URL = 'https://accounts.zoho.eu/oauth/v2/token'
const PROPERTIES_ENDPOINT = 'https://www.zohoapis.eu/crm/v8/Inmuebles'
const PROPERTIES_FIELDS = 'Name,Record_Image,property_type,price_night,bathroom_quantity,number_of_rooms,square_meters,location'
const MAX_PROPERTIES = 12

let cachedToken: { token: string; expiresAt: number } | null = null

const getCredentials = () => {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Credenciales de Zoho no configuradas. Define ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID y ZOHO_CLIENT_SECRET en el entorno.')
  }

  return { refreshToken, clientId, clientSecret }
}

const fetchAccessToken = async () => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const { refreshToken, clientId, clientSecret } = getCredentials()
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  })

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`No se pudo obtener el access token de Zoho: ${response.status} ${text}`)
  }

  const data: { access_token?: string; expires_in?: number } = await response.json()

  if (!data.access_token) {
    throw new Error('La respuesta de Zoho no incluye access_token')
  }

  const expiresIn = data.expires_in ? data.expires_in * 1000 : 55 * 60 * 1000
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn,
  }

  return data.access_token
}

const fetchPropertyPhoto = async (id: string, token: string) => {
  try {
    const response = await fetch(`${PROPERTIES_ENDPOINT}/${id}/photo`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    })

    if (!response.ok) {
      return DEFAULT_PROPERTY_VALUES.imageUrl
    }

    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()

    if (!arrayBuffer.byteLength) {
      return DEFAULT_PROPERTY_VALUES.imageUrl
    }

    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    return `data:${contentType};base64,${base64Image}`
  } catch  {
    return DEFAULT_PROPERTY_VALUES.imageUrl
  }
}

type ZohoRecord = {
  id: string
  Name?: string | null
  Record_Image?: string | null
  location?: string | null
  property_type?: string | null
  price_night?: number | string | null
  bathroom_quantity?: number | string | null
  number_of_rooms?: number | string | null
  square_meters?: number | string | null
}

const safeNumber = (value: ZohoRecord[keyof ZohoRecord]) => {
  const numeric = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : null
  return Number.isFinite(numeric) ? numeric : null
}

const formatPricePerNight = (value: number | null) => {
  if (value === null) return DEFAULT_PROPERTY_VALUES.pricePerNight
  try {
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    })
    return `${formatter.format(value)} / noche`
  } catch  {
    return `${value} / noche`
  }
}

const mapRecordToProperty = async (record: ZohoRecord, token: string): Promise<Property> => {
  const title = record.Name?.trim() || 'Inmueble sin título'
  const imageUrl = record.Record_Image ? await fetchPropertyPhoto(record.id, token) : DEFAULT_PROPERTY_VALUES.imageUrl
  const location = record.location?.trim() || DEFAULT_PROPERTY_VALUES.location
  const propertyType = record.property_type?.trim() || DEFAULT_PROPERTY_TYPES[0]

  const rawPriceNight = safeNumber(record.price_night)
  const bathrooms = safeNumber(record.bathroom_quantity)
  const rooms = safeNumber(record.number_of_rooms)
  const squareMeters = safeNumber(record.square_meters)

  const pricePerNight = formatPricePerNight(rawPriceNight)


  return {
    id: record.id,
    title,
    location,
    pricePerNight,
    type: propertyType,
    imageUrl,
  features: [...DEFAULT_PROPERTY_VALUES.features],
    bathrooms,
    rooms,
    squareMeters,
    rawPricePerNight: rawPriceNight,
  }
}

export const fetchZohoProperties = async () => {
  const token = await fetchAccessToken()
  const response = await fetch(`${PROPERTIES_ENDPOINT}?fields=${encodeURIComponent(PROPERTIES_FIELDS)}`, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`No se pudieron obtener los inmuebles: ${response.status} ${text}`)
  }

  const payload: { data?: ZohoRecord[] } = await response.json()
  const records = payload.data ?? []
  const limitedRecords = records.slice(0, MAX_PROPERTIES)

  const properties = await Promise.all(limitedRecords.map((record) => mapRecordToProperty(record, token)))

  return properties
}

export const fetchZohoPropertyTypes = async () => {
  const token = await fetchAccessToken()
  const response = await fetch(`${PROPERTIES_ENDPOINT}?fields=property_type`, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`No se pudieron obtener los tipos de inmueble: ${response.status} ${text}`)
  }

  const payload: { data?: Array<{ property_type?: string | null }> } = await response.json()

  const uniqueTypes = new Set<string>()
  payload.data?.forEach((record) => {
    const type = record.property_type?.trim()
    if (type) {
      uniqueTypes.add(type)
    }
  })

  return uniqueTypes.size ? Array.from(uniqueTypes).sort() : DEFAULT_PROPERTY_TYPES
}
