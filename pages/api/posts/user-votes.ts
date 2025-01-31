import type { NextApiRequest, NextApiResponse } from 'next'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../../lib/firebase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' })
  }

  try {
    const votesRef = collection(db, 'posts')
    const q = query(
      collection(db, 'posts'),
      where('votes', 'array-contains', { userId: userId })
    )
    const querySnapshot = await getDocs(q)
    
    const votes = querySnapshot.docs.map(doc => ({
      post_id: doc.id,
      vote_type: doc.data().votes.find((v: any) => v.userId === userId).voteType
    }))

    res.status(200).json(votes)
  } catch (error) {
    console.error('Error fetching user votes:', error)
    res.status(500).json({ message: 'Error fetching user votes' })
  }
} 