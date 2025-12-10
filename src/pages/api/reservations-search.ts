import type { NextApiRequest, NextApiResponse } from "next";
import { searchZohoReservationsByCoql } from "../../lib/zoho/reservations";

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", ["GET", "POST"]);
    return response.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    let limit = 50;
    let offset = 0;
    let whereClause = "";

    if (request.method === "GET") {
      const { query, limit: l, offset: o } = request.query;
      if (typeof query === "string") {
        whereClause = query;
      }
      if (l) limit = parseInt(l as string);
      if (o) offset = parseInt(o as string);
    } else {
      const body = request.body;
      const parsedBody = typeof body === "string" ? JSON.parse(body) : body;
      const q = parsedBody.query;
      if (typeof q === "string") {
        whereClause = q;
      }
      if (parsedBody.limit) limit = parseInt(parsedBody.limit);
      if (parsedBody.offset) offset = parseInt(parsedBody.offset);
    }

    if (!whereClause || whereClause.trim().length === 0) {
      return response.status(400).json({
        message:
          'Falta el parámetro de consulta. Proporciona "query" en el body (POST) o como parámetro URL (GET) con la cláusula WHERE de COQL.',
      });
    }

    const reservations = await searchZohoReservationsByCoql(
      whereClause,
      limit,
      offset
    );
    return response.status(200).json({ reservations });
  } catch (error) {
    console.error("[api/reservations-search]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error interno en la búsqueda COQL.";

    // Zoho COQL errors often come with syntax details, good to pass them through
    return response.status(500).json({ message });
  }
};

export default handler;
