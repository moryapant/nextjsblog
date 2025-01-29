import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

interface DbUser {
  id: string
  display_name: string
  email: string
  photo_url: string | null
  created_at: string
  updated_at: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { uid, displayName, email, photoURL } = req.body

      // Check if user exists
      const [existingUser] = await executeQuery<DbUser[]>({
        query: 'SELECT * FROM users WHERE id = ?',
        values: [uid]
      })

      if (existingUser) {
        // Update existing user
        await executeQuery({
          query: `
            UPDATE users 
            SET 
              display_name = ?,
              email = ?,
              photo_url = ?
            WHERE id = ?
          `,
          values: [displayName, email, photoURL, uid]
        })
      } else {
        // Create new user
        await executeQuery({
          query: `
            INSERT INTO users (id, display_name, email, photo_url)
            VALUES (?, ?, ?, ?)
          `,
          values: [uid, displayName, email, photoURL]
        })
      }

      // Return updated user data
      const [updatedUser] = await executeQuery<DbUser[]>({
        query: 'SELECT * FROM users WHERE id = ?',
        values: [uid]
      })

      res.status(200).json(updatedUser)
    } catch (error) {
      console.error('Error managing user:', error)
      res.status(500).json({ error: 'Error managing user' })
    }
  } else if (req.method === 'GET') {
    try {
      const { userId } = req.query
      const [user] = await executeQuery<DbUser[]>({
        query: 'SELECT * FROM users WHERE id = ?',
        values: [userId]
      })
      
      if (user) {
        res.status(200).json(user)
      } else {
        res.status(404).json({ error: 'User not found' })
      }
    } catch (error) {
      console.error('Error getting user:', error)
      res.status(500).json({ error: 'Error getting user' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
} 