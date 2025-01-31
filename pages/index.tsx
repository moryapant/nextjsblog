import Link from 'next/link'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { executeQuery } from '../lib/db'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Post } from '../types'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase' // This is your client-side Firebase instance
import { VoteButtons } from '../components/VoteButtons'
import { PostCard } from '../components/PostCard'
import { adminDb } from '../lib/firebase-admin'

interface Subfapp {
  name: string
  memberCount: number
  description: string
  createdAt: Date
  updatedAt: Date
}

interface HomePageProps {
  posts: Post[]
  subfapps: Subfapp[]
}

interface HomeProps {
  initialPosts: Post[]
  initialVotedPosts: Record<string, 'up' | 'down'>
  subfapps: Subfapp[]
  initialMemberships: string[]
}

const Home = ({ initialPosts, initialVotedPosts, subfapps = [], initialMemberships = [] }: HomeProps) => {
  const { user } = useAuth()
  const [posts, setPosts] = useState(initialPosts)
  const [votedPosts, setVotedPosts] = useState(initialVotedPosts)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [joinedSubfapps, setJoinedSubfapps] = useState(initialMemberships)
  const [isJoining, setIsJoining] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!user) {
      setVoteError('Please sign in to vote')
      setTimeout(() => setVoteError(null), 3000)
      return
    }

    try {
      const response = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId, 
          voteType,
          userId: user.uid 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const data = await response.json()
      setPosts(posts => posts.map(post => 
        post.id === postId 
          ? { ...post, upvotes: data.upvotes, downvotes: data.downvotes }
          : post
      ))
      setVotedPosts(prev => ({ ...prev, [postId]: data.userVote }))
    } catch (error) {
      setVoteError('Error voting on post')
      setTimeout(() => setVoteError(null), 3000)
    }
  }

  const getVoteScore = (post: Post) => {
    return post.upvotes - post.downvotes
  }

  useEffect(() => {
    const fetchUserMemberships = async () => {
      if (!user) {
        setJoinedSubfapps([])
        return
      }

      try {
        const response = await fetch(`/api/subfapps/user-memberships?userId=${user.uid}`)
        if (!response.ok) throw new Error('Failed to fetch memberships')
        
        const data = await response.json()
        setJoinedSubfapps(data.memberships)
      } catch (error) {
        console.error('Error fetching memberships:', error)
        setError('Error fetching memberships')
        setTimeout(() => setError(null), 3000)
      }
    }

    fetchUserMemberships()
  }, [user])

  const handleJoinSubfapp = async (subfappName: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      setError('Please sign in to join communities')
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsJoining(prev => ({ ...prev, [subfappName]: true }))

    try {
      const action = joinedSubfapps.includes(subfappName) ? 'leave' : 'join'
      const response = await fetch('/api/subfapps/membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          subfappName,
          action
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update membership')
      }

      const data = await response.json()
      
      setJoinedSubfapps(prev => 
        action === 'join'
          ? [...prev, subfappName]
          : prev.filter(name => name !== subfappName)
      )

      setPosts(prev => prev.map(post => 
        post.subfapp === subfappName
          ? { ...post, upvotes: data.upvotes, downvotes: data.downvotes }
          : post
      ))
    } catch (error) {
      console.error('Error updating membership:', error)
      setError('Error updating membership')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsJoining(prev => ({ ...prev, [subfappName]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-[#DAE0E6] pt-16">
      <Head>
        <title>Bollyshaggers - Home</title>
        <meta name="description" content="A community for Bollywood enthusiasts" />
      </Head>

      {/* Error Toast */}
      {error && (
        <div className="fixed z-50 px-4 py-3 text-red-700 transition-all duration-500 bg-red-100 border border-red-400 rounded-lg shadow-md top-20 right-4">
          {error}
        </div>
      )}

      <main className="py-6">
        <div className="flex gap-6 px-4 max-w-[2000px] mx-auto">
          {/* Left Sidebar */}
          {subfapps.length > 0 && (
            <div className="flex-shrink-0 hidden w-64 space-y-4 lg:block">
              <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 text-white bg-blue-500">
                  <h2 className="text-lg font-semibold">Popular Communities</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {subfapps.map((subfapp) => (
                    <div key={subfapp.name} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link 
                            href={`/f/${subfapp.name}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            f/{subfapp.name}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {subfapp.memberCount.toLocaleString()} members
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleJoinSubfapp(subfapp.name, e)}
                          disabled={isJoining[subfapp.name]}
                          className={`px-3 py-1 text-sm font-medium rounded-full ${
                            joinedSubfapps.includes(subfapp.name)
                              ? 'text-blue-700 hover:bg-blue-50'
                              : 'text-white bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isJoining[subfapp.name]
                            ? 'Loading...'
                            : joinedSubfapps.includes(subfapp.name)
                            ? 'Joined'
                            : 'Join'}
                        </button>
                      </div>
                      {subfapp.description && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                          {subfapp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-5xl mx-auto">
              <div className="space-x-1 space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    userVote={votedPosts[post.id]}
                    onVoteError={setVoteError}
                  />
                ))}
                {posts.length === 0 && (
                  <div className="p-4 text-center bg-white rounded-lg shadow-sm">
                    <p className="text-gray-500">No posts yet. Be the first to create one!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="flex-shrink-0 hidden space-y-4 lg:block w-96">
            {/* Popular Communities Card */}
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Popular Communities</h2>
              <div className="space-y-3">
                <Link 
                  href="/f/movies"
                  className="flex items-center p-2 space-x-3 rounded-md hover:bg-gray-50 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-blue-600 bg-blue-100 rounded-full">
                    f/
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      movies
                    </h3>
                  </div>
                </Link>
                {/* Add more communities as needed */}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sign-in Prompt */}
      <div className="mt-6 text-sm text-center text-gray-600">
        By continuing, you agree to Bollyshaggers's Terms of Service and Privacy Policy
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const userId = req.cookies.auth ? JSON.parse(req.cookies.auth).uid : null

    // Fetch posts
    const postsSnapshot = await adminDb.collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    const posts = postsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Safely handle dates with optional chaining and fallbacks
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        // Ensure all required fields have fallback values
        title: data.title || '',
        content: data.content || '',
        imageUrl: data.imageUrl || null,
        subfapp: data.subfapp || '',
        userId: data.userId || '',
        upvotes: data.upvotes || 0,
        downvotes: data.downvotes || 0,
        commentCount: data.commentCount || 0
      }
    })

    // Get user's votes if logged in
    let votedPosts = {}
    if (userId) {
      const votesPromises = posts.map(post => 
        adminDb.collection('posts').doc(post.id)
          .collection('votes').doc(userId).get()
      )
      const voteDocs = await Promise.all(votesPromises)
      votedPosts = voteDocs.reduce((acc, doc, index) => {
        if (doc.exists) {
          acc[posts[index].id] = doc.data()?.voteType
        }
        return acc
      }, {})
    }

    // Fetch subfapps
    const subfappsSnapshot = await adminDb.collection('subfapps')
      .orderBy('memberCount', 'desc')
      .limit(5)
      .get()

    const subfapps = subfappsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        name: doc.id,
        memberCount: data.memberCount || 0,
        description: data.description || '',
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    })

    // Get user's memberships if logged in
    let memberships: string[] = []
    if (userId) {
      const subfappsSnapshot = await adminDb.collection('subfapps').get()
      const membershipPromises = subfappsSnapshot.docs.map(async (subfappDoc) => {
        const memberDoc = await adminDb
          .collection('subfapps')
          .doc(subfappDoc.id)
          .collection('members')
          .doc(userId)
          .get()
        
        return memberDoc.exists ? subfappDoc.id : null
      })

      memberships = (await Promise.all(membershipPromises))
        .filter((subfappName): subfappName is string => subfappName !== null)
    }

    return {
      props: {
        initialPosts: JSON.parse(JSON.stringify(posts)),
        initialVotedPosts: votedPosts,
        subfapps: JSON.parse(JSON.stringify(subfapps)),
        initialMemberships: memberships
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    return {
      props: {
        initialPosts: [],
        initialVotedPosts: {},
        subfapps: [],
        initialMemberships: []
      }
    }
  }
}

export default Home