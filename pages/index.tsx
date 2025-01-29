import Link from 'next/link'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { executeQuery } from '../lib/db'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Post } from '../types'

interface Subfapp {
  name: string
  member_count: number
  description: string
}

interface HomePageProps {
  latestPosts: Post[]
  randomPosts: Post[]
  subfapps: Subfapp[]
  joinedSubfapps: string[]
}

const Home = ({ latestPosts, randomPosts, subfapps = [], joinedSubfapps = [] }: HomePageProps) => {
  const { user, dbUser } = useAuth()
  const [posts, setPosts] = useState(latestPosts)
  const [votedPosts, setVotedPosts] = useState<Record<number, 'up' | 'down' | null>>({})
  const [voteError, setVoteError] = useState<string | null>(null)
  const [userJoinedSubfapps, setUserJoinedSubfapps] = useState<string[]>(joinedSubfapps)
  const [isJoining, setIsJoining] = useState<string | null>(null)

  // Fetch user votes when component mounts or user changes
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!user) {
        setVotedPosts({})
        return
      }

      try {
        const response = await fetch(`/api/posts/user-votes?userId=${user.uid}`)
        if (response.ok) {
          const votes = await response.json()
          console.log('Fetched votes:', votes) // Debug log
          const voteMap: Record<number, 'up' | 'down'> = {}
          votes.forEach((vote: { post_id: number; vote_type: 'up' | 'down' }) => {
            voteMap[vote.post_id] = vote.vote_type
          })
          console.log('Vote map:', voteMap) // Debug log
          setVotedPosts(voteMap)
        }
      } catch (error) {
        console.error('Error fetching user votes:', error)
      }
    }

    fetchUserVotes()
  }, [user])

  const handleVote = async (postId: number, voteType: 'up' | 'down') => {
    if (!user) {
      setVoteError('Please sign in to vote')
      setTimeout(() => setVoteError(null), 3000)
      return
    }

    // If clicking the same vote type, show message
    if (votedPosts[postId] === voteType) {
      setVoteError(`You've already ${voteType}voted this post`)
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
        const error = await response.json()
        throw new Error(error.message)
      }

      const updatedPost = await response.json()
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, upvotes: updatedPost.upvotes, downvotes: updatedPost.downvotes }
          : post
      ))
      setVotedPosts(prev => ({ ...prev, [postId]: voteType }))
    } catch (error) {
      if (error instanceof Error) {
        setVoteError(error.message)
      } else {
        setVoteError('Error voting on post')
      }
      setTimeout(() => setVoteError(null), 3000)
    }
  }

  const getVoteScore = (post: Post) => {
    return post.upvotes - post.downvotes
  }

  const handleJoinSubfapp = async (subfappName: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      setVoteError('Please sign in to join communities')
      setTimeout(() => setVoteError(null), 3000)
      return
    }

    setIsJoining(subfappName)

    try {
      const action = userJoinedSubfapps.includes(subfappName) ? 'leave' : 'join'
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

      setUserJoinedSubfapps(prev => 
        action === 'join'
          ? [...prev, subfappName]
          : prev.filter(name => name !== subfappName)
      )
    } catch (error) {
      setVoteError('Error updating membership')
      setTimeout(() => setVoteError(null), 3000)
    } finally {
      setIsJoining(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#DAE0E6] pt-16">
      <Head>
        <title>Bollyshaggers</title>
        <meta name="description" content="A community for Bollywood enthusiasts" />
      </Head>

      {/* Error Toast */}
      {voteError && (
        <div className="fixed top-20 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md transition-all duration-500 z-50">
          {voteError}
        </div>
      )}

      <main className="py-6">
        <div className="flex gap-6 px-4 max-w-[2000px] mx-auto">
          {/* Left Sidebar */}
          {subfapps.length > 0 && (
            <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-blue-500 text-white">
                  <h2 className="font-semibold text-lg">Popular Subfapps</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {subfapps.map((subfapp) => (
                    <Link 
                      key={subfapp.name}
                      href={`/f/${subfapp.name}`}
                      className="block hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                              f/
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 hover:text-blue-600">
                                {subfapp.name}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {subfapp.member_count.toLocaleString()} members
                              </p>
                            </div>
                          </div>
                          {user ? (
                            <button 
                              onClick={(e) => handleJoinSubfapp(subfapp.name, e)}
                              disabled={isJoining === subfapp.name}
                              className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                                userJoinedSubfapps.includes(subfapp.name)
                                  ? 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
                                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                              }`}
                            >
                              {isJoining === subfapp.name
                                ? 'Loading...'
                                : userJoinedSubfapps.includes(subfapp.name)
                                ? 'Leave'
                                : 'Join'}
                            </button>
                          ) : (
                            <Link
                              href="/login"
                              onClick={(e) => e.stopPropagation()}
                              className="px-4 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                            >
                              Join
                            </Link>
                          )}
                        </div>
                        {subfapp.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {subfapp.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="p-3 bg-gray-50 border-t border-gray-100">
                  <Link 
                    href="/subfapps"
                    className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All Subfapps
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-5xl mx-auto">
              <div className="space-y-2">
                {posts.map((post) => (
                  <Link href={`/post/${post.id}#comments`} key={post.id}>
                    <article className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="p-3">
                        <div className="flex">
                          {/* Vote buttons */}
                          <div className="flex flex-col items-center w-10 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                handleVote(post.id, 'up')
                              }}
                              className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 ${
                                votedPosts[post.id] === 'up' ? 'text-blue-600' : 'text-gray-400'
                              }`}
                            >
                              <svg 
                                className={`w-5 h-5 ${
                                  votedPosts[post.id] === 'up' ? 'transform scale-110' : ''
                                }`}
                                viewBox="0 0 24 24" 
                                fill={votedPosts[post.id] === 'up' ? 'currentColor' : 'none'} 
                                stroke="currentColor" 
                                strokeWidth="2.5"
                              >
                                <path 
                                  d="M12 4l8 8H4l8-8z" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            
                            <span className={`text-sm font-bold my-1 ${
                              votedPosts[post.id] === 'up' 
                                ? 'text-green-500'
                                : votedPosts[post.id] === 'down'
                                ? 'text-red-500'
                                : 'text-gray-800'
                            }`}>
                              {getVoteScore(post)}
                            </span>
                            
                            <button 
                              onClick={(e) => {
                                e.preventDefault()
                                handleVote(post.id, 'down')
                              }}
                              className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 ${
                                votedPosts[post.id] === 'down' 
                                  ? 'text-red-500'
                                  : 'text-gray-400'
                              }`}
                            >
                              <svg 
                                className={`w-5 h-5 ${
                                  votedPosts[post.id] === 'down' ? 'transform scale-110' : ''
                                }`}
                                viewBox="0 0 24 24" 
                                fill={votedPosts[post.id] === 'down' ? 'currentColor' : 'none'} 
                                stroke="currentColor" 
                                strokeWidth="2.5"
                              >
                                <path 
                                  d="M4 8l8 8 8-8H4z" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Post content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center text-xs text-gray-500 space-x-2">
                              <span>Posted in f/{post.subfapp}</span>
                              <span>•</span>
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                            <h2 className="mt-1 text-lg font-semibold text-gray-900 leading-tight">
                              {post.title}
                            </h2>
                            {post.image_url && (
                              <div className="mt-3">
                                <div className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden">
                                  <img 
                                    src={post.image_url} 
                                    alt={post.title}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    loading="lazy"
                                  />
                                </div>
                              </div>
                            )}
                            <div className="mt-2 flex items-center space-x-4 text-gray-500 text-sm">
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>{post.comment_count} Comments</span>
                              </div>
                              <button className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-full transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span>Share</span>
                              </button>
                              <button className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-full transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
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
                    <div className="flex items-start space-x-3">
                      {/* Thumbnail */}
                      {post.image_url && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                          <img
                            src={post.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                          {post.title}
                        </h3>
                        <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                          <span>f/{post.subfapp}</span>
                          <span>•</span>
                          <span>{post.upvotes - post.downvotes} points</span>
                          <span>•</span>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Popular Communities Card */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Popular Communities</h2>
              <div className="space-y-3">
                <Link 
                  href="/f/movies"
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
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
      <div className="mt-6 text-center text-sm text-gray-600">
        By continuing, you agree to Bollyshaggers's Terms of Service and Privacy Policy
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    // Get user ID from auth cookie
    const authCookie = req.cookies['auth']
    let userId = null
    if (authCookie) {
      try {
        const decodedToken = JSON.parse(authCookie)
        userId = decodedToken.uid
      } catch (error) {
        console.error('Error decoding auth token:', error)
      }
    }

    const [latestPosts, randomPosts, subfapps, joinedSubfapps] = await Promise.all([
      // Get latest posts
      executeQuery<Post[]>({
        query: `
          SELECT 
            p.*,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
          FROM posts p
          ORDER BY created_at DESC
          LIMIT 10
        `,
        values: []
      }),

      // Get random posts
      executeQuery<Post[]>({
        query: `
          SELECT 
            id,
            title,
            subfapp,
            image_url,
            upvotes,
            downvotes,
            created_at
          FROM posts 
          ORDER BY RAND()
          LIMIT 5
        `,
        values: []
      }),

      // Get popular subfapps
      executeQuery<Subfapp[]>({
        query: `
          SELECT 
            name,
            member_count,
            description
          FROM subfapps
          ORDER BY member_count DESC
          LIMIT 10
        `,
        values: []
      }),

      // Get user's joined subfapps
      userId ? executeQuery<{ subfapp_name: string }[]>({
        query: `
          SELECT subfapp_name
          FROM subfapp_members
          WHERE user_id = ?
        `,
        values: [userId]
      }).then(results => results.map(r => r.subfapp_name))
        .catch(() => []) : Promise.resolve([])
    ])

    return {
      props: {
        latestPosts: JSON.parse(JSON.stringify(latestPosts)),
        randomPosts: JSON.parse(JSON.stringify(randomPosts)),
        subfapps: JSON.parse(JSON.stringify(subfapps || [])),
        joinedSubfapps: JSON.parse(JSON.stringify(joinedSubfapps))
      }
    }
  } catch (error) {
    console.error('Error fetching posts:', error)
    return {
      props: {
        latestPosts: [],
        randomPosts: [],
        subfapps: [],
        joinedSubfapps: []
      }
    }
  }
}

export default Home