import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

const defaultSubfapps = [
  {
    name: 'movies',
    description: 'Discuss your favorite movies and latest releases'
  },
  {
    name: 'tvshows',
    description: 'Everything about TV series and shows'
  },
  {
    name: 'anime',
    description: 'Japanese animation and manga discussions'
  },
  {
    name: 'gaming',
    description: 'Video games, reviews, and gaming culture'
  },
  {
    name: 'music',
    description: 'Music discussions, reviews, and recommendations'
  },
  {
    name: 'books',
    description: 'Book discussions and recommendations'
  },
  {
    name: 'art',
    description: 'Share and discuss artwork'
  },
  {
    name: 'photography',
    description: 'Photography tips and showcase'
  },
  {
    name: 'technology',
    description: 'Tech news and discussions'
  },
  {
    name: 'sports',
    description: 'Sports news and discussions'
  }
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Insert each subfapp
    for (const subfapp of defaultSubfapps) {
      await executeQuery({
        query: `
          INSERT INTO subfapps (name, member_count, description)
          VALUES (?, 0, ?)
          ON DUPLICATE KEY UPDATE
          description = VALUES(description)
        `,
        values: [subfapp.name, subfapp.description]
      })
    }

    res.status(200).json({ message: 'Subfapps initialized successfully' })
  } catch (error) {
    console.error('Error initializing subfapps:', error)
    res.status(500).json({ message: 'Error initializing subfapps' })
  }
} 