export interface User {
    _id: string
    name: string
    profileImage?: string
  }
  export interface Comment {
    _id: string
    content: string
    author: User
    createdAt: string
    updatedAt?: string
    replies?: Comment[]
  }
  export interface PostImage {
    url: string
    caption?: string
  }
  export interface Post {
    id: string
    title: string
    content: string
    images: PostImage[]
    author: User
    tags: string[]
    likes: string[]
    comments: Comment[]
    plants?: string[]
    category?: 'question' | 'discussion' | 'tip' | 'problem' | 'success'
    createdAt: string
    updatedAt: string
  }
  export interface CreatePostData {
    title: string
    content: string
    images?: PostImage[]
    tags?: string[]
    plants?: string[]
    category?: Post['category']
  }
  export interface UpdatePostData extends Partial<CreatePostData> {}
  export interface PostsResponse {
    posts: Post[]
    total: number
    page: number
    totalPages: number
  }
  export interface PostFilters {
    page?: number
    limit?: number
    tag?: string
    search?: string
    category?: Post['category']
    sortBy?: 'latest' | 'popular' | 'mostCommented'
  }
  export interface CreateCommentData {
    content: string
    parentId?: string
  }
  