import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '../../../lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { commentId, userId } = req.body

    if (!commentId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const commentRef = adminDb.collection('comments').doc(commentId)
    const likeRef = commentRef.collection('likes').doc(userId)

    // Check if user already liked
    const likeDoc = await likeRef.get()
    
    if (likeDoc.exists) {
      // Unlike: Remove like document and decrement count
      await likeRef.delete()
      await commentRef.update({
        likes: FieldValue.increment(-1)
      })
    } else {
      // Like: Create like document and increment count
      await likeRef.set({
        userId,
        createdAt: FieldValue.serverTimestamp()
      })
      await commentRef.update({
        likes: FieldValue.increment(1)
      })
    }

    // Get updated like count
    const updatedComment = await commentRef.get()
    const likeCount = updatedComment.data()?.likes || 0

    res.status(200).json({ likeCount })
  } catch (error) {
    console.error('Error handling comment like:', error)
    res.status(500).json({ message: 'Error handling like' })
  }
} 