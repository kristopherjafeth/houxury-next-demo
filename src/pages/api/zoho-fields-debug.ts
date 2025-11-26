import type { NextApiRequest, NextApiResponse } from 'next'

const TOKEN_URL = 'https://accounts.zoho.eu/oauth/v2/token'
const FIELDS_ENDPOINT = 'https://www.zohoapis.eu/crm/v8/settings/fields?module=Inmuebles'

let cachedToken: { token: string; expiresAt: number } | null = null

const getCredentials = () => {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Credenciales de Zoho no configuradas')
  }

  return { refreshToken, clientId, clientSecret }
}

const fetchAccessToken = async () => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const { refreshToken, clientId, clientSecret } = getCredentials()
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  })

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`No se pudo obtener el access token: ${response.status}`)
  }

  const data: { access_token?: string; expires_in?: number } = await response.json()

  if (!data.access_token) {
    throw new Error('No access_token en respuesta')
  }

  const expiresIn = data.expires_in ? data.expires_in * 1000 : 55 * 60 * 1000
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn,
  }

  return data.access_token
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await fetchAccessToken()
    
    const response = await fetch(FIELDS_ENDPOINT, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Error al obtener campos: ${response.status} ${text}`)
    }

    const data = await response.json()
    
    // Define type for Zoho field structure
    type ZohoField = {
      field_label?: string
      api_name?: string
      data_type?: string
      custom_field?: boolean
    }
    
    // Extraer solo los campos relevantes para debugging
    const fields: ZohoField[] = data.fields?.map((field: ZohoField) => ({
      field_label: field.field_label,
      api_name: field.api_name,
      data_type: field.data_type,
      custom_field: field.custom_field,
    })) || []

    // Filtrar campos que podrían contener URLs o imágenes
    const imageRelatedFields = fields.filter((f: ZohoField) => 
      f.api_name?.toLowerCase().includes('url') || 
      f.api_name?.toLowerCase().includes('image') ||
      f.api_name?.toLowerCase().includes('photo') ||
      f.api_name?.toLowerCase().includes('picture') ||
      f.api_name?.toLowerCase().includes('workdrive')
    )

    res.status(200).json({
      total_fields: fields.length,
      all_fields: fields,
      image_related_fields: imageRelatedFields,
      suggested_api_names: {
        note: "Busca estos API names en Zoho CRM y úsalos en PROPERTIES_FIELDS",
        fields_to_check: [
          "Url_Workdrive",
          "url_workdrive", 
          "URL_Workdrive",
          "price_night",
          "location",
          "square_meters",
          "Start_of_Availability",
          "End_of_Availability",
          "features"
        ]
      }
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    })
  }
}
