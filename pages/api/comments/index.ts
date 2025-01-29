import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { postId, userId, content, userName, userAvatar } = req.body

      if (!postId || !userId || !content) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      const result = await executeQuery({
        query: `
          INSERT INTO comments (post_id, user_id, user_name, user_avatar, content)
          VALUES (?, ?, ?, ?, ?)
        `,
        values: [postId, userId, userName || 'Anonymous', userAvatar || null, content]
      })

      // After inserting, fetch the newly created comment
      const [newComment] = await executeQuery({
        query: `
          SELECT 
            id,
            post_id,
            user_id,
            user_name,
            user_avatar,
            content,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
          FROM comments 
          WHERE id = ?
        `,
        values: [result.insertId]
      })

      res.status(200).json(newComment)
    } catch (error) {
      console.error('Error creating comment:', error)
      res.status(500).json({ message: 'Error creating comment' })
    }
  } else if (req.method === 'GET') {
    try {
      const { postId } = req.query

      const comments = await executeQuery({
        query: `
          SELECT 
            c.*,
            DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date,
            COUNT(DISTINCT cl.id) as likes,
            COUNT(DISTINCT cr.id) as reply_count
          FROM comments c
          LEFT JOIN comment_likes cl ON c.id = cl.comment_id
          LEFT JOIN comment_replies cr ON c.id = cr.parent_comment_id
          WHERE c.post_id = ?
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `,
        values: [postId]
      })

      // Then fetch replies for each comment
      for (let comment of comments) {
        const replies = await executeQuery({
          query: `
            SELECT 
              *,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
            FROM comment_replies 
            WHERE parent_comment_id = ?
            ORDER BY created_at ASC
          `,
          values: [comment.id]
        })
        comment.replies = replies
      }

      res.status(200).json(comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      res.status(500).json({ message: 'Error fetching comments' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
} 