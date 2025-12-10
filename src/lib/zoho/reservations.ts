import type { Reservation } from "../../data/reservations";
import { DEFAULT_RESERVATION_VALUES } from "../../data/reservations";
import { fetchAccessToken } from "./auth";
import { ZOHO_CONFIG, FIELDS, MAX_RESERVATIONS } from "./config";
import type { ZohoReservationRecord } from "./types";
import {
  extractLookup,
  formatReservationAmount,
  getStringField,
  normalizeImageValue,
  normalizeTags,
  safeNumber,
} from "./utils";

export type ZohoReservationFilters = {
  status?: string | null;
  propertyId?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
};

const mapRecordToReservation = (record: ZohoReservationRecord): Reservation => {
  const propertyLookup = extractLookup(
    record.room_reserved ?? record.Connected_To__s
  );
  const ownerLookup = extractLookup(record.Owner);

  const code =
    getStringField(record, "Name") ?? DEFAULT_RESERVATION_VALUES.code;
  const propertyName =
    propertyLookup.name ?? DEFAULT_RESERVATION_VALUES.propertyName;
  const guestName =
    getStringField(record, "client_name") ??
    DEFAULT_RESERVATION_VALUES.guestName;

  const status =
    getStringField(record, "status") ?? DEFAULT_RESERVATION_VALUES.status;
  const checkIn = getStringField(record, "Check_in");
  const checkOut = getStringField(record, "Check_out");
  const notes = null;
  const guestCount = null;
  const totalPrice = null;
  const formattedTotalPrice = formatReservationAmount(totalPrice);
  const reservationDate = getStringField(record, "reservation_date");
  const email =
    getStringField(record, "Email") ?? DEFAULT_RESERVATION_VALUES.email;
  const secondaryEmail =
    getStringField(record, "Secondary_Email") ??
    DEFAULT_RESERVATION_VALUES.secondaryEmail;
  const phone =
    getStringField(record, "phone") ?? DEFAULT_RESERVATION_VALUES.phone;
  const reservationDuration = safeNumber(record.reservation_duration);
  const tags = normalizeTags(record.Tag);
  const imageUrl = normalizeImageValue(record.Url_Workdrive);
  const ownerName = ownerLookup.name ?? DEFAULT_RESERVATION_VALUES.ownerName;

  return {
    id: record.id,
    code,
    propertyId: propertyLookup.id,
    propertyName,
    guestName,
    checkIn,
    checkOut,
    status,
    guestCount,
    totalPrice,
    formattedTotalPrice,
    createdAt: reservationDate,
    notes,
    email,
    secondaryEmail,
    phone,
    reservationDate,
    reservationDuration,
    ownerName,
    tags,
    imageUrl,
  };
};

const buildReservationCriteria = (filters?: ZohoReservationFilters) => {
  if (!filters) return "";
  const parts: string[] = [];

  if (filters.status) {
    parts.push(`(Status:equals:${filters.status})`);
  }

  if (filters.propertyId) {
    parts.push(`(room_reserved.id:equals:${filters.propertyId})`);
  }

  if (filters.checkIn) {
    parts.push(`(Check_out:after_or_equal:${filters.checkIn})`);
  }

  if (filters.checkOut) {
    parts.push(`(Check_in:before_or_equal:${filters.checkOut})`);
  }

  if (parts.length === 0) return "";
  return parts.join(" and ");
};

export const fetchZohoReservations = async (
  filters?: ZohoReservationFilters
) => {
  const token = await fetchAccessToken();
  const criteria = buildReservationCriteria(filters);
  const url = criteria
    ? `${ZOHO_CONFIG.RESERVATIONS_ENDPOINT}?fields=${encodeURIComponent(
        FIELDS.RESERVATIONS
      )}&criteria=${encodeURIComponent(criteria)}`
    : `${ZOHO_CONFIG.RESERVATIONS_ENDPOINT}?fields=${encodeURIComponent(
        FIELDS.RESERVATIONS
      )}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
    },
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(
      `No se pudieron obtener las reservaciones: ${response.status} ${rawBody}`
    );
  }

  if (!rawBody || rawBody.trim().length === 0) {
    return [];
  }

  let payload: { data?: ZohoReservationRecord[] };
  try {
    payload = JSON.parse(rawBody) as { data?: ZohoReservationRecord[] };
  } catch (parseError) {
    throw new Error(
      `No se pudieron interpretar las reservaciones de Zoho: ${
        (parseError as Error).message
      }`
    );
  }

  const records = payload.data ?? [];
  const limitedRecords = records.slice(0, MAX_RESERVATIONS);

  return limitedRecords.map((record) => mapRecordToReservation(record));
};

export const searchZohoReservationsByCoql = async (
  whereClause: string,
  limit: number = 50,
  offset: number = 0
) => {
  const token = await fetchAccessToken();
  const moduleName = process.env.ZOHO_RESERVATIONS_MODULE ?? "Reservaciones";

  const selectQuery = `select ${FIELDS.RESERVATIONS} from ${moduleName} where ${whereClause} limit ${offset}, ${limit}`;

  console.log("QUERY ACTUAL", selectQuery);

  const response = await fetch(ZOHO_CONFIG.COQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      select_query: selectQuery,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error en búsqueda COQL: ${response.status} ${text}`);
  }

  const rawBody = await response.text();

  if (!rawBody || rawBody.trim().length === 0) {
    return [];
  }

  let payload: { data?: ZohoReservationRecord[] };
  try {
    payload = JSON.parse(rawBody) as { data?: ZohoReservationRecord[] };
  } catch (parseError) {
    throw new Error(
      `Error al interpretar respuesta COQL: ${(parseError as Error).message}`
    );
  }

  const records = payload.data ?? [];

  return records.map((record) => mapRecordToReservation(record));
};
