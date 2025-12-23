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
  detailedAmenities: Record<string, string>;
};

const DETAIL_FIELDS_MAPPING: Record<string, string> = {
  "Tamaño de la Habitación (m²)": "square_meters",
  "Tipo de Habitación": "Tipo_de_Habitaci_n",
  "Tipo de Cama": "Tipo_de_Cama",
  Orientación: "Orientaci_n",
  "Ventana a la Calle": "Ventana_a_la_Calle",
  "Aire acondicionado": "A_C_Aire_Acondicionado",
  "Habitación Amueblada": "Habitaci_n_Amueblada",
  "Armario Empotrado": "Armario_Empotrado",
  Escritorio: "Escritorio",
  "Baño Privado": "Ba_o_Privado",
  Vestidor: "Vestidor",
  "Canapé con almacenamiento": "Canap_con_almacenamiento",
  Mesillas: "Mesillas",
  "Lámpara interior": "L_mpara_interior",
  "Espejo de cuerpo entero": "Espejo_de_cuerpo_entero",
  Armario: "Armario",
  "TV en habitación": "TV_en_habitaci_n",
  "WiFi alta velocidad": "WiFi_alta_velocidad",
  "Cerradura digital Akiles": "Cerradura_digital_Akiles",
  Calefacción: "Calefacci_n",
  "Buena ventilación natural": "Buena_ventilaci_n_natural",
  "Cocina privada": "Cocina_privada",
  Extractor: "Extractor",
  Lavadora: "Lavadora",
  Balcón: "Balc_n",
  Terraza: "Has_Terrace",
  Patio: "Patio",
  "Vistas al mar": "Vistas_al_mar",
  "Vistas espectaculares del centro": "Vistas_espectaculares_del_centro",
  "Vistas al campo": "Vistas_al_campo",
  "Cama doble": "Cama_doble",
  "Cortinas opacas": "Cortinas_opacas",
  "Ventanas insonorizadas": "Ventanas_insonorizadas",
  "Silla ergonómica": "Silla_ergon_mica",
  "Lámpara de escritorio": "L_mpara_de_escritorio",
  "Enchufes múltiples / USB": "Enchufes_m_ltiples_USB",
  "Área descanso": "rea_descanso",
  Comedor: "Comedor",
  Secadora: "Secadora",
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

  // New specific fields based on API names
  const amenityFields: Record<string, string> = {
    A_C_Aire_Acondicionado: "Aire acondicionado",
    rea_descanso: "Área descanso",
    Armario: "Armario",
    Armario_Empotrado: "Armario Empotrado",
    Balc_n: "Balcón",
    Ba_o_Privado: "Baño Privado",
    Buena_ventilaci_n_natural: "Buena ventilación natural",
    Calefacci_n: "Calefacción",
    Cama_doble: "Cama doble",
    Canap_con_almacenamiento: "Canapé con almacenamiento",
    Cerradura_digital_Akiles: "Cerradura digital Akiles",
    Cocina_privada: "Cocina privada",
    Comedor: "Comedor",
    Cortinas_opacas: "Cortinas opacas",
    Enchufes_m_ltiples_USB: "Enchufes múltiples / USB",
    Escritorio: "Escritorio",
    Espejo_de_cuerpo_entero: "Espejo de cuerpo entero",
    Extractor: "Extractor",
    Extractor_de_humo: "Extractor de humo",
    Habitaci_n_Amueblada: "Habitación Amueblada",
    L_mpara_de_escritorio: "Lámpara de escritorio",
    L_mpara_interior: "Lámpara interior",
    Lavadora: "Lavadora",
    Maleteros: "Maleteros",
  };

  const dynamicFeatures: string[] = [];
  Object.entries(amenityFields).forEach(([key, label]) => {
    if (record[key] === true) {
      dynamicFeatures.push(label);
    }
  });

  const allFeatures = Array.from(new Set([...featureList, ...dynamicFeatures]));

  // Build detailed amenities map
  const detailedAmenities: Record<string, string> = {};
  Object.entries(DETAIL_FIELDS_MAPPING).forEach(([label, apiKey]) => {
    const value = record[apiKey];
    if (typeof value === "boolean") {
      detailedAmenities[label] = value ? "Sí" : "No";
    } else if (value === null || value === undefined || value === "") {
      detailedAmenities[label] = "-";
    } else {
      detailedAmenities[label] = String(value);
    }
  });

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
    features: allFeatures,
    description,
    hasTerrace,
    hasWasher,
    detailedAmenities,
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
    const url = `${ZOHO_CONFIG.ROOMS_ENDPOINT}/${filters.id}`;
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
