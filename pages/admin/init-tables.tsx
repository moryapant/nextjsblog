import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function InitTablesPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<string>('')

  const initializeTables = async () => {
    try {
      const response = await fetch('/api/init/tables', {
        method: 'POST'
      })
      
      if (response.ok) {
        setStatus('Tables initialized successfully')
      } else {
        const error = await response.json()
        setStatus(`Error initializing tables: ${error.message}`)
      }
    } catch (error) {
      setStatus('Error initializing tables')
    }
  }

  if (!user) {
    return <div>Not authorized</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Initialize Database Tables</h1>
          <button
            onClick={initializeTables}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Initialize Tables
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