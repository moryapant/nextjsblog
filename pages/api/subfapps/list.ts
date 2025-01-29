import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const subfapps = await executeQuery({
      query: 'SELECT * FROM subfapps',
      values: []
    })

    res.status(200).json(subfapps)
  } catch (error) {
    console.error('Error fetching subfapps:', error)
    res.status(500).json({ message: 'Error fetching subfapps' })
  }
} 