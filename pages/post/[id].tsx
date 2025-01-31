import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { executeQuery } from '../../lib/db'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { VoteButtons } from '../../components/VoteButtons'
import { adminDb } from '../../lib/firebase-admin'

interface Post {
  id: string
  title: string
  content: string | null
  imageUrl: string | null
  publishedDate: string
  subfapp: string | null
  createdAt: string
  updatedAt: string
  downvotes: number
  upvotes: number
  userId: string
}

interface Subfapp {
  name: string
  memberCount: number
  description: string | null
  createdAt: string
  updatedAt: string
}

interface PostDetailProps {
  post: Post
  subfapps: Subfapp[]
  userMemberships: string[]
}

interface CommentReply {
  id: number
  content: string
  user_id: string
  user_name: string
  user_avatar: string | null
  created_at: string
  formatted_date: string
}

interface Reply {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  content: string
  createdAt: string
  updatedAt: string
}

interface Comment {
  id: string
  content: string
  userId: string
  userName: string
  userAvatar: string | null
  createdAt: string
  updatedAt: string
  likes: number
  replyCount: number
  replies?: Reply[]
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'

export default function PostDetail({ 
  post: initialPost, 
  subfapps = [],
  userMemberships = []
}: PostDetailProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState(initialPost)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [votedPosts, setVotedPosts] = useState<Record<string, 'up' | 'down' | null>>({})
  const [joinedSubfapps, setJoinedSubfapps] = useState<string[]>(userMemberships)
  const [isJoining, setIsJoining] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [likedComments, setLikedComments] = useState<string[]>([])
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null)

  // Fetch user's vote when component mounts
  useEffect(() => {
    const fetchUserVote = async () => {
      if (!user || !post) return;

      try {
        const response = await fetch(`/api/posts/user-vote?postId=${post.id}&userId=${user.uid}`)
        if (!response.ok) throw new Error('Failed to fetch vote')
        
        const data = await response.json()
        setUserVote(data.userVote)
      } catch (error) {
        console.error('Error fetching user vote:', error)
      }
    }

    fetchUserVote()
  }, [user, post?.id])

  // Add this effect to fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!post) return;

