import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

interface UserVote {
  post_id: number
  vote_type: 'up' | 'down'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ message: 'Missing user ID' })
    }

    const userVotes = await executeQuery<UserVote[]>({
      query: `
        SELECT post_id, vote_type 
        FROM post_votes 
        WHERE user_id = ?
      `,
      values: [userId]
    })

    res.status(200).json(userVotes)
  } catch (error) {
    console.error('Error fetching user votes:', error)
    // Send a more specific error message
    res.status(500).json({ 
      message: 'Error fetching user votes',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 