import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

interface CreatePostRequest {
  title: string
  content: string
  imageUrl?: string
  subfapp: string
  userId: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { title, content, imageUrl, subfapp, userId } = req.body as CreatePostRequest

    if (!title || !userId) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Insert the post
    const result = await executeQuery({
      query: `
        INSERT INTO posts (
          title,
          content,
          image_url,
          published_date,
          subfapp,
          user_id,
          upvotes,
          downvotes
        ) VALUES (?, ?, ?, CURDATE(), ?, ?, 0, 0)
      `,
      values: [
        title,
        content || null,
        imageUrl || null,
        subfapp || null,
        userId
      ]
    })

    // Get the inserted post ID
    const insertId = (result as any).insertId

    // Fetch the created post
    const [post] = await executeQuery({
      query: `
        SELECT 
          id,
          title,
          content,
          image_url,
          subfapp,
          user_id,
          DATE_FORMAT(published_date, '%Y-%m-%d') as published_date,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at,
          upvotes,
          downvotes
        FROM posts 
        WHERE id = ?
      `,
      values: [insertId]
    })

    res.status(201).json(post)
  } catch (error) {
    console.error('Error creating post:', error)
    res.status(500).json({ message: 'Error creating post' })
  }
} 