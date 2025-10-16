export type Property = {
  id: string
  title: string
  location: string
  pricePerNight: string
  type: string
  imageUrl: string
  description: string
  features: string[]
}

export const DEFAULT_PROPERTY_TYPE = 'Inmueble'

export const DEFAULT_PROPERTY_TYPES = [DEFAULT_PROPERTY_TYPE]

export const DEFAULT_PROPERTY_VALUES = {
  location: 'Ubicación disponible próximamente',
  pricePerNight: 'Consultar',
  type: DEFAULT_PROPERTY_TYPE,
  description: 'Solicita más información con nuestro equipo especializado.',
  features: [] as string[],
  imageUrl:
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=60',
}
