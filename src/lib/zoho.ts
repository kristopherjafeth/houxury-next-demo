import type { Property } from '../data/properties'
import { DEFAULT_PROPERTY_TYPES, DEFAULT_PROPERTY_VALUES } from '../data/properties'

const TOKEN_URL = 'https://accounts.zoho.eu/oauth/v2/token'
const PROPERTIES_ENDPOINT = 'https://www.zohoapis.eu/crm/v8/Inmuebles'
// Include both camelCase and snake_case variants of availability fields because Zoho may return different names
const PROPERTIES_FIELDS = 'Name,Record_Image,property_type,price_night,bathroom_quantity,number_of_rooms,square_meters,location,startOfAvailability,endOfAvailability,Start_of_Availability,End_of_Availability,start_of_availability,end_of_availability,features'
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
  startOfAvailability?: string | null
  endOfAvailability?: string | null
  // possible alternative field names returned by Zoho
  Start_of_Availability?: string | null
  End_of_Availability?: string | null
  start_of_availability?: string | null
  end_of_availability?: string | null
  features?: unknown
  [key: string]: unknown
}

const getStringField = (record: ZohoRecord, ...keys: string[]): string | null => {
  for (const k of keys) {
    const v = record[k]
    if (v === null || v === undefined) continue
    if (typeof v === 'string') {
      const trimmed = v.trim()
      if (trimmed.length > 0) return trimmed
    }
    if (typeof v === 'number') {
      return String(v)
    }
  }
  return null
}

const hasAvailabilityFields = (record: ZohoRecord) => {
  return (
    !!getStringField(record, 'startOfAvailability', 'Start_of_Availability', 'start_of_availability') &&
    !!getStringField(record, 'endOfAvailability', 'End_of_Availability', 'end_of_availability')
  )
}

const safeNumber = (value: ZohoRecord[keyof ZohoRecord]) => {
  if (value === null || value === undefined) {
    return null
  }

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

  const featureList = Array.isArray(record.features)
    ? (record.features as unknown[])
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
    : [...DEFAULT_PROPERTY_VALUES.features]


  return {
    id: record.id,
    title,
    location,
    pricePerNight,
    type: propertyType,
    imageUrl,
    description: DEFAULT_PROPERTY_VALUES.description,
    features: featureList,
    bathrooms,
    rooms,
    squareMeters,
    rawPricePerNight: rawPriceNight,
    // Resolve availability from multiple possible field names that Zoho may return
    startOfAvailability: getStringField(record, 'startOfAvailability', 'Start_of_Availability', 'start_of_availability'),
    endOfAvailability: getStringField(record, 'endOfAvailability', 'End_of_Availability', 'end_of_availability'),
  }
}

export type ZohoFilters = {
  propertyType?: string | null
  checkIn?: string | null
  checkOut?: string | null
}

const buildCriteria = (filters?: ZohoFilters) => {
  if (!filters) return ''
  const parts: string[] = []

  if (filters.propertyType) {
    // Zoho criteria example: (property_type:equals:Apartamento)
    parts.push(`(property_type:equals:${filters.propertyType})`)
  }

  // Dates in Zoho should be in yyyy-MM-dd format; assume inputs already are
  if (filters.checkIn) {
    // Zoho often stores date fields with underscores; prefer Start_of_Availability for criteria
    // start <= checkIn
    parts.push(`(Start_of_Availability:before_or_equal:${filters.checkIn})`)
  }

  if (filters.checkOut) {
    // end >= checkOut
    parts.push(`(End_of_Availability:after_or_equal:${filters.checkOut})`)
  }

  if (parts.length === 0) return ''
  return parts.join(' and ')
}

export const fetchZohoProperties = async (filters?: ZohoFilters) => {
  const token = await fetchAccessToken()
  const criteria = buildCriteria(filters)
  const url = criteria
    ? `${PROPERTIES_ENDPOINT}?fields=${encodeURIComponent(PROPERTIES_FIELDS)}&criteria=${encodeURIComponent(criteria)}`
    : `${PROPERTIES_ENDPOINT}?fields=${encodeURIComponent(PROPERTIES_FIELDS)}`

  const response = await fetch(url, {
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
  // Debug: if any record lacks availability fields, log the raw payload to help mapping
  try {
    const anyMissing = records.some((r) => !hasAvailabilityFields(r))
    if (anyMissing) {
      console.warn('Zoho raw records (some missing availability fields):', JSON.stringify(records, null, 2))
    }
  } catch {
    // ignore logging errors
  }
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
