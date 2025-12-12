import type { Property } from "../../data/properties";
import {
  DEFAULT_PROPERTY_TYPES,
  DEFAULT_PROPERTY_VALUES,
} from "../../data/properties";
import { fetchAccessToken } from "./auth";
import { ZOHO_CONFIG, FIELDS } from "./config";
import type { ZohoRecord } from "./types";
import { formatPricePerNight, getStringField, safeNumber } from "./utils";

export type ZohoFilters = {
  propertyType?: string | string[] | null;
  checkIn?: string | null;
  checkOut?: string | null;
  location?: string | null;
};

const mapRecordToProperty = async (record: ZohoRecord): Promise<Property> => {
  const title = record.Name?.trim() || "Inmueble sin título";
  const imageUrl =
    (typeof record.url_featured_image === "string"
      ? record.url_featured_image
      : null) || DEFAULT_PROPERTY_VALUES.imageUrl;
  const city = record.city || DEFAULT_PROPERTY_VALUES.city;
  const propertyType =
    record.property_type?.trim() ||
    record.Property_Type?.trim() ||
    DEFAULT_PROPERTY_TYPES[0];

  if (!record.property_type && !record.Property_Type) {
    console.warn(
      `[mapRecordToProperty] Warning: Property type missing for record ${record.id} (${record.Name}). Defaulting to ${propertyType}. Record keys:`,
      Object.keys(record)
    );
  }

  const rawPriceNight = safeNumber(record.price_night);
  const bathrooms = safeNumber(record.bathroom_quantity);
  const rooms = safeNumber(record.number_of_rooms);
  const squareMeters = safeNumber(record.Size_sqm || record.square_meters);

  const pricePerNight = formatPricePerNight(rawPriceNight);

  const featureList = Array.isArray(record.features)
    ? (record.features as unknown[])
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0
        )
        .map((value) => value.trim())
    : [...DEFAULT_PROPERTY_VALUES.features];

  return {
    id: record.id,
    title,
    city,
    pricePerNight,
    type: propertyType,
    imageUrl,
    description: DEFAULT_PROPERTY_VALUES.description,
    features: featureList,
    bathrooms,
    rooms,
    squareMeters,
    rawPricePerNight: rawPriceNight,
    startOfAvailability: getStringField(
      record,
      "startOfAvailability",
      "Start_of_Availability",
      "start_of_availability"
    ),
    endOfAvailability: getStringField(
      record,
      "endOfAvailability",
      "End_of_Availability",
      "end_of_availability"
    ),
    slugWordpress: record.slugwordpress,
  };
};

const buildCriteria = (filters?: ZohoFilters) => {
  if (!filters) return "";
  const parts: string[] = [];

  if (filters.propertyType) {
    if (Array.isArray(filters.propertyType)) {
      const typeConditions = filters.propertyType
        .map((t) => `(property_type:equals:${t})`)
        .join(" or ");
      parts.push(`(${typeConditions})`);
    } else {
      parts.push(`(property_type:equals:${filters.propertyType})`);
    }
  }

  if (filters.location) {
    parts.push(`(city:equals:${filters.location})`);
  }

  if (filters.checkIn) {
    parts.push(`(Start_of_Availability:before_or_equal:${filters.checkIn})`);
  }

  if (filters.checkOut) {
    parts.push(`(End_of_Availability:after_or_equal:${filters.checkOut})`);
  }

  if (parts.length === 0) return "";
  return parts.join(" and ");
};

export const fetchZohoProperties = async (filters?: ZohoFilters) => {
  const token = await fetchAccessToken();
  const criteria = buildCriteria(filters);
  const url = criteria
    ? `${ZOHO_CONFIG.PROPERTIES_ENDPOINT}?fields=${encodeURIComponent(
        FIELDS.PROPERTIES
      )}&criteria=${encodeURIComponent(criteria)}`
    : `${ZOHO_CONFIG.PROPERTIES_ENDPOINT}?fields=${encodeURIComponent(
        FIELDS.PROPERTIES
      )}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `No se pudieron obtener los inmuebles: ${response.status} ${text}`
    );
  }

  const payload: { data?: ZohoRecord[] } = await response.json();
  const records = payload.data ?? [];

  const properties = await Promise.all(
    records.map((record) => mapRecordToProperty(record))
  );

  return properties;
};

export const fetchZohoPropertyTypes = async () => {
  const token = await fetchAccessToken();
  const response = await fetch(
    `${ZOHO_CONFIG.PROPERTIES_ENDPOINT}?fields=property_type,Property_Type`,
    {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `No se pudieron obtener los tipos de inmueble: ${response.status} ${text}`
    );
  }

  const payload: {
    data?: Array<{
      property_type?: string | null;
      Property_Type?: string | null;
    }>;
  } = await response.json();
  console.log("payload", payload);

  const uniqueTypes = new Set<string>();
  payload.data?.forEach((record) => {
    const type = (record.property_type || record.Property_Type)?.trim();
    if (type) {
      uniqueTypes.add(type);
    }
  });

  const combinedTypes = new Set([
    ...Array.from(uniqueTypes),
    ...DEFAULT_PROPERTY_TYPES,
  ]);

  return Array.from(combinedTypes).sort();
};
