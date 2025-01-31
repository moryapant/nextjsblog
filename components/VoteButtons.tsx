import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface VoteButtonsProps {
  postId: string
  initialUpvotes: number
  initialDownvotes: number
  initialUserVote?: 'up' | 'down' | null
  onVoteError?: (message: string) => void
  className?: string
}

export const VoteButtons = ({ 
  postId, 
  initialUpvotes, 
  initialDownvotes,
  initialUserVote = null,
  onVoteError,
  className = ''
}: VoteButtonsProps) => {
  const { user } = useAuth()
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(initialUserVote)
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)

  useEffect(() => {
    const fetchUserVote = async () => {
      if (!user) {
        setUserVote(null)
        return
      }

      try {
        const response = await fetch(`/api/posts/user-vote?postId=${postId}&userId=${user.uid}`)
        if (response.ok) {
          const data = await response.json()
          setUserVote(data.userVote)
        }
      } catch (error) {
        console.error('Error fetching user vote:', error)
      }
    }

    fetchUserVote()
  }, [user, postId])

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      onVoteError?.('Please sign in to vote')
      return
    }

    try {
      const response = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, voteType, userId: user.uid }),
      })

      if (!response.ok) throw new Error('Failed to vote')

      const data = await response.json()
      setUpvotes(data.upvotes)
      setDownvotes(data.downvotes)
      setUserVote(data.userVote)
    } catch (error) {
      onVoteError?.('Error voting on post')
    }
  }

  const getVoteScore = () => upvotes - downvotes

  return (
    <div className={`flex flex-col items-center w-12 pt-3 bg-gray-100 ${className}`}>
      <button
        onClick={(e) => {
          e.preventDefault()
          handleVote('up')
        }}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
          userVote === 'up' 
            ? 'text-green-500 bg-green-50' 
            : 'text-gray-400 hover:text-green-500 hover:bg-gray-100'
        }`}
        aria-label="Upvote"
      >
        <svg 
          className={`w-5 h-5 ${userVote === 'up' ? 'transform scale-110' : ''}`}
          viewBox="0 0 24 24" 
          fill={userVote === 'up' ? 'currentColor' : 'none'} 
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
        userVote === 'up' 
          ? 'text-green-500'
          : userVote === 'down'
          ? 'text-red-500'
          : 'text-gray-800'
      }`}>
        {getVoteScore()}
      </span>
      
      <button 
        onClick={(e) => {
          e.preventDefault()
          handleVote('down')
        }}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
          userVote === 'down' 
            ? 'text-red-500 bg-red-50' 
            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
        }`}
        aria-label="Downvote"
      >
        <svg 
          className={`w-5 h-5 ${userVote === 'down' ? 'transform scale-110' : ''}`}
          viewBox="0 0 24 24" 
          fill={userVote === 'down' ? 'currentColor' : 'none'} 
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
  )
} 