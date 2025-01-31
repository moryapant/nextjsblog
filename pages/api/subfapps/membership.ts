import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '../../../lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { userId, subfappName, action } = req.body

    if (!userId || !subfappName || !action) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const subfappRef = adminDb.collection('subfapps').doc(subfappName)
    const memberRef = subfappRef.collection('members').doc(userId)

    // Start a transaction
    await adminDb.runTransaction(async (transaction) => {
      const subfappDoc = await transaction.get(subfappRef)
      if (!subfappDoc.exists) {
        throw new Error('Subfapp not found')
      }

      const currentMemberCount = subfappDoc.data()?.memberCount || 0

      if (action === 'join') {
        // Add member
        transaction.set(memberRef, {
          userId,
          joinedAt: new Date().toISOString()
        })

        // Increment member count
        transaction.update(subfappRef, {
          memberCount: currentMemberCount + 1
        })
      } else if (action === 'leave') {
        // Remove member
        transaction.delete(memberRef)

        // Decrement member count
        transaction.update(subfappRef, {
          memberCount: Math.max(0, currentMemberCount - 1)
        })
      }
    })

    // Get updated member count
    const updatedSubfapp = await subfappRef.get()
    const memberCount = updatedSubfapp.data()?.memberCount || 0

    res.status(200).json({ 
      message: `Successfully ${action}ed subfapp`,
      memberCount
    })
  } catch (error) {
    console.error('Error managing subfapp membership:', error)
    res.status(500).json({ message: 'Error managing subfapp membership' })
  }
} 