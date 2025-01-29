import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { userId, subfappName, action } = req.body

    if (!userId || !subfappName) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    if (action === 'join') {
      await executeQuery({
        query: `
          INSERT INTO subfapp_members (user_id, subfapp_name)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE joined_at = CURRENT_TIMESTAMP
        `,
        values: [userId, subfappName]
      })

      // Update member count
      await executeQuery({
        query: `
          UPDATE subfapps 
          SET member_count = (
            SELECT COUNT(*) 
            FROM subfapp_members 
            WHERE subfapp_name = ?
          )
          WHERE name = ?
        `,
        values: [subfappName, subfappName]
      })
    } else if (action === 'leave') {
      await executeQuery({
        query: 'DELETE FROM subfapp_members WHERE user_id = ? AND subfapp_name = ?',
        values: [userId, subfappName]
      })

      // Update member count
      await executeQuery({
        query: `
          UPDATE subfapps 
          SET member_count = (
            SELECT COUNT(*) 
            FROM subfapp_members 
            WHERE subfapp_name = ?
          )
          WHERE name = ?
        `,
        values: [subfappName, subfappName]
      })
    }

    res.status(200).json({ message: `Successfully ${action}ed subfapp` })
  } catch (error) {
    console.error('Error managing subfapp membership:', error)
    res.status(500).json({ message: 'Error managing subfapp membership' })
  }
} 