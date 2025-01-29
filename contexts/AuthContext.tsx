import { createContext, useContext, useEffect, useState } from 'react'
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  User
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

interface DbUser {
  id: string
  display_name: string
  email: string
  photo_url: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  dbUser: DbUser | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<User>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => { throw new Error('Method not implemented') }
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(true)

  const syncUserWithDb = async (firebaseUser: User) => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        }),
      })

      if (response.ok) {
        const dbUserData = await response.json()
        setDbUser(dbUserData)
      }
    } catch (error) {
      console.error('Error syncing user data:', error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      handleAuthStateChanged(user)
      if (user) {
        await syncUserWithDb(user)
      } else {
        setDbUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleAuthStateChanged = (user: User | null) => {
    if (user) {
      // Store auth info in cookie
      document.cookie = `auth=${JSON.stringify({
        uid: user.uid,
        // other necessary user info
      })}; path=/`
    } else {
      // Remove auth cookie when user signs out
      document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    }
    setUser(user)
  }

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await syncUserWithDb(result.user)
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setDbUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const value = {
    user,
    dbUser,
    loading,
    signIn,
    signOut,
    signInWithGoogle
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 