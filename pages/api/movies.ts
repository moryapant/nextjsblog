import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { title, description, release_date, rating } = req.body

    // Validate input
    if (!title || !description || !release_date || rating === undefined) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Insert into database
    await executeQuery({
      query: `
        INSERT INTO movies (title, description, release_date, rating)
        VALUES (?, ?, ?, ?)
      `,
      values: [title, description, release_date, rating]
    })

    res.status(201).json({ message: 'Movie created successfully' })
  } catch (error) {
    console.error('Error creating movie:', error)
    res.status(500).json({ message: 'Error creating movie' })
  }
} 