import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '../../../lib/firebase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    // Get all subfapps
    const subfappsSnapshot = await adminDb.collection('subfapps').get()
    
    // Check membership for each subfapp
    const membershipPromises = subfappsSnapshot.docs.map(async (subfappDoc) => {
      const memberDoc = await adminDb
        .collection('subfapps')
        .doc(subfappDoc.id)
        .collection('members')
        .doc(userId as string)
        .get()
      
      return memberDoc.exists ? subfappDoc.id : null
    })

    const memberships = (await Promise.all(membershipPromises))
      .filter((subfappName): subfappName is string => subfappName !== null)

    res.status(200).json({ memberships })
  } catch (error) {
    console.error('Error fetching user memberships:', error)
    res.status(500).json({ message: 'Error fetching user memberships' })
  }
} 