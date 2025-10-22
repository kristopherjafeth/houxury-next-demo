import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_PROPERTY_TYPES } from '../../data/properties'
import type { Property } from '../../data/properties'
import type { Reservation } from '../../data/reservations'
import { fetchZohoProperties, fetchZohoReservations } from '../../lib/zoho'

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
  const { propertyType, checkIn, checkOut, location } = request.query
  const checkInString = Array.isArray(checkIn) ? checkIn[0] : checkIn
  const checkOutString = Array.isArray(checkOut) ? checkOut[0] : checkOut
  const locationString = Array.isArray(location) ? location[0] : location

    const parseDate = (value?: string | null) => {
      if (!value) return null
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    const parseDateStrict = (value?: string | null) => {
      if (!value) return null

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
      location: locationString || null,
    })

    const shouldCheckReservations = Boolean(checkInDate && checkOutDate)

    let reservations: Reservation[] = []
    if (shouldCheckReservations) {
      try {
        reservations = await fetchZohoReservations({
          checkIn: checkInString || null,
          checkOut: checkOutString || null,
        })
      } catch (reservationError) {
        console.error('[api/properties] fetchZohoReservations', reservationError)
      }
    }

    const reservationsByProperty = new Map<string, Reservation[]>()
    if (shouldCheckReservations && reservations.length > 0) {
      reservations.forEach((reservation) => {
        if (!reservation.propertyId) return
        if (!reservationsByProperty.has(reservation.propertyId)) {
          reservationsByProperty.set(reservation.propertyId, [])
        }
        reservationsByProperty.get(reservation.propertyId)?.push(reservation)
      })
    }

    const addUtcDays = (date: Date, amount: number) => {
      const next = new Date(date.getTime())
      next.setUTCDate(next.getUTCDate() + amount)
      return next
    }

    const toIsoDate = (date: Date) => {
      return date.toISOString().slice(0, 10)
    }

    const enumerateDateRange = (start: Date, end: Date) => {
      const result: string[] = []
      for (let cursor = new Date(start.getTime()); cursor < end; cursor = addUtcDays(cursor, 1)) {
        result.push(toIsoDate(cursor))
      }
      return result
    }

    const availabilityMetadata = new Map<
      string,
      {
        availableDates: string[]
        unavailableDates: string[]
        availableNights: number
        isFullyAvailable: boolean
      }
    >()

    const computeReservationMetadata = (property: Property) => {
      if (!shouldCheckReservations || !checkInDate || !checkOutDate) {
        return {
          availableDates: [],
          unavailableDates: [],
          availableNights: 0,
          isFullyAvailable: true,
        }
      }

      const rangeStart = checkInDate
      const rangeEnd = checkOutDate

      const cached = availabilityMetadata.get(property.id)
      if (cached) {
        return cached
      }

      const propertyReservations = reservationsByProperty.get(property.id) ?? []
      if (propertyReservations.length === 0) {
        const fullRange = enumerateDateRange(rangeStart, rangeEnd)
        const metadata = {
          availableDates: fullRange,
          unavailableDates: [],
          availableNights: fullRange.length,
          isFullyAvailable: true,
        }
        availabilityMetadata.set(property.id, metadata)
        return metadata
      }

      const reservedDates = new Set<string>()
      propertyReservations.forEach((reservation) => {
        const reservationStart = parseDateStrict(reservation.checkIn)
        const reservationEnd = parseDateStrict(reservation.checkOut)
        if (!reservationStart || !reservationEnd) return

        const overlapStart = reservationStart > rangeStart ? reservationStart : rangeStart
        const overlapEnd = reservationEnd < rangeEnd ? reservationEnd : rangeEnd

        if (overlapStart >= overlapEnd) return

        const overlapDates = enumerateDateRange(overlapStart, overlapEnd)
        overlapDates.forEach((isoDate) => reservedDates.add(isoDate))
      })

      const fullRangeDates = enumerateDateRange(rangeStart, rangeEnd)
      const unavailableDates = fullRangeDates.filter((isoDate) => reservedDates.has(isoDate))
      const availableDates = fullRangeDates.filter((isoDate) => !reservedDates.has(isoDate))

      const metadata = {
        availableDates,
        unavailableDates,
        availableNights: availableDates.length,
        isFullyAvailable: unavailableDates.length === 0,
      }

      availabilityMetadata.set(property.id, metadata)
      return metadata
    }

    const isPropertyAvailable = (property: Property) => {
      if (!checkInDate && !checkOutDate) return true

      const start = parseDateStrict(property.startOfAvailability)
      const end = parseDateStrict(property.endOfAvailability)

      if (start && end && checkInDate && checkOutDate) {
        if (start.getTime() > checkInDate.getTime() || end.getTime() < checkOutDate.getTime()) {
          return false
        }
      } else if (start && checkInDate && start.getTime() > checkInDate.getTime()) {
        return false
      } else if (end && checkOutDate && end.getTime() < checkOutDate.getTime()) {
        return false
      }

      if (!shouldCheckReservations || !checkInDate || !checkOutDate) {
        return true
      }

      const metadata = computeReservationMetadata(property)
      return metadata.isFullyAvailable
    }

    const dateFiltered = properties.filter(isPropertyAvailable)

    const enrichedProperties =
      shouldCheckReservations && checkInDate && checkOutDate
        ? dateFiltered.map((property) => {
            const metadata = computeReservationMetadata(property)
            return {
              ...property,
              availableDates: metadata.availableDates,
              unavailableDates: metadata.unavailableDates,
              availableNights: metadata.availableNights,
              isFullyAvailable: metadata.isFullyAvailable,
            }
          })
        : dateFiltered

    const typeSet = new Set<string>()
    properties.forEach((property) => {
      if (property.type) {
        typeSet.add(property.type)
      }
    })

    const availableTypes = typeSet.size ? Array.from(typeSet).sort() : [...DEFAULT_PROPERTY_TYPES]

    let filtered = enrichedProperties;
    if (propertyType && typeof propertyType === 'string' && propertyType.length > 0) {
      filtered = filtered.filter((property) => property.type.trim().toLowerCase() === propertyType.trim().toLowerCase());
    }
    if (locationString && typeof locationString === 'string' && locationString.length > 0) {
      filtered = filtered.filter((property) => (property.location || '').trim().toLowerCase() === locationString.trim().toLowerCase());
    }

    return response.status(200).json({
      properties: filtered,
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
