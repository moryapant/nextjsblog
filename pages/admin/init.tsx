import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function InitPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<string>('')

  const initializeSubfapps = async () => {
    try {
      const response = await fetch('/api/subfapps/init', {
        method: 'POST'
      })
      
      if (response.ok) {
        setStatus('Subfapps initialized successfully')
      } else {
        setStatus('Error initializing subfapps')
      }
    } catch (error) {
      setStatus('Error initializing subfapps')
    }
  }

  if (!user) {
    return <div>Not authorized</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Initialize Subfapps</h1>
          <button
            onClick={initializeSubfapps}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Initialize
          </button>
          {status && (
            <p className="mt-4 text-center text-sm text-gray-600">
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 