import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_PROPERTY_TYPES } from '../../data/properties'

const handler = (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ message: 'Method Not Allowed' })
  }

  return response.status(200).json({ propertyTypes: DEFAULT_PROPERTY_TYPES })
}

export default handler
