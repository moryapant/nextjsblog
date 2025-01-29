import type { NextApiRequest, NextApiResponse } from 'next'
import { executeQuery } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { nomineeId } = req.body

    await executeQuery({
      query: `
        UPDATE poll_nominees 
        SET votes = votes + 1 
        WHERE id = ?
      `,
      values: [nomineeId]
    })

    res.status(200).json({ message: 'Vote recorded successfully' })
  } catch (error) {
    console.error('Error recording vote:', error)
    res.status(500).json({ message: 'Error recording vote' })
  }
} 