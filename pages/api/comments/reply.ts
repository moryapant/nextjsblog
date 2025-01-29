import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { parentCommentId, userId, content, userName, userAvatar } = req.body

      if (!parentCommentId || !userId || !content) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      const result = await executeQuery({
        query: `
          INSERT INTO comment_replies (
            parent_comment_id, user_id, user_name, user_avatar, content
          ) VALUES (?, ?, ?, ?, ?)
        `,
        values: [parentCommentId, userId, userName || 'Anonymous', userAvatar, content]
      })

      // Fetch the newly created reply
      const [reply] = await executeQuery({
        query: `
          SELECT 
            *,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
          FROM comment_replies 
          WHERE id = ?
        `,
        values: [result.insertId]
      })

      res.status(200).json(reply)
    } catch (error) {
      console.error('Error creating reply:', error)
      res.status(500).json({ message: 'Error creating reply' })
    }
  } else if (req.method === 'GET') {
    try {
      const { commentId } = req.query

      const replies = await executeQuery({
        query: `
          SELECT 
            *,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
          FROM comment_replies 
          WHERE parent_comment_id = ?
          ORDER BY created_at ASC
        `,
        values: [commentId]
      })

      res.status(200).json(replies)
    } catch (error) {
      console.error('Error fetching replies:', error)
      res.status(500).json({ message: 'Error fetching replies' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
} 