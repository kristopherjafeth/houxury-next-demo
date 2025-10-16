import type { Property } from '../data/properties'
import { DEFAULT_PROPERTY_TYPES, DEFAULT_PROPERTY_VALUES } from '../data/properties'

const TOKEN_URL = 'https://accounts.zoho.eu/oauth/v2/token'
const PROPERTIES_ENDPOINT = 'https://www.zohoapis.eu/crm/v8/Inmuebles'
const PROPERTIES_FIELDS = 'Name,Record_Image'
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

const mapRecordToProperty = async (
  record: { id: string; Name?: string | null; Record_Image?: string | null },
  token: string,
): Promise<Property> => {
  const title = record.Name?.trim() || 'Inmueble sin título'
  const imageUrl = record.Record_Image ? await fetchPropertyPhoto(record.id, token) : DEFAULT_PROPERTY_VALUES.imageUrl

  return {
    id: record.id,
    title,
    location: DEFAULT_PROPERTY_VALUES.location,
    pricePerNight: DEFAULT_PROPERTY_VALUES.pricePerNight,
    type: DEFAULT_PROPERTY_TYPES[0],
    imageUrl,
    description: DEFAULT_PROPERTY_VALUES.description,
    features: [...DEFAULT_PROPERTY_VALUES.features],
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

  const payload: { data?: Array<{ id: string; Name?: string; Record_Image?: string | null }> } = await response.json()
  const records = payload.data ?? []
  const limitedRecords = records.slice(0, MAX_PROPERTIES)

  const properties = await Promise.all(limitedRecords.map((record) => mapRecordToProperty(record, token)))

  return properties
}
