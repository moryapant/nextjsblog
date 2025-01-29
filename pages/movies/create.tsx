import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import MovieForm from '../../components/MovieForm'

const CreateMovie = () => {
  const router = useRouter()
  const [error, setError] = useState('')

  const handleSubmit = async (movieData: {
    title: string
    description: string
    release_date: string
    rating: number
  }) => {
    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      })

      if (!response.ok) {
        throw new Error('Failed to create movie')
      }

      router.push('/') // Redirect to home page after successful creation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Head>
        <title>Add New Movie - Movie Blog</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Movie</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <MovieForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}

export default CreateMovie 