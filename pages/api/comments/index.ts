import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '../../../lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { postId } = req.query

      if (!postId) {
        return res.status(400).json({ message: 'Post ID is required' })
      }

      const commentsRef = adminDb.collection('comments')
      const q = commentsRef.where('postId', '==', postId)
      const querySnapshot = await q.get()

      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate().toISOString(),
        updatedAt: doc.data().updatedAt.toDate().toISOString()
      }))

      comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      res.status(200).json(comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      res.status(500).json({ message: 'Error fetching comments' })
    }
  } else if (req.method === 'POST') {
    try {
      const { postId, userId, content, userName, userAvatar } = req.body

      if (!postId || !userId || !content) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      const docRef = await adminDb.collection('comments').add({
        postId,
        userId,
        userName,
        userAvatar,
        content,
        likes: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      })

      // Update post's comment count
      await adminDb.collection('posts').doc(postId).update({
        commentCount: FieldValue.increment(1)
      })

      const newComment = {
        id: docRef.id,
        postId,
        userId,
        userName,
        userAvatar,
        content,
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      res.status(201).json(newComment)
    } catch (error) {
      console.error('Error creating comment:', error)
      res.status(500).json({ message: 'Error creating comment' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
} 