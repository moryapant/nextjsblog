import type { NextApiRequest, NextApiResponse } from 'next'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'

interface Subfapp {
  name: string
  memberCount: number
  description: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const subfappsRef = collection(db, 'subfapps')
    const q = query(subfappsRef, orderBy('memberCount', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const subfapps = querySnapshot.docs.map(doc => ({
      name: doc.id,
      ...doc.data()
    }))

    res.status(200).json(subfapps)
  } catch (error) {
    console.error('Error fetching subfapps:', error)
    res.status(500).json({ message: 'Error fetching subfapps' })
  }
} 