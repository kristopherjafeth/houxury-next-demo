import type { Property } from '../data/properties'
import { DEFAULT_PROPERTY_TYPES, DEFAULT_PROPERTY_VALUES } from '../data/properties'
import type { Reservation } from '../data/reservations'
import { DEFAULT_RESERVATION_VALUES } from '../data/reservations'

const TOKEN_URL = 'https://accounts.zoho.eu/oauth/v2/token'
const PROPERTIES_ENDPOINT = 'https://www.zohoapis.eu/crm/v8/Inmuebles'
const RESERVATIONS_ENDPOINT = `https://www.zohoapis.eu/crm/v8/${process.env.ZOHO_RESERVATIONS_MODULE ?? 'Reservaciones'}`
const PROPERTIES_FIELDS = 'Name,Record_Image,property_type,price_night,bathroom_quantity,number_of_rooms,square_meters,location,startOfAvailability,endOfAvailability,Start_of_Availability,End_of_Availability,start_of_availability,end_of_availability,features,slugwordpress'
const RESERVATIONS_FIELDS = 'Check_in,Check_out,Connected_To__s,Email,Secondary_Email,Created_By,reservation_duration,status,Tag,reservation_date,Record_Image,property_reserved,Modified_By,Email_Opt_Out,Name,client_name,Owner,phone'
const MAX_PROPERTIES = 12
const MAX_RESERVATIONS = 50

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
  Start_of_Availability?: string | null
  End_of_Availability?: string | null
  start_of_availability?: string | null
  end_of_availability?: string | null
  slugwordpress?: string | null
  features?: unknown
  [key: string]: unknown
}

const getStringField = (record: Record<string, unknown>, ...keys: string[]): string | null => {
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

const safeNumber = (value: unknown) => {
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
    startOfAvailability: getStringField(record, 'startOfAvailability', 'Start_of_Availability', 'start_of_availability'),
    endOfAvailability: getStringField(record, 'endOfAvailability', 'End_of_Availability', 'end_of_availability'),
    slugWordpress: record.slugwordpress
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
    // ejemplo: (property_type:equals:Apartamento)
    parts.push(`(property_type:equals:${filters.propertyType})`)
  }

  if (filters.checkIn) {
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

type ZohoReservationRecord = {
  id: string
  Name?: string | null
  property_reserved?: unknown
  Connected_To__s?: unknown
  client_name?: string | null
  Check_in?: string | null
  Check_out?: string | null
  status?: string | null
  reservation_duration?: number | string | null
  reservation_date?: string | null
  Email?: string | null
  Secondary_Email?: string | null
  phone?: string | null
  Tag?: unknown
  Record_Image?: unknown
  Created_By?: unknown
  Modified_By?: unknown
  Email_Opt_Out?: boolean | null
  Owner?: unknown
  [key: string]: unknown
}

type LookupValue = { id: string | null; name: string | null }

const extractLookup = (value: unknown): LookupValue => {
  if (Array.isArray(value) && value.length > 0) {
    return extractLookup(value[0])
  }

  if (!value || typeof value !== 'object') {
    return { id: null, name: null }
  }

  const candidate = value as Record<string, unknown>
  const id = (() => {
    const raw = candidate.id
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim()
    }
    return null
  })()

  const name = (() => {
    const raw = candidate.name ?? candidate.Name
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim()
    }
    return null
  })()

  return { id, name }
}

const formatReservationAmount = (value: number | null) => {
  if (value === null) return DEFAULT_RESERVATION_VALUES.formattedTotalPrice
  try {
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    })
    return formatter.format(value)
  } catch  {
    return `${value}`
  }
}

const normalizeTags = (value: unknown) => {
  if (!value) {
    return [...DEFAULT_RESERVATION_VALUES.tags]
  }

  if (Array.isArray(value)) {
    const tags = value
      .map((entry) => {
        if (typeof entry === 'string') {
          const trimmed = entry.trim()
          return trimmed.length > 0 ? trimmed : null
        }
        if (entry && typeof entry === 'object') {
          const candidate = entry as Record<string, unknown>
          const raw = (candidate.name ?? candidate.Name ?? candidate.tag ?? candidate.Tag) as string | undefined
          if (raw) {
            const trimmed = raw.trim()
            return trimmed.length > 0 ? trimmed : null
          }
        }
        return null
      })
      .filter((tag): tag is string => tag !== null)

    return tags.length > 0 ? tags : [...DEFAULT_RESERVATION_VALUES.tags]
  }

  if (typeof value === 'string') {
    const tags = value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
    return tags.length > 0 ? tags : [...DEFAULT_RESERVATION_VALUES.tags]
  }

  return [...DEFAULT_RESERVATION_VALUES.tags]
}

