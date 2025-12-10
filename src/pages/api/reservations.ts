import type { NextApiRequest, NextApiResponse } from "next";
import { FALLBACK_RESERVATIONS } from "../../data/reservations";
import { fetchZohoReservations } from "../../lib/zoho";

const toStringParam = (
  value: string | string[] | undefined
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { status, propertyId, checkIn, checkOut } = request.query;
    const reservations = await fetchZohoReservations({
      status: toStringParam(status) ?? null,
      propertyId: toStringParam(propertyId) ?? null,
      checkIn: toStringParam(checkIn) ?? null,
      checkOut: toStringParam(checkOut) ?? null,
    });

    console.log("zoho reservations", reservations);

    return response.status(200).json({ reservations });
  } catch (error) {
    console.error("[api/reservations]", error);
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron obtener las reservaciones de Zoho.";

    return response.status(500).json({
      message,
      reservations: FALLBACK_RESERVATIONS,
    });
  }
};

export default handler;
