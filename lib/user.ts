import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function getUserById(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) {
      return null
    }
    return {
      id: userDoc.id,
      ...userDoc.data()
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
} 