import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '../../../lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { title, content, imageUrl, subfapp, userId } = req.body

    if (!title || !content || !subfapp || !userId) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Create post document
    const postRef = await adminDb.collection('posts').add({
      title,
      content,
      imageUrl: imageUrl || null,
      subfapp,
      userId,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    res.status(201).json({ id: postRef.id })
  } catch (error) {
    console.error('Error creating post:', error)
    res.status(500).json({ message: 'Error creating post' })
  }
} 