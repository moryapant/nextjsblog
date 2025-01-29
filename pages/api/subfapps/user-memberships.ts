import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ message: 'Missing user ID' })
    }

    const memberships = await executeQuery({
      query: `
        SELECT subfapp_name
        FROM subfapp_members
        WHERE user_id = ?
      `,
      values: [userId]
    })

    res.status(200).json(memberships)
  } catch (error) {
    console.error('Error fetching user memberships:', error)
    res.status(500).json({ message: 'Error fetching user memberships' })
  }
} 