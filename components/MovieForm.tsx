import { useState } from 'react'

interface MovieFormProps {
  onSubmit: (movieData: {
    title: string
    description: string
    release_date: string
    rating: number
  }) => Promise<void>
}

const MovieForm = ({ onSubmit }: MovieFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    release_date: '',
    rating: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(formData)
      // Clear form after successful submission
      setFormData({
        title: '',
        description: '',
        release_date: '',
        rating: 0
      })
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Movie Title
        </label>
        <input
          type="text"
          id="title"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="release_date" className="block text-sm font-medium text-gray-700">
          Release Date
        </label>
        <input
          type="date"
          id="release_date"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.release_date}
          onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
          Rating (0-10)
        </label>
        <input
          type="number"
          id="rating"
          required
          min="0"
          max="10"
          step="0.1"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.rating}
          onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Add Movie
      </button>
    </form>
  )
}

export default MovieForm 