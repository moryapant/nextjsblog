export interface Post {
  id: string
  title: string
  content: string
  imageUrl?: string
  subfapp: string
  userId: string
  upvotes: number
  downvotes: number
  commentCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  postId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: Date
  updatedAt: Date
  likes: number
}

export interface Reply {
  id: string
  commentId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: Date
}

export interface Subfapp {
  name: string
  memberCount: number
  description?: string
  createdAt: Date
  updatedAt: Date
} 