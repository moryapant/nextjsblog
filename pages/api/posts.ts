import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../lib/db'
import DOMPurify from 'isomorphic-dompurify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { title, content, image_url, published_date, category } = req.body

    // Validate input
    if (!title || !content || !published_date || !category) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Sanitize HTML content
    const sanitizedContent = DOMPurify.sanitize(content)

    // Insert into database
    await executeQuery({
      query: `
        INSERT INTO posts (title, content, image_url, published_date, category)
        VALUES (?, ?, ?, ?, ?)
      `,
      values: [title, sanitizedContent, image_url, published_date, category]
    })

    res.status(201).json({ message: 'Post created successfully' })
  } catch (error) {
    console.error('Error creating post:', error)
    res.status(500).json({ message: 'Error creating post' })
  }
} 