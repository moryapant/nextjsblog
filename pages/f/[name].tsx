import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminDb } from '../../lib/firebase-admin'
import { where, limit } from 'firebase-admin/firestore'

interface Post {
  id: string
  title: string
  content: string
  imageUrl?: string
  subfapp: string
  userId: string
  createdAt: string
  updatedAt: string
  upvotes: number
  downvotes: number
  commentCount: number
}

interface Subfapp {
  name: string
  memberCount: number
  description: string | null
  createdAt: string
  updatedAt: string
}

interface SubfappPageProps {
  subfapp: Subfapp
  posts: Post[]
  isJoined: boolean
  initialVotedPosts: Record<string, 'up' | 'down'>
  randomPosts: Post[]
}

export default function SubfappPage({ 
  subfapp, 
  posts: initialPosts, 
  isJoined: initialIsJoined,
  initialVotedPosts,
  randomPosts
}: SubfappPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [posts, setPosts] = useState(initialPosts)
  const [isJoined, setIsJoined] = useState(initialIsJoined)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [votedPosts, setVotedPosts] = useState(initialVotedPosts)

  // Check membership status when user changes
  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setIsJoined(false)
        return
      }

      try {
        const memberDoc = await adminDb
          .collection('subfapps')
          .doc(subfapp.name)
          .collection('members')
          .doc(user.uid)
          .get()

        setIsJoined(memberDoc.exists)
      } catch (error) {
        console.error('Error checking membership:', error)
      }
    }

    checkMembership()
  }, [user, subfapp.name])

  // Fetch user's votes when component mounts
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!user) {
        setVotedPosts({})
        return
      }

      try {
        const votesSnapshot = await Promise.all(
          posts.map(post => 
            getDoc(doc(db, 'posts', post.id, 'votes', user.uid))
          )
        )
        const voteMap: Record<string, 'up' | 'down'> = {}
        votesSnapshot.forEach((voteDoc, index) => {
          if (voteDoc.exists()) {
            voteMap[posts[index].id] = voteDoc.data().voteType
          }
        })
        setVotedPosts(voteMap)
      } catch (error) {
        console.error('Error fetching user votes:', error)
      }
    }

    fetchUserVotes()
  }, [user, posts])

  const handleJoinSubfapp = async () => {
    if (!user) {
      setError('Please sign in to join communities')
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsJoining(true)

    try {
      const action = isJoined ? 'leave' : 'join'
      const response = await fetch('/api/subfapps/membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          subfappName: subfapp.name,
          action
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update membership')
      }

      const data = await response.json()
      setIsJoined(!isJoined)
      
      // Update the member count
      setPosts(prevPosts => prevPosts.map(post => 
        post.subfapp === subfapp.name 
          ? { ...post, memberCount: data.memberCount }
          : post
      ))

      // Refresh the page to get updated data
      router.replace(router.asPath)
    } catch (error) {
      console.error('Error updating membership:', error)
      setError('Error updating membership')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsJoining(false)
    }
  }

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!user) {
      setError('Please sign in to vote')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      // If clicking the same vote type, remove the vote
      const currentVote = votedPosts[postId]
      const newVoteType = currentVote === voteType ? null : voteType

      const response = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId, 
          voteType: newVoteType,
          userId: user.uid 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const updatedPost = await response.json()
      
      // Update posts state with new vote counts
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, upvotes: updatedPost.upvotes, downvotes: updatedPost.downvotes }
          : post
      ))

      // Update votedPosts state
      setVotedPosts(prev => ({ 
        ...prev, 
        [postId]: newVoteType 
      }))
    } catch (error) {
      console.error('Error voting:', error)
      setError('Error voting on post')
      setTimeout(() => setError(null), 3000)
    }
  }

  const canViewPosts = user && isJoined

  return (
    <div className="min-h-screen bg-[#DAE0E6] pt-16">
      <Head>
        <title>f/{subfapp.name} - Bollyshaggers</title>
      </Head>

      {error && (
        <div className="fixed top-20 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md transition-all duration-500 z-50">
          {error}
        </div>
      )}

      {/* Subfapp Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                  f/
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">f/{subfapp.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {subfapp.memberCount.toLocaleString()} members
                  </p>
                </div>
              </div>
              {user ? (
                <button
                  onClick={handleJoinSubfapp}
                  disabled={isJoining}
                  className={`px-8 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                    isJoined
                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isJoining ? 'Loading...' : isJoined ? 'Joined' : 'Join Community'}
                </button>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="px-8 py-2.5 rounded-full font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200"
                >
                  Sign in to Join
                </button>
              )}
            </div>
            {subfapp.description && (
              <p className="text-gray-600 mt-4 max-w-3xl">{subfapp.description}</p>
            )}
          </div>
        </div>
      </div>

      <main className="py-6">
        <div className="flex gap-6 px-4 max-w-[2000px] mx-auto">
          {/* Main content */}
          <div className="flex-1">
            <div className="max-w-none">
              <div className="space-y-4">
                {/* Create Post Card */}
                {isJoined && (
                  <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                    <Link 
                      href={`/post/create?subfapp=${subfapp.name}`}
                      className="flex items-center space-x-3 text-gray-500 hover:bg-gray-50 p-2 rounded-md transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                      <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-400">
                        Create Post
                      </div>
                    </Link>
                  </div>
                )}

                {/* Posts Section */}
                {!user ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <div className="max-w-md mx-auto">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to View Posts</h2>
                      <p className="text-gray-600 mb-6">Join the community to see and interact with posts</p>
                      <button
                        onClick={() => router.push('/login')}
                        className="px-8 py-3 rounded-full font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                ) : !isJoined ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <div className="max-w-md mx-auto">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Join to View Posts</h2>
                      <p className="text-gray-600 mb-6">Join this community to see all posts and participate in discussions</p>
                      <button
                        onClick={handleJoinSubfapp}
                        disabled={isJoining}
                        className="px-8 py-3 rounded-full font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                      >
                        {isJoining ? 'Joining...' : 'Join Now'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <article key={post.id} className="bg-white rounded-lg shadow-sm hover:border hover:border-gray-300 transition-all duration-200">
                        <div className="flex">
                          {/* Vote buttons */}
                          <div className="flex flex-col items-center w-12 pt-2 bg-gray-50">
                            <button 
                              onClick={() => handleVote(post.id, 'up')}
                              className={`w-8 h-8 flex items-center justify-center rounded transition-all duration-200 ${
                                !user 
                                  ? 'cursor-not-allowed opacity-50' 
                                  : votedPosts[post.id] === 'up'
                                  ? 'text-green-500' 
                                  : 'text-gray-400 hover:text-green-500'
                              }`}
                              disabled={!user}
                              title={user ? 'Upvote' : 'Sign in to vote'}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`w-7 h-7 transform transition-transform ${
                                  votedPosts[post.id] === 'up' ? 'scale-110' : ''
                                }`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 4l8 8h-16z"/>
                              </svg>
                            </button>
                            
                            <span className={`text-sm font-semibold my-1 ${
                              votedPosts[post.id] === 'up' 
                                ? 'text-green-500'
                                : votedPosts[post.id] === 'down'
                                ? 'text-red-500'
                                : 'text-gray-800'
                            }`}>
                              {post.upvotes - post.downvotes}
                            </span>
                            
                            <button 
                              onClick={() => handleVote(post.id, 'down')}
                              className={`w-8 h-8 flex items-center justify-center rounded transition-all duration-200 ${
                                !user 
                                  ? 'cursor-not-allowed opacity-50' 
                                  : votedPosts[post.id] === 'down'
                                  ? 'text-red-500' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                              disabled={!user}
                              title={user ? 'Downvote' : 'Sign in to vote'}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`w-7 h-7 transform transition-transform ${
                                  votedPosts[post.id] === 'down' ? 'scale-110' : ''
                                }`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 20l-8-8h16z"/>
                              </svg>
                            </button>
                          </div>

                          {/* Post content */}
                          <div className="flex-1 p-4">
                            <Link href={`/post/${post.id}`} className="block group">
                              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {post.title}
                              </h2>
                              {post.imageUrl && (
                                <div className="mt-3 relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                              <div className="mt-2 text-xs text-gray-500">
                                Posted by Anonymous • {new Date(post.createdAt).toLocaleDateString()}
                              </div>
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                    {posts.length === 0 && (
                      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="max-w-md mx-auto">
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Posts Yet</h2>
                          <p className="text-gray-600 mb-6">Be the first one to create a post in this community!</p>
                          <Link
                            href={`/post/create?subfapp=${subfapp.name}`}
                            className="px-8 py-3 rounded-full font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors inline-block"
                          >
                            Create First Post
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-96 flex-shrink-0 space-y-4">
            {/* Random Posts Card */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Random Posts</h2>
              <div className="space-y-4">
                {randomPosts.map(post => (
                  <Link 
                    key={post.id} 
                    href={`/post/${post.id}`}
                    className="block group"
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                          {post.title}
                        </h3>
                        <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                          <span>f/{post.subfapp}</span>
                          <span>•</span>
                          <span>{post.upvotes - post.downvotes} points</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Community Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-2">About Community</h2>
              <p className="text-sm text-gray-600 mb-4">{subfapp.description}</p>
              <div className="text-sm text-gray-500">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  <span>{subfapp.memberCount.toLocaleString()} members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                  </svg>
                  <span>Created {new Date(subfapp.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  try {
    const userId = req.cookies.auth ? JSON.parse(req.cookies.auth).uid : null
    const subfappName = params?.name as string

    // Get subfapp details
    const subfappDoc = await adminDb.collection('subfapps').doc(subfappName).get()
    if (!subfappDoc.exists) {
      return { notFound: true }
    }

    const subfappData = subfappDoc.data()
    const subfapp = {
      name: subfappDoc.id,
      ...subfappData,
      createdAt: subfappData?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: subfappData?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      memberCount: subfappData?.memberCount || 0,
      description: subfappData?.description || ''
    }

    // Get posts for this subfapp
    const postsSnapshot = await adminDb.collection('posts')
      .where('subfapp', '==', subfappName)
      .get()
    
    const posts = postsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
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

    // Check user membership if logged in
    let isJoined = false
    let userVotes = {}
    if (userId) {
      const memberDoc = await adminDb
        .collection('subfapps')
        .doc(subfappName)
        .collection('members')
        .doc(userId)
        .get()
      isJoined = memberDoc.exists

      // Get user votes
      const votesPromises = posts.map(post => 
        adminDb.collection('posts')
          .doc(post.id)
          .collection('votes')
          .doc(userId)
          .get()
      )
      const voteDocs = await Promise.all(votesPromises)
      userVotes = voteDocs.reduce((acc, doc, index) => {
        if (doc.exists) {
          acc[posts[index].id] = doc.data()?.voteType
        }
        return acc
      }, {})
    }

    // Get random posts
    const randomPosts = await adminDb.collection('posts')
      .where('subfapp', '!=', subfappName)
      .limit(5)
      .get()
      .then(snapshot => snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          title: data.title || '',
          content: data.content || '',
          imageUrl: data.imageUrl || null,
          subfapp: data.subfapp || '',
          userId: data.userId || '',
          upvotes: data.upvotes || 0,
          downvotes: data.downvotes || 0,
          commentCount: data.commentCount || 0
        }
      }))

    return {
      props: {
        subfapp: JSON.parse(JSON.stringify(subfapp)),
        posts: JSON.parse(JSON.stringify(posts)),
        isJoined,
        initialVotedPosts: userVotes,
        randomPosts: JSON.parse(JSON.stringify(randomPosts))
      }
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    return { notFound: true }
  }
} 