      try {
        const response = await fetch(`/api/comments?postId=${post.id}`)
        if (!response.ok) throw new Error('Failed to fetch comments')
        
        const data = await response.json()
        setComments(data)
      } catch (error) {
        console.error('Error fetching comments:', error)
      }
    }

    fetchComments()
  }, [post?.id])

  const handleVote = async (voteType: 'up' | 'down') => {
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
          postId: post.id, 
          voteType,
          userId: user.uid 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const data = await response.json()
      setPost(prev => ({ 
        ...prev, 
        upvotes: data.upvotes, 
        downvotes: data.downvotes 
      }))
      setUserVote(data.userVote)
    } catch (error) {
      setVoteError('Error voting on post')
      setTimeout(() => setVoteError(null), 3000)
    }
  }

  const getVoteScore = () => {
    return post.upvotes - post.downvotes
  }

  const handleBack = () => {
    router.back()
  }

  const handleJoinSubfapp = async (subfappName: string) => {
    if (!user) {
      setVoteError('Please sign in to join subfapps')
      setTimeout(() => setVoteError(null), 3000)
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

      setJoinedSubfapps(prev => 
        action === 'join' 
          ? [...prev, subfappName]
          : prev.filter(name => name !== subfappName)
      )
    } catch (error) {
      setVoteError('Error updating membership')
      setTimeout(() => setVoteError(null), 3000)
    } finally {
      setIsJoining(prev => ({ ...prev, [subfappName]: false }))
    }
  }

  // Add comment handler
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          userId: user.uid,
          content: newComment,
          userName: user.displayName || 'Anonymous',
          userAvatar: user.photoURL
        }),
      })

      if (response.ok) {
        // Refresh comments
        const commentsResponse = await fetch(`/api/comments?postId=${post.id}`)
        const newComments = await commentsResponse.json()
        setComments(newComments)
        setNewComment('')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) return

    try {
      const response = await fetch('/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId: user.uid })
      })

      if (response.ok) {
        const { likeCount } = await response.json()
        setComments(comments.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: likeCount } 
            : comment
        ))
        setLikedComments(prev => 
          prev.includes(commentId)
            ? prev.filter(id => id !== commentId)
            : [...prev, commentId]
        )
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const handleReply = async (commentId: string) => {
    if (!user || !replyContent.trim()) return

    try {
      const response = await fetch('/api/comments/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentCommentId: commentId,
          userId: user.uid,
          content: replyContent,
          userName: user.displayName || 'Anonymous',
          userAvatar: user.photoURL
        })
      })

      if (response.ok) {
        const newReply = await response.json()
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), newReply]
              }
            : comment
        ))
        setReplyingTo(null)
        setReplyContent('')
      }
    } catch (error) {
      console.error('Error posting reply:', error)
    }
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#DAE0E6] pt-16">
      <Head>
        <title>{post.title} - Bollyshaggers</title>
      </Head>

      {voteError && (
        <div className="fixed top-20 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md transition-all duration-500 z-50">
          {voteError}
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          {subfapps?.length > 0 && (
            <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Popular Communities
                  </h3>
                  {subfapps.map((subfapp) => (
                    <div key={subfapp.name} className="mt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link href={`/f/${subfapp.name}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                            f/{subfapp.name}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {subfapp.memberCount.toLocaleString()} members
                          </p>
                        </div>
                        <button
                          onClick={() => handleJoinSubfapp(subfapp.name)}
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
          <div className={`flex-1 ${subfapps?.length > 0 ? 'max-w-3xl' : 'max-w-3xl mx-auto'}`}>
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Posts</span>
            </button>

            {/* Post Article */}
            <article className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="flex">
                <VoteButtons
                  postId={post.id}
                  initialUpvotes={post.upvotes}
                  initialDownvotes={post.downvotes}
                  initialUserVote={userVote}
                  onVoteError={setVoteError}
                  orientation="horizontal"
                  size="medium"
                  className="hover:shadow-md"
                />

                {/* Post content */}
                <div className="flex-1 min-w-0">
                  {/* Post Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-2 mb-3">
                      <Link 
                        href={`/f/${post.subfapp}`}
                        className="group/subfapp inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-full font-medium transition-all duration-200"
                      >
                        <div className="flex items-center">
                          <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-1.5">
                            f/
                          </span>
                          <span className="font-semibold group-hover/subfapp:underline">
                            {post.subfapp}
                          </span>
                        </div>
                      </Link>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Posted by Anonymous</span>
                        <span className="mx-2 text-gray-300">•</span>
                        <time className="text-gray-500">
                          {new Date(post.publishedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </time>
                      </div>
                    </div>

                    {/* Post Title */}
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      {post.title}
                    </h1>
                  </div>

                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="px-6 my-6">
                      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="absolute inset-0 w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="prose prose-lg max-w-none px-6 mb-6">
                    {post.content?.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-800 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center space-x-4 mt-4">
                    <button className="flex items-center space-x-2 hover:bg-gray-50 px-4 py-2 rounded-full transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium">Comments</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:bg-gray-50 px-4 py-2 rounded-full transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span className="font-medium">Share</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  <div className="mt-8 px-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Comments</h2>
                    
                    {!user ? (
                      <div className="mb-8 p-6 bg-blue-50 rounded-xl text-center border border-blue-100">
                        <p className="text-gray-700 mb-2">Join the conversation</p>
                        <p className="text-gray-600 text-sm mb-4">Sign in to leave a comment</p>
                        <Link 
                          href={`/login?returnUrl=${encodeURIComponent(router.asPath)}`}
                          className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                          Sign In
                        </Link>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitComment} className="mb-8">
                        <div className="flex items-start space-x-3">
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL}
                              alt={user.displayName || 'User'}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement
                                img.src = DEFAULT_AVATAR
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm">
                              {(user.displayName || 'A')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="What are your thoughts?"
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[120px] text-gray-700 placeholder-gray-400"
                              rows={3}
                            />
                            <div className="mt-3 flex justify-end">
                              <button
                                type="submit"
                                disabled={isSubmitting || !newComment.trim()}
                                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                              >
                                {isSubmitting ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Posting...</span>
                                  </>
                                ) : (
                                  'Post Comment'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    )}

                    <div className="space-y-6">
                      {comments.map((comment) => (
                        <div key={comment.id} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5">
                          <div className="flex items-start space-x-3">
                            {comment.userAvatar ? (
                              <img 
                                src={comment.userAvatar}
                                alt={comment.userName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement
                                  img.src = DEFAULT_AVATAR
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm">
                                {comment.userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  {comment.userName}
                                </h3>
                                <span className="text-gray-300">•</span>
                                <time className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </time>
                              </div>
                              <p className="mt-2 text-gray-700 whitespace-pre-wrap break-words">
                                {comment.content}
                              </p>
                              <div className="mt-3 flex items-center space-x-4">
                                <button 
                                  onClick={() => handleLikeComment(comment.id)}
                                  className={`flex items-center space-x-1 ${
                                    likedComments.includes(comment.id)
                                      ? 'text-blue-600'
                                      : 'text-gray-500 hover:text-blue-600'
                                  }`}
                                >
                                  <svg 
                                    className="w-4 h-4" 
                                    fill={likedComments.includes(comment.id) ? 'currentColor' : 'none'} 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                  </svg>
                                  <span className="text-xs font-medium">{comment.likes || 0}</span>
                                </button>

                                <button 
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                  className="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="text-xs font-medium">Reply</span>
                                </button>
                              </div>

                              {/* Reply Form */}
                              {replyingTo === comment.id && (
                                <div className="mt-4 pl-10">
                                  <div className="flex items-start space-x-3">
                                    {user?.photoURL ? (
                                      <img 
                                        src={user.photoURL}
                                        alt={user.displayName || 'User'}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                                        onError={(e) => {
                                          const img = e.target as HTMLImageElement
                                          img.src = DEFAULT_AVATAR
                                        }}
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm">
                                        {(user?.displayName || 'A')[0].toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={2}
                                      />
                                      <div className="mt-2 flex justify-end space-x-2">
                                        <button
                                          onClick={() => setReplyingTo(null)}
                                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleReply(comment.id)}
                                          disabled={!replyContent.trim()}
                                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Replies Section */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-4 pl-10 space-y-4">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                                      <div className="flex items-start space-x-3">
                                        {reply.userAvatar ? (
                                          <img 
                                            src={reply.userAvatar}
                                            alt={reply.userName}
                                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                                            onError={(e) => {
                                              const img = e.target as HTMLImageElement
                                              img.src = DEFAULT_AVATAR
                                            }}
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm">
                                            {reply.userName.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900">
                                              {reply.userName}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <time className="text-xs text-gray-500">
                                              {new Date(reply.createdAt).toLocaleString()}
                                            </time>
                                          </div>
                                          <p className="mt-1 text-gray-700">
                                            {reply.content}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <div className="text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="mt-4 text-gray-500 text-sm">No comments yet. Be the first to share your thoughts!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const postId = params?.id as string
    const postDoc = await adminDb.collection('posts').doc(postId).get()

    if (!postDoc.exists) {
      return { notFound: true }
    }

    const postData = postDoc.data()
    const post = {
      id: postDoc.id,
      ...postData,
      // Handle dates properly
      createdAt: postData?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: postData?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }

    // Get subfapps for sidebar
    const subfappsSnapshot = await adminDb.collection('subfapps')
      .orderBy('memberCount', 'desc')
      .limit(5)
      .get()

    const subfapps = subfappsSnapshot.docs.map(doc => ({
      name: doc.id,
      ...doc.data(),
      memberCount: doc.data().memberCount || 0,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }))

    return {
      props: {
        post: JSON.parse(JSON.stringify(post)),
        subfapps: JSON.parse(JSON.stringify(subfapps))
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    return { notFound: true }
  }
} 