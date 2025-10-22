export type Property = {
  id: string
  title: string
  location: string
  pricePerNight: string
  type: string
  imageUrl: string
  description: string
  features: string[]
  bathrooms: number | null
  rooms: number | null
  squareMeters: number | null
  rawPricePerNight: number | null
  startOfAvailability: string | null
  endOfAvailability: string | null
  availableDates?: string[]
  unavailableDates?: string[]
  availableNights?: number
  isFullyAvailable?: boolean
  slugWordpress?: string | null
}

export const DEFAULT_PROPERTY_TYPE = 'Apartamento'

export const DEFAULT_PROPERTY_TYPES = [DEFAULT_PROPERTY_TYPE]

export const DEFAULT_PROPERTY_VALUES = {
  location: 'Ubicación disponible próximamente',
  pricePerNight: 'Consultar',
  type: DEFAULT_PROPERTY_TYPE,
  description: 'Solicita más información con nuestro equipo especializado.',
  features: [] as string[],
  bathrooms: null,
  rooms: null,
  squareMeters: null,
  rawPricePerNight: null,
  imageUrl:
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=60',
  startOfAvailability: null,
  endOfAvailability: null,
  availableDates: [] as string[],
  unavailableDates: [] as string[],
  availableNights: 0,
  isFullyAvailable: true,
  slugWordpress: null,
}
