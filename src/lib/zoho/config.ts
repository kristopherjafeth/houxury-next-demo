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
    "Name,url_featured_image,slugwordpress,number_of_rooms,bathroom_quantity,property_type,Property_Type,city,price_night,Size_sqm,features,Start_of_Availability,End_of_Availability,Has_Terrace,Has_Washer",
  ROOMS:
    "Name,Record_Image,url_featured_image,Inmueble_Principal,slugwordpress,price_night,bathroom_quantity,square_meters,features,description,Has_Terrace,Has_Washer,A_C_Aire_Acondicionado,rea_descanso,Armario,Armario_Empotrado,Balc_n,Ba_o_Privado,Buena_ventilaci_n_natural,Calefacci_n,Cama_doble,Canap_con_almacenamiento,Cerradura_digital_Akiles,Cocina_privada,Comedor,Cortinas_opacas,Enchufes_m_ltiples_USB,Escritorio,Espejo_de_cuerpo_entero,Extractor,Extractor_de_humo,Habitaci_n_Amueblada,L_mpara_de_escritorio,L_mpara_interior,Lavadora,Maleteros",
  RESERVATIONS: "Check_in,Check_out,reservation_date,room_reserved",
};

export const MAX_RESERVATIONS = 50;
