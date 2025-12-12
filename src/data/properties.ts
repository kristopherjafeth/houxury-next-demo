export type Property = {
  id: string;
  title: string;
  city: string;
  pricePerNight: string;
  type: string;
  imageUrl: string;
  description: string;
  features: string[];
  bathrooms: number | null;
  rooms: number | null;
  squareMeters: number | null;
  rawPricePerNight: number | null;
  startOfAvailability: string | null;
  endOfAvailability: string | null;
  availableDates?: string[];
  unavailableDates?: string[];
  availableNights?: number;
  isFullyAvailable?: boolean;
  hasTerrace?: boolean | null;
  hasWasher?: boolean | null;
  slugWordpress?: string | null;
};

export const DEFAULT_PROPERTY_TYPES = ["Coliving", "Corporativo", "Turismo"];

export const DEFAULT_PROPERTY_VALUES = {
  city: "Ubicación disponible próximamente",
  pricePerNight: "Consultar",
  type: DEFAULT_PROPERTY_TYPES[0],
  description: "Solicita más información con nuestro equipo especializado.",
  features: [] as string[],
  bathrooms: null,
  rooms: null,
  squareMeters: null,
  rawPricePerNight: null,
  imageUrl: "/placeholder.png",
  startOfAvailability: null,
  endOfAvailability: null,
  availableDates: [] as string[],
  unavailableDates: [] as string[],
  availableNights: 0,
  isFullyAvailable: true,
  hasTerrace: null as boolean | null,
  hasWasher: null as boolean | null,
  slugWordpress: null,
};
