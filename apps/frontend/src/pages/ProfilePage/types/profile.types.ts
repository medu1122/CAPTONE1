export interface UserProfile {
  _id: string
  username: string
  email: string
  phone?: string
  avatar?: string
  bio?: string
  isVerified?: boolean
  address?: {
    street?: string
    province?: string
    district?: string
  }
  settings: {
    emailNotifications: boolean
    smsNotifications: boolean
    language: 'vi' | 'en'
    theme: 'light' | 'dark'
    privacy: 'public' | 'friends' | 'private'
    showEmail: boolean
    showPhone: boolean
  }
  statistics: {
    posts: number
    comments: number
    likes: number
    plants: number
  }
  createdAt: string
  updatedAt: string
  joinDate?: string
  lastActiveAt?: string
}

export interface UpdateProfileData
  extends Partial<
    Omit<UserProfile, '_id' | 'createdAt' | 'updatedAt' | 'statistics'>
  > {}
