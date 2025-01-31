import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '../../../lib/firebase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { uid, displayName, email, photoURL } = req.body

      if (!uid) {
        return res.status(400).json({ message: 'User ID is required' })
      }

      const userRef = adminDb.collection('users').doc(uid)
      const userDoc = await userRef.get()

      if (!userDoc.exists) {
        // Create new user
        await userRef.set({
          displayName,
          email,
          photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      } else {
        // Update existing user
        await userRef.set({
          displayName,
          email,
          photoURL,
          updatedAt: new Date().toISOString()
        }, { merge: true })
      }

      const updatedDoc = await userRef.get()
      res.status(200).json(updatedDoc.data())
    } catch (error) {
      console.error('Error managing user:', error)
      res.status(500).json({ message: 'Error managing user' })
    }
  } else if (req.method === 'GET') {
    try {
      const { uid } = req.query

      if (!uid) {
        return res.status(400).json({ message: 'User ID is required' })
      }

      const userDoc = await adminDb.collection('users').doc(uid as string).get()
      
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' })
      }

      res.status(200).json(userDoc.data())
    } catch (error) {
      console.error('Error fetching user:', error)
      res.status(500).json({ message: 'Error fetching user' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
} 