const normalizeImageValue = (value: unknown) => {
  if (!value) {
    return DEFAULT_RESERVATION_VALUES.imageUrl
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : DEFAULT_RESERVATION_VALUES.imageUrl
  }

  if (Array.isArray(value) && value.length > 0) {
    return normalizeImageValue(value[0])
  }

  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>
    const raw = candidate.url ?? candidate.URL ?? candidate.download_url ?? candidate.downloadUrl
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      return trimmed.length > 0 ? trimmed : DEFAULT_RESERVATION_VALUES.imageUrl
    }
  }

  return DEFAULT_RESERVATION_VALUES.imageUrl
}

const mapRecordToReservation = (record: ZohoReservationRecord): Reservation => {
  const propertyLookup = extractLookup(record.property_reserved ?? record.Connected_To__s)
  const ownerLookup = extractLookup(record.Owner)

  const code = getStringField(record, 'Name') ?? DEFAULT_RESERVATION_VALUES.code
  const propertyName = propertyLookup.name ?? DEFAULT_RESERVATION_VALUES.propertyName
  const guestName = getStringField(record, 'client_name') ?? DEFAULT_RESERVATION_VALUES.guestName

  const status = getStringField(record, 'status') ?? DEFAULT_RESERVATION_VALUES.status
  const checkIn = getStringField(record, 'Check_in')
  const checkOut = getStringField(record, 'Check_out')
  const notes = null
  const guestCount = null
  const totalPrice = null
  const formattedTotalPrice = formatReservationAmount(totalPrice)
  const reservationDate = getStringField(record, 'reservation_date')
  const email = getStringField(record, 'Email') ?? DEFAULT_RESERVATION_VALUES.email
  const secondaryEmail = getStringField(record, 'Secondary_Email') ?? DEFAULT_RESERVATION_VALUES.secondaryEmail
  const phone = getStringField(record, 'phone') ?? DEFAULT_RESERVATION_VALUES.phone
  const reservationDuration = safeNumber(record.reservation_duration)
  const tags = normalizeTags(record.Tag)
  const imageUrl = normalizeImageValue(record.Record_Image)
  const ownerName = ownerLookup.name ?? DEFAULT_RESERVATION_VALUES.ownerName

  return {
    id: record.id,
    code,
    propertyId: propertyLookup.id,
    propertyName,
    guestName,
    checkIn,
    checkOut,
    status,
    guestCount,
    totalPrice,
    formattedTotalPrice,
    createdAt: reservationDate,
    notes,
    email,
    secondaryEmail,
    phone,
    reservationDate,
    reservationDuration,
    ownerName,
    tags,
    imageUrl,
  }
}

export type ZohoReservationFilters = {
  status?: string | null
  propertyId?: string | null
  checkIn?: string | null
  checkOut?: string | null
}

const buildReservationCriteria = (filters?: ZohoReservationFilters) => {
  if (!filters) return ''
  const parts: string[] = []

  if (filters.status) {
    parts.push(`(Status:equals:${filters.status})`)
  }

  if (filters.propertyId) {
    parts.push(`(property_reserved.id:equals:${filters.propertyId})`)
  }

  if (filters.checkIn) {
    parts.push(`(Check_out:after_or_equal:${filters.checkIn})`)
  }

  if (filters.checkOut) {
    parts.push(`(Check_in:before_or_equal:${filters.checkOut})`)
  }

  if (parts.length === 0) return ''
  return parts.join(' and ')
}

export const fetchZohoReservations = async (filters?: ZohoReservationFilters) => {
  const token = await fetchAccessToken()
  const criteria = buildReservationCriteria(filters)
  const url = criteria
    ? `${RESERVATIONS_ENDPOINT}?fields=${encodeURIComponent(RESERVATIONS_FIELDS)}&criteria=${encodeURIComponent(criteria)}`
    : `${RESERVATIONS_ENDPOINT}?fields=${encodeURIComponent(RESERVATIONS_FIELDS)}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
    },
  })

  const rawBody = await response.text()

  if (!response.ok) {
    throw new Error(`No se pudieron obtener las reservaciones: ${response.status} ${rawBody}`)
  }

  if (!rawBody || rawBody.trim().length === 0) {
    return []
  }

  let payload: { data?: ZohoReservationRecord[] }
  try {
    payload = JSON.parse(rawBody) as { data?: ZohoReservationRecord[] }
  } catch (parseError) {
    throw new Error(`No se pudieron interpretar las reservaciones de Zoho: ${(parseError as Error).message}`)
  }

  const records = payload.data ?? []
  const limitedRecords = records.slice(0, MAX_RESERVATIONS)

  return limitedRecords.map((record) => mapRecordToReservation(record))
}
