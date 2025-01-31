import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '../../../lib/firebase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { postId, userId } = req.query

    if (!postId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const voteRef = adminDb
      .collection('posts')
      .doc(postId as string)
      .collection('votes')
      .doc(userId as string)

    const voteDoc = await voteRef.get()

    res.status(200).json({
      userVote: voteDoc.exists ? voteDoc.data()?.voteType : null
    })
  } catch (error) {
    console.error('Error fetching user vote:', error)
    res.status(500).json({ message: 'Error fetching user vote' })
  }
} 