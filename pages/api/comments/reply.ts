import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '../../../lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { parentCommentId, userId, content, userName, userAvatar } = req.body

    if (!parentCommentId || !userId || !content) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Create reply in replies subcollection
    const replyRef = await adminDb
      .collection('comments')
      .doc(parentCommentId)
      .collection('replies')
      .add({
        userId,
        userName,
        userAvatar,
        content,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      })

    // Update parent comment's reply count
    await adminDb
      .collection('comments')
      .doc(parentCommentId)
      .update({
        replyCount: FieldValue.increment(1)
      })

    // Get the created reply
    const replyDoc = await replyRef.get()
    const reply = {
      id: replyDoc.id,
      ...replyDoc.data(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    res.status(201).json(reply)
  } catch (error) {
    console.error('Error creating reply:', error)
    res.status(500).json({ message: 'Error creating reply' })
  }
} 