import { DEFAULT_PROPERTY_VALUES } from "../../data/properties";
import { fetchAccessToken } from "./auth";
import { ZOHO_CONFIG, FIELDS } from "./config";
import type { ZohoRecord } from "./types";
import {
  extractLookup,
  formatPricePerNight,
  getStringField,
  safeNumber,
} from "./utils";

export type ZohoRoom = {
  id: string;
  name: string;
  imageUrl: string;
  propertyId: string | null;
  propertyName: string | null;
  propertySlug: string | null;
  pricePerNight: string;
  bathrooms: number | null;
  squareMeters: number | null;
  features: string[];
  description: string;
  hasTerrace: boolean | null;
  hasWasher: boolean | null;
};

const mapRecordToRoom = (record: ZohoRecord): ZohoRoom => {
  const name = record.Name?.trim() || "Habitación sin nombre";
  const imageUrl = record.url_featured_image
    ? String(record.url_featured_image)
    : DEFAULT_PROPERTY_VALUES.imageUrl;

  const propertyLookup = extractLookup(record.Inmueble_Principal);
  const propertySlug = getStringField(record, "slugwordpress");

  const rawPriceNight = safeNumber(record.price_night);
  const bathrooms = safeNumber(record.bathroom_quantity);
  const squareMeters = safeNumber(record.square_meters);

  const pricePerNight = formatPricePerNight(rawPriceNight);

  const featureList = Array.isArray(record.features)
    ? (record.features as unknown[])
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0
        )
        .map((value) => value.trim())
    : [];

  const description =
    typeof record.description === "string" ? record.description : "";

  const hasTerrace =
    typeof record.Has_Terrace === "boolean" ? record.Has_Terrace : null;
  const hasWasher =
    typeof record.Has_Washer === "boolean" ? record.Has_Washer : null;

  return {
    id: record.id,
    name,
    imageUrl,
    propertyId: propertyLookup.id,
    propertyName: propertyLookup.name,
    propertySlug,
    pricePerNight,
    bathrooms,
    squareMeters,
    features: featureList,
    description,
    hasTerrace,
    hasWasher,
  };
};

export type ZohoRoomFilters = {
  propertyId?: string | null;
  propertySlug?: string | null;
  id?: string | null;
};

const buildRoomCriteria = (filters?: ZohoRoomFilters) => {
  if (!filters) return "";
  const parts: string[] = [];

  if (filters.id) {
    parts.push(`(id:equals:${filters.id})`);
  }

  if (filters.propertyId) {
    parts.push(`(Inmueble_Principal.id:equals:${filters.propertyId})`);
  }

  if (filters.propertySlug) {
    parts.push(
      `(Inmueble_Principal.slugwordpress:equals:${filters.propertySlug})`
    );
  }

  if (parts.length === 0) return "";
  return parts.join(" and ");
};

export const fetchZohoRooms = async (filters?: ZohoRoomFilters) => {
  const token = await fetchAccessToken();

  if (filters?.id) {
    const url = `${ZOHO_CONFIG.ROOMS_ENDPOINT}/${
      filters.id
    }?fields=${encodeURIComponent(FIELDS.ROOMS)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    });

    if (!response.ok) {
      // If 204 No Content (not found) or 404, return empty
      if (response.status === 204 || response.status === 404) return [];

      const text = await response.text();
      throw new Error(
        `No se pudo obtener la habitación: ${response.status} ${text}`
      );
    }

    const payload: { data?: ZohoRecord[] } = await response.json();
    const records = payload.data ?? [];
    return records.map(mapRecordToRoom);
  }

  const criteria = buildRoomCriteria(filters);
  const url = criteria
    ? `${ZOHO_CONFIG.ROOMS_ENDPOINT}?fields=${encodeURIComponent(
        FIELDS.ROOMS
      )}&criteria=${encodeURIComponent(criteria)}`
    : `${ZOHO_CONFIG.ROOMS_ENDPOINT}?fields=${encodeURIComponent(
        FIELDS.ROOMS
      )}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `No se pudieron obtener las habitaciones: ${response.status} ${text}`
    );
  }

  const payload: { data?: ZohoRecord[] } = await response.json();
  const records = payload.data ?? [];

  return records.map(mapRecordToRoom);
};

export const getRoomsPropertyIds = async (
  roomIds: string[]
): Promise<Map<string, string>> => {
  if (roomIds.length === 0) return new Map();

  const token = await fetchAccessToken();
  const map = new Map<string, string>();
  const BATCH_SIZE = 50;

  // Helper to process a batch
  const processBatch = async (ids: string[]) => {
    const idsFormatted = ids.map((id) => `'${id}'`).join(",");
    const selectQuery = `select Inmueble_Principal from Habitaciones where id in (${idsFormatted})`;

    try {
      const response = await fetch(ZOHO_CONFIG.COQL_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ select_query: selectQuery }),
      });

      if (!response.ok) {
        console.error(
          "Error fetching room details via COQL",
          await response.text()
        );
        return;
      }

      const raw = await response.text();
      if (!raw) return;

      const payload = JSON.parse(raw) as { data?: ZohoRecord[] };
      const records = payload.data ?? [];

      records.forEach((r) => {
        const lookup = extractLookup(r.Inmueble_Principal);
        if (lookup.id) {
          map.set(r.id, lookup.id);
        }
      });
    } catch (err) {
      console.error("Error processing room batch property lookup", err);
    }
  };

  // Create batches
  const batches = [];
  for (let i = 0; i < roomIds.length; i += BATCH_SIZE) {
    batches.push(roomIds.slice(i, i + BATCH_SIZE));
  }

  // Execute in parallel
  await Promise.all(batches.map(processBatch));

  return map;
};
