import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_PROPERTY_TYPES } from '../../data/properties'
import type { Property } from '../../data/properties'
import { fetchZohoProperties } from '../../lib/zoho'

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const { propertyType, checkIn, checkOut } = request.query
    const checkInString = Array.isArray(checkIn) ? checkIn[0] : checkIn
    const checkOutString = Array.isArray(checkOut) ? checkOut[0] : checkOut

    const parseDate = (value?: string | null) => {
      if (!value) return null
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    const parseDateStrict = (value?: string | null) => {
      if (!value) return null
      // Try common formats: yyyy-mm-dd or ISO
      // If value looks like 'Oct 10, 2025' the Date constructor can parse it, but
      // to avoid timezone pitfalls we normalize to UTC midnight when possible.
      const asIso = /^\d{4}-\d{2}-\d{2}$/.test(value)
      if (asIso) {
        const parts = value.split('-').map((p) => Number(p))
        const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
        return Number.isNaN(d.getTime()) ? null : d
      }

      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return null
      // normalize to UTC midnight
      return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()))
    }

    const checkInDate = parseDate(checkInString)
    const checkOutDate = parseDate(checkOutString)

    if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
      return response.status(400).json({
        message: 'La fecha de salida debe ser posterior a la fecha de entrada.',
      })
    }

    const properties = await fetchZohoProperties({
      propertyType: Array.isArray(propertyType) ? propertyType[0] : (propertyType as string | undefined),
      checkIn: checkInString || null,
      checkOut: checkOutString || null,
    })

    const isPropertyAvailable = (property: Property) => {
      // If no dates provided, treat as available
      if (!checkInDate && !checkOutDate) return true

      const start = parseDateStrict(property.startOfAvailability)
      const end = parseDateStrict(property.endOfAvailability)

      // If both start and end are present, the property must fully contain the requested range
      if (start && end && checkInDate && checkOutDate) {
        return start.getTime() <= checkInDate.getTime() && end.getTime() >= checkOutDate.getTime()
      }

      // If only start is present, ensure start <= checkIn (property starts on/before check-in)
      if (start && checkInDate) {
        return start.getTime() <= checkInDate.getTime()
      }

      // If only end is present, ensure end >= checkOut (property still available at check-out)
      if (end && checkOutDate) {
        return end.getTime() >= checkOutDate.getTime()
      }

      // No date constraints available on the property; assume available
      return true
    }

    const dateFiltered = properties.filter(isPropertyAvailable)

    const typeSet = new Set<string>()
    dateFiltered.forEach((property) => {
      if (property.type) {
        typeSet.add(property.type)
      }
    })

    const availableTypes = typeSet.size ? Array.from(typeSet).sort() : [...DEFAULT_PROPERTY_TYPES]

    const filtered =
      propertyType && typeof propertyType === 'string' && propertyType.length > 0
        ? dateFiltered.filter((property) => property.type === propertyType)
        : dateFiltered

    const responsePayload =
      filtered.length === 0 && propertyType ? dateFiltered : filtered


    return response.status(200).json({
      properties: responsePayload,
      availableTypes,
    })
  } catch (error) {
    console.error('[api/properties]', error)
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudieron obtener las propiedades de Zoho.'
    return response.status(500).json({ message })
  }
}

export default handler
