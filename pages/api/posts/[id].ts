import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

interface Post {
  id: number
  title: string
  content: string | null
  image_url: string | null
  published_date: string
  subfapp: string | null
  created_at: string
  updated_at: string
  downvotes: number
  upvotes: number
  user_id: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    // Validate id parameter
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Invalid post ID' })
    }

    const [post] = await executeQuery<Post[]>({
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
      values: [parseInt(id, 10)]  // Convert id to number
    })

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Add debug logging
    console.log('Found post:', post)

    res.status(200).json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    res.status(500).json({ message: 'Error fetching post' })
  }
} 