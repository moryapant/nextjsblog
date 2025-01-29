import { executeQuery } from './db'
import { User } from 'firebase/auth'

interface DbUser {
  id: string
  display_name: string
  email: string
  photo_url: string | null
  created_at: string
  updated_at: string
}

export async function createOrUpdateUser(firebaseUser: User): Promise<DbUser> {
  try {
    // Check if user exists
    const [existingUser] = await executeQuery<DbUser[]>({
      query: 'SELECT * FROM users WHERE id = ?',
      values: [firebaseUser.uid]
    })

    if (existingUser) {
      // Update existing user
      await executeQuery({
        query: `
          UPDATE users 
          SET 
            display_name = ?,
            email = ?,
            photo_url = ?
          WHERE id = ?
        `,
        values: [
          firebaseUser.displayName,
          firebaseUser.email,
          firebaseUser.photoURL,
          firebaseUser.uid
        ]
      })
    } else {
      // Create new user
      await executeQuery({
        query: `
          INSERT INTO users (id, display_name, email, photo_url)
          VALUES (?, ?, ?, ?)
        `,
        values: [
          firebaseUser.uid,
          firebaseUser.displayName,
          firebaseUser.email,
          firebaseUser.photoURL
        ]
      })
    }

    // Return updated user data
    const [updatedUser] = await executeQuery<DbUser[]>({
      query: 'SELECT * FROM users WHERE id = ?',
      values: [firebaseUser.uid]
    })

    return updatedUser
  } catch (error) {
    console.error('Error managing user:', error)
    throw error
  }
}

export async function getUser(userId: string): Promise<DbUser | null> {
  try {
    const [user] = await executeQuery<DbUser[]>({
      query: 'SELECT * FROM users WHERE id = ?',
      values: [userId]
    })
    return user || null
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
} 