import type { NextApiRequest, NextApiResponse } from "next";
import { DEFAULT_PROPERTY_TYPES } from "../../data/properties";
import type { Reservation } from "../../data/reservations";
import { fetchZohoProperties } from "../../lib/zoho";

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { propertyType, checkIn, checkOut, location } = request.query;
    const checkInString = Array.isArray(checkIn) ? checkIn[0] : checkIn;
    const checkOutString = Array.isArray(checkOut) ? checkOut[0] : checkOut;
    const locationString = Array.isArray(location) ? location[0] : location;

    // Basic date validation
    if (checkInString && checkOutString && checkOutString <= checkInString) {
      return response.status(400).json({
        message: "La fecha de salida debe ser posterior a la fecha de entrada.",
      });
    }

    // 1. Fetch properties (Zoho API handles seasonal availability if dates are passed)
    const properties = await fetchZohoProperties({
      propertyType: Array.isArray(propertyType)
        ? propertyType
        : (propertyType as string | undefined),
      checkIn: checkInString || null,
      checkOut: checkOutString || null,
      location: locationString || null,
    });

    console.log("properties", properties);

    let availableProperties = properties;

    // 2. If dates are provided, filter out booked properties using COQL
    if (checkInString && checkOutString) {
      try {
        // Find reservations that overlap with the requested range
        // Logic: (Check_in < RequestEnd) AND (Check_out > RequestStart)
        // AND Status is not Cancelled

        const { searchZohoReservationsByCoql } = await import(
          "../../lib/zoho/reservations"
        );
        const { getRoomsPropertyIds } = await import("../../lib/zoho/rooms");

        const whereClause = `((Check_in <= '${checkOutString}') and (Check_out >= '${checkInString}')) and (status != 'Cancelada')`;

        // Get reservations that conflict with the dates
        // Pagination Strategy: Fetch in chunks of 200 until no more records are found
        // This ensures we don't miss any conflicts even with thousands of reservations
        const allConflictingReservations: Reservation[] = [];
        let offset = 0;
        const limit = 200;
        let hasMore = true;

        while (hasMore) {
          const batch = await searchZohoReservationsByCoql(
            whereClause,
            limit,
            offset
          );

          if (batch.length === 0) {
            hasMore = false;
          } else {
            allConflictingReservations.push(...batch);
            offset += limit;
            // Optimization: If we got fewer records than asked, we are done
            if (batch.length < limit) {
              hasMore = false;
            }
          }
        }

        // Extract Room IDs from the conflicting reservations
        const reservedRoomIds = new Set<string>();
        allConflictingReservations.forEach((res) => {
          if (res.propertyId) reservedRoomIds.add(res.propertyId);
        });

        const fullyBookedPropertyIds = new Set<string>();

        if (reservedRoomIds.size > 0) {
          // Efficiently find which Property each Room belongs to
          // This avoids fetching all rooms
          const roomPropertyMap = await getRoomsPropertyIds(
            Array.from(reservedRoomIds)
          );

          // Count occupied rooms per property
          const occupiedRoomsCountByProperty = new Map<string, number>();

          reservedRoomIds.forEach((roomId) => {
            const propertyId = roomPropertyMap.get(roomId);
            if (propertyId) {
              const currentOccupied =
                occupiedRoomsCountByProperty.get(propertyId) || 0;
              occupiedRoomsCountByProperty.set(propertyId, currentOccupied + 1);
            }
          });

          // Determine which properties are FULLY booked
          // Rule: Hide only if Occupied Rooms >= Total Rooms (defined in Property record)
          properties.forEach((property) => {
            // property.rooms comes from 'number_of_rooms' in Zoho
            const total = property.rooms ?? 0;
            const occupied = occupiedRoomsCountByProperty.get(property.id) || 0;

            if (total > 0 && occupied >= total) {
              fullyBookedPropertyIds.add(property.id);
            }
          });
        }

        availableProperties = properties.filter(
          (p) => !fullyBookedPropertyIds.has(p.id)
        );
      } catch (reservationError) {
        console.error(
          "[api/properties] Error checking reservations:",
          reservationError
        );
        // Optionally fail or return all properties (risk of double booking)
        // For now, let's log and proceed, but ideally we should alert.
      }
    }

    // 3. Apply memory filters for static fields if needed (though fetchZohoProperties handles most)
    // fetchZohoProperties maps the response, but client-side filtering below ensures case-insensitivity consistency

    let filtered = availableProperties;
    if (
      propertyType &&
      typeof propertyType === "string" &&
      propertyType.length > 0
    ) {
      filtered = filtered.filter(
        (property) =>
          property.type.trim().toLowerCase() ===
          propertyType.trim().toLowerCase()
      );
    }
    if (
      locationString &&
      typeof locationString === "string" &&
      locationString.length > 0
    ) {
      filtered = filtered.filter(
        (property) =>
          (property.city || "").trim().toLowerCase() ===
          locationString.trim().toLowerCase()
      );
    }

    // Extract available types from the resulting properties (or original set if preferred)
    const typeSet = new Set<string>();
    properties.forEach((property) => {
      // Use 'properties' (all) or 'filtered'? Typical to show types from valid results.
      if (property.type) typeSet.add(property.type);
    });
    const availableTypes = typeSet.size
      ? Array.from(typeSet).sort()
      : [...DEFAULT_PROPERTY_TYPES];

    return response.status(200).json({
      properties: filtered,
      availableTypes,
    });
  } catch (error) {
    console.error("[api/properties]", error);
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron obtener las propiedades de Zoho.";
    return response.status(500).json({ message });
  }
};

export default handler;
