import { db } from './firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

export async function getPosts() {
  const postsRef = collection(db, 'posts')
  const q = query(postsRef, orderBy('createdAt', 'desc'), limit(10))
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

export async function getSubfapps() {
  try {
    const subfappsRef = collection(db, 'subfapps')
    const q = query(subfappsRef, orderBy('memberCount', 'desc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      name: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching subfapps:', error)
    throw error
  }
} 