import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { postId, userId, voteType } = req.body

    if (!postId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Delete existing vote if any
    await executeQuery({
      query: 'DELETE FROM post_votes WHERE post_id = ? AND user_id = ?',
      values: [postId, userId]
    })

    // If voteType is not null, insert new vote
    if (voteType) {
      await executeQuery({
        query: `
          INSERT INTO post_votes (post_id, user_id, vote_type)
          VALUES (?, ?, ?)
        `,
        values: [postId, userId, voteType]
      })
    }

    // Update post vote counts
    await executeQuery({
      query: `
        UPDATE posts p
        SET 
          upvotes = (SELECT COUNT(*) FROM post_votes WHERE post_id = p.id AND vote_type = 'up'),
          downvotes = (SELECT COUNT(*) FROM post_votes WHERE post_id = p.id AND vote_type = 'down')
        WHERE id = ?
      `,
      values: [postId]
    })

    // Get updated post counts
    const [updatedPost] = await executeQuery<any[]>({
      query: `
        SELECT upvotes, downvotes 
        FROM posts 
        WHERE id = ?
      `,
      values: [postId]
    })

    res.status(200).json(updatedPost)
  } catch (error) {
    console.error('Error handling vote:', error)
    res.status(500).json({ message: 'Error handling vote' })
  }
} 