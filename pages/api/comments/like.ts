import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { commentId, userId } = req.body

    if (!commentId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Check if user already liked the comment
    const [existingLike] = await executeQuery({
      query: `
        SELECT id FROM comment_likes 
        WHERE comment_id = ? AND user_id = ?
      `,
      values: [commentId, userId]
    })

    if (existingLike) {
      // Unlike
      await executeQuery({
        query: `
          DELETE FROM comment_likes 
          WHERE comment_id = ? AND user_id = ?
        `,
        values: [commentId, userId]
      })
    } else {
      // Like
      await executeQuery({
        query: `
          INSERT INTO comment_likes (comment_id, user_id)
          VALUES (?, ?)
        `,
        values: [commentId, userId]
      })
    }

    // Get updated like count
    const [{ likeCount }] = await executeQuery({
      query: `
        SELECT COUNT(*) as likeCount 
        FROM comment_likes 
        WHERE comment_id = ?
      `,
      values: [commentId]
    })

    res.status(200).json({ likeCount })
  } catch (error) {
    console.error('Error handling comment like:', error)
    res.status(500).json({ message: 'Error handling comment like' })
  }
} 