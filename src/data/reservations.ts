export type Reservation = {
  id: string
  code: string
  propertyId: string | null
  propertyName: string
  guestName: string
  checkIn: string | null
  checkOut: string | null
  status: string
  guestCount: number | null
  totalPrice: number | null
  formattedTotalPrice: string
  createdAt: string | null
  notes: string | null
  email: string | null
  secondaryEmail: string | null
  phone: string | null
  reservationDate: string | null
  reservationDuration: number | null
  ownerName: string | null
  tags: string[]
  imageUrl: string | null
}

export const DEFAULT_RESERVATION_VALUES = {
  code: 'RES-0000',
  propertyName: 'Propiedad no especificada',
  guestName: 'Invitado sin nombre',
  status: 'Pendiente',
  formattedTotalPrice: '—',
  email: null,
  secondaryEmail: null,
  phone: null,
  ownerName: null,
  reservationDate: null,
  reservationDuration: null,
  tags: [] as string[],
  imageUrl: null,
}

export const FALLBACK_RESERVATIONS: Reservation[] = [
  {
    id: 'fallback-1',
    code: 'RES-0001',
    propertyId: null,
    propertyName: 'Reserva de ejemplo',
    guestName: 'Invitado Demo',
    checkIn: null,
    checkOut: null,
    status: DEFAULT_RESERVATION_VALUES.status,
    guestCount: null,
    totalPrice: null,
    formattedTotalPrice: DEFAULT_RESERVATION_VALUES.formattedTotalPrice,
    createdAt: null,
    notes: null,
    email: DEFAULT_RESERVATION_VALUES.email,
    secondaryEmail: DEFAULT_RESERVATION_VALUES.secondaryEmail,
    phone: DEFAULT_RESERVATION_VALUES.phone,
    reservationDate: DEFAULT_RESERVATION_VALUES.reservationDate,
    reservationDuration: DEFAULT_RESERVATION_VALUES.reservationDuration,
    ownerName: DEFAULT_RESERVATION_VALUES.ownerName,
    tags: DEFAULT_RESERVATION_VALUES.tags,
    imageUrl: DEFAULT_RESERVATION_VALUES.imageUrl,
  },
]
