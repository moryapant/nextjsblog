import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '../../../lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { postId, userId, voteType } = req.body

    if (!postId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const postRef = adminDb.collection('posts').doc(postId)
    const voteRef = postRef.collection('votes').doc(userId)

    // Get current vote
    const voteDoc = await voteRef.get()
    const currentVote = voteDoc.exists ? voteDoc.data()?.voteType : null

    // Update vote counts based on current and new vote
    const batch = adminDb.batch()

    if (currentVote === voteType) {
      // Remove vote if clicking same button
      batch.delete(voteRef)
      batch.update(postRef, {
        [`${voteType}votes`]: FieldValue.increment(-1)
      })
    } else {
      // Add new vote
      if (currentVote) {
        // Change vote: decrease old vote type, increase new vote type
        batch.update(postRef, {
          [`${currentVote}votes`]: FieldValue.increment(-1),
          [`${voteType}votes`]: FieldValue.increment(1)
        })
      } else {
        // New vote: just increase new vote type
        batch.update(postRef, {
          [`${voteType}votes`]: FieldValue.increment(1)
        })
      }
      
      batch.set(voteRef, {
        userId,
        voteType,
        createdAt: FieldValue.serverTimestamp()
      })
    }

    await batch.commit()

    // Get updated post and user's vote
    const [updatedPost, updatedVote] = await Promise.all([
      postRef.get(),
      voteRef.get()
    ])

    res.status(200).json({
      upvotes: updatedPost.data()?.upvotes || 0,
      downvotes: updatedPost.data()?.downvotes || 0,
      userVote: updatedVote.exists ? updatedVote.data()?.voteType : null
    })
  } catch (error) {
    console.error('Error handling vote:', error)
    res.status(500).json({ message: 'Error handling vote' })
  }
} 