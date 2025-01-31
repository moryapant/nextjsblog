import type { NextApiRequest, NextApiResponse } from 'next'
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../lib/firebase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const postsRef = collection(db, 'posts')
      const q = query(postsRef, orderBy('createdAt', 'desc'), limit(10))
      const querySnapshot = await getDocs(q)
      
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      }))

      res.status(200).json(posts)
    } catch (error) {
      console.error('Error fetching posts:', error)
      res.status(500).json({ message: 'Error fetching posts' })
    }
  } else if (req.method === 'POST') {
    try {
      const { title, content, subfapp, userId, imageUrl } = req.body

      const docRef = await addDoc(collection(db, 'posts'), {
        title,
        content,
        subfapp,
        userId,
        imageUrl,
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      res.status(201).json({ id: docRef.id })
    } catch (error) {
      console.error('Error creating post:', error)
      res.status(500).json({ message: 'Error creating post' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}