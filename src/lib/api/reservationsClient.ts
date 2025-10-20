import type { Reservation } from '../../data/reservations'

export type ReservationFilters = {
  status?: string
  propertyId?: string
  checkIn?: string
  checkOut?: string
}

export type ReservationsApiResponse = {
  reservations: Reservation[]
  message?: string
}

/**
 * Lógica reutilizable para consultar la API de reservaciones.
 * Devuelve el payload crudo para que el componente consumidor maneje el estado.
 */
export const fetchReservations = async (filters: ReservationFilters = {}) => {
  const query = new URLSearchParams()

  if (filters.status) {
    query.append('status', filters.status)
  }
  if (filters.propertyId) {
    query.append('propertyId', filters.propertyId)
  }
  if (filters.checkIn) {
    query.append('checkIn', filters.checkIn)
  }
  if (filters.checkOut) {
    query.append('checkOut', filters.checkOut)
  }

  const url = query.toString() ? `/api/reservations?${query.toString()}` : '/api/reservations'
  const response = await fetch(url)
  const data: ReservationsApiResponse = await response.json()

  if (!response.ok) {
    throw new Error(data.message ?? 'No se pudieron cargar las reservaciones')
  }

  return data
}
