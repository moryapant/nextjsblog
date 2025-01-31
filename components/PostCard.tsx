import Link from 'next/link'
import { VoteButtons } from './VoteButtons'

interface PostCardProps {
  post: {
    id: string
    title: string
    content?: string
    image_url?: string
    subfapp: string
    created_at: string
    upvotes: number
    downvotes: number
    comment_count: number
  }
  userVote?: 'up' | 'down' | null
  onVoteError: (message: string) => void
}

export const PostCard = ({ post, userVote, onVoteError }: PostCardProps) => {
  return (
    <Link href={`/post/${post.id}#comments`}>
      <article className="transition-all duration-200 bg-white rounded-lg shadow-sm hover:shadow-md group">
        <div className="flex">
          <VoteButtons
            postId={post.id}
            initialUpvotes={post.upvotes}
            initialDownvotes={post.downvotes}
            initialUserVote={userVote}
            onVoteError={onVoteError}
            className="border-r border-gray-100"
          />
          
          <div className="flex-1 p-4">
            {/* Post Header */}
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Link 
                href={`/f/${post.subfapp}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-2 py-1 font-medium text-blue-600 transition-colors rounded-full bg-blue-50 hover:bg-blue-100"
              >
                <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px] mr-1">
                  f/
                </span>
                {post.subfapp}
              </Link>
              <span>•</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>

            {/* Post Title */}
            <h2 className="mt-2 text-lg font-semibold leading-tight text-gray-900 transition-colors group-hover:text-blue-600">
              {post.title}
            </h2>

            {/* Post Image */}
            {post.image_url && (
              <div className="mt-3">
                <div className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={post.image_url} 
                    alt={post.title}
                    className="absolute inset-0 object-cover w-full h-full"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center m-1 mt-3 space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
                <span>{post.comment_count} Comments</span>
              </div>
              
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Add share functionality
                }}
                className="flex items-center px-3 py-1 space-x-2 transition-colors rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
                  />
                </svg>
                <span>Share</span>
              </button>
              
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Add save functionality
                }}
                className="flex items-center px-3 py-1 space-x-2 transition-colors rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                  />
                </svg>
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
} 