import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

// Import Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-50 animate-pulse" />
})

interface PostFormProps {
  onSubmit: (postData: {
    title: string
    content: string
    image_url?: string
    published_date: string
    category: string
  }) => Promise<void>
}

const PostForm = ({ onSubmit }: PostFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    published_date: new Date().toISOString().split('T')[0],
    category: 'movie'
  })

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {/* Title Section */}
      <div className="space-y-1">
        <label htmlFor="title" className="block text-lg font-medium text-gray-900">
          Post Title
        </label>
        <input
          type="text"
          id="title"
          required
          placeholder="Enter your post title"
          className="w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      {/* Category and Date Section */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <label htmlFor="category" className="block text-lg font-medium text-gray-900">
            Category
          </label>
          <select
            id="category"
            required
            className="w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="movie">Movie Review</option>
            <option value="news">Movie News</option>
            <option value="article">Article</option>
            <option value="interview">Interview</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="published_date" className="block text-lg font-medium text-gray-900">
            Publish Date
          </label>
          <div className="relative">
            <input
              type="date"
              id="published_date"
              required
              className="w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.published_date}
              onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image Section */}
      <div className="space-y-1">
        <label htmlFor="image_url" className="block text-lg font-medium text-gray-900">
          Featured Image
        </label>
        <input
          type="url"
          id="image_url"
          className="w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Content Section with Quill Editor */}
      <div className="space-y-1">
        <label htmlFor="content" className="block text-lg font-medium text-gray-900">
          Content
        </label>
        <div className="border border-gray-200 rounded-lg">
          <ReactQuill
            theme="snow"
            value={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            modules={modules}
            formats={formats}
            className="h-96"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <Link
          href="/"
          className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Publish Post
        </button>
      </div>
    </form>
  )
}

interface Subfapp {
  name: string
  memberCount: number
  description: string | null
  createdAt: string
  updatedAt: string
}

export default function CreatePost() {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [selectedSubfapp, setSelectedSubfapp] = useState('')
  const [subfapps, setSubfapps] = useState<Subfapp[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')

  // Fetch subfapps when component mounts
  useEffect(() => {
    const fetchSubfapps = async () => {
      try {
        const response = await fetch('/api/subfapps')
        if (!response.ok) throw new Error('Failed to fetch subfapps')
        const data = await response.json()
        setSubfapps(data)
      } catch (error) {
        console.error('Error fetching subfapps:', error)
        setError('Failed to load communities')
      }
    }

    fetchSubfapps()
  }, [])

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!user) {
        throw new Error('Please sign in to create a post')
      }

      if (!title.trim() || !content.trim() || !selectedSubfapp) {
        throw new Error('Title, content and community are required')
      }

      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          imageUrl: imageUrl.trim() || null,
          subfapp: selectedSubfapp,
          userId: user.uid,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create post')
      }

      const { id } = await response.json()
      router.push(`/post/${id}`)
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error instanceof Error ? error.message : 'Error creating post')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null // or loading state
  }

  return (
    <div className="min-h-screen bg-[#DAE0E6] pt-16">
      <Head>
        <title>Create Post - MovieBlog</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-semibold mb-6">Create a Post</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subfapp Selection */}
              <div>
                <label htmlFor="subfapp" className="block text-sm font-medium text-gray-700 mb-1">
                  Choose a subfapp
                </label>
                <div className="relative">
                  <select
                    id="subfapp"
                    value={selectedSubfapp}
                    onChange={(e) => setSelectedSubfapp(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a subfapp</option>
                    {subfapps.map((subfapp) => (
                      <option key={subfapp.name} value={subfapp.name}>
                        f/{subfapp.name} ({subfapp.memberCount.toLocaleString()} members)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Write an interesting title"
                  required
                  maxLength={300}
                />
              </div>

              {/* Image URL Input */}
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Content Input */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Write your post content here..."
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Creating...' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
} 