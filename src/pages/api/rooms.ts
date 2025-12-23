import type { NextApiRequest, NextApiResponse } from "next";
import { fetchZohoRooms } from "../../lib/zoho";

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { propertyId, slug, id } = request.query;
    const propertyIdString = Array.isArray(propertyId)
      ? propertyId[0]
      : propertyId;
    const slugString = Array.isArray(slug) ? slug[0] : slug;
    const idString = Array.isArray(id) ? id[0] : id;

    const rooms = await fetchZohoRooms({
      propertyId: propertyIdString || null,
      propertySlug: slugString || null,
      id: idString || null,
    });

    // Filter rooms to only include those with a propertyId that matches the query parameter
    const filteredRooms = rooms.filter((room) => {
      // If filtering by specific room ID, return true directly (assuming fetchZohoRooms already filtered correctly)
      if (idString && room.id === idString) return true;

      // Only include rooms that have a propertyId
      if (!room.propertyId) return false;

      // If propertyId query param is provided, only include matching rooms
      if (propertyIdString) {
        return room.propertyId === propertyIdString;
      }

      // If slug query param is provided, only include matching rooms
      if (slugString) {
        return room.propertySlug === slugString;
      }

      // If no propertyId or slug query param, include all rooms with a propertyId
      return true;
    });

    return response.status(200).json({
      rooms: filteredRooms,
    });
  } catch (error) {
    console.error("[api/rooms]", error);
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron obtener las habitaciones de Zoho.";
    return response.status(500).json({ message });
  }
};

export default handler;
