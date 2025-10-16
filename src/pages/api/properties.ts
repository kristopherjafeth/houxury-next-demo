import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_PROPERTY_TYPES } from '../../data/properties'
import { fetchZohoProperties } from '../../lib/zoho'

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const { propertyType } = request.query
    const properties = await fetchZohoProperties()

    const filtered =
      propertyType && typeof propertyType === 'string' && propertyType.length > 0
        ? properties.filter((property) => property.type === propertyType)
        : properties

    // Si no hay coincidencias para el tipo solicitado, devolvemos la lista completa para evitar dejar el grid vacío por error de datos.
    const responsePayload =
      filtered.length === 0 && propertyType ? properties : filtered


    return response.status(200).json({
      properties: responsePayload,
      availableTypes: DEFAULT_PROPERTY_TYPES,
    })
  } catch (error) {
    console.error('[api/properties]', error)
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudieron obtener las propiedades de Zoho.'
    return response.status(500).json({ message })
  }
}

export default handler
