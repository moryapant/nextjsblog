import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'

export default function Login() {
  const router = useRouter()
  const { user, signInWithGoogle } = useAuth()
  
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      const returnUrl = router.query.returnUrl as string
      router.push(returnUrl || '/')
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const returnUrl = router.query.returnUrl as string
      router.push(returnUrl || '/')
    }
  }, [user, router])

  if (user) return null

  return (
    <div className="min-h-screen bg-[#DAE0E6] pt-16">
      <Head>
        <title>Sign In - Bollyshaggers</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In to Bollyshaggers</h1>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-300 rounded-md px-4 py-2.5 transition-colors"
            >
              <Image 
                src="/google.svg" 
                alt="Google" 
                width={20} 
                height={20}
              />
              Continue with Google
            </button>

            <div className="mt-6 text-center text-sm text-gray-600">
              By continuing, you agree to Bollyshaggers's Terms of Service and Privacy Policy
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 