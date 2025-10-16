import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_PROPERTY_TYPES } from '../../data/properties'
import { fetchZohoPropertyTypes } from '../../lib/zoho'

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const types = await fetchZohoPropertyTypes()
    return response.status(200).json({ propertyTypes: types })
  } catch (error) {
    console.error('[api/property-types]', error)
    return response.status(200).json({ propertyTypes: DEFAULT_PROPERTY_TYPES })
  }
}

export default handler
