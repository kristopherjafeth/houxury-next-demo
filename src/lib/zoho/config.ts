export const ZOHO_CONFIG = {
  TOKEN_URL: "https://accounts.zoho.eu/oauth/v2/token",
  PROPERTIES_ENDPOINT: "https://www.zohoapis.eu/crm/v8/Inmuebles",
  // Make sure this evaluates correctly at runtime
  get RESERVATIONS_ENDPOINT() {
    return `https://www.zohoapis.eu/crm/v8/${
      process.env.ZOHO_RESERVATIONS_MODULE ?? "Reservaciones"
    }`;
  },
  ROOMS_ENDPOINT: "https://www.zohoapis.eu/crm/v8/Habitaciones",
  COQL_ENDPOINT: "https://www.zohoapis.eu/crm/v8/coql",
};

export const FIELDS = {
  PROPERTIES:
    "Name,url_featured_image,slugwordpress,number_of_rooms,bathroom_quantity,property_type,Property_Type,city,price_night,Size_sqm,features,Start_of_Availability,End_of_Availability",
  ROOMS:
    "Name,Record_Image,url_featured_image,Inmueble_Principal,slugwordpress",
  RESERVATIONS: "Check_in,Check_out,reservation_date,room_reserved",
};

export const MAX_RESERVATIONS = 50;
