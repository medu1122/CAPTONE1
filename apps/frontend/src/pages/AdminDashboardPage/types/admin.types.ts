export interface User {
    id: string
    avatar: string
    name: string
    email: string
    status: 'active' | 'blocked'
    verified: boolean
    role: 'user' | 'admin'
    joinedDate: string
    online: boolean
  }
  
  export interface StatCardData {
    title: string
    value: number
    icon: string
    color: 'blue' | 'green' | 'orange' | 'red' | 'purple'
    trend?: {
      value: number
      direction: 'up' | 'down'
    }
    subtext?: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  
  export interface ChartData {
    label: string
    value: number
  }
  
  export interface Disease {
    name: string
    count: number
  }
  
  export interface Plant {
    name: string
    count: number
  }
  
  export interface Post {
    id: string
    author: {
      avatar: string
      name: string
    }
    title: string
    likes: number
    comments: number
  }
  
  export interface Complaint {
    id: string
    type: 'complaint' | 'report'
    user: {
      avatar: string
      name: string
    }
    title: string
    description: string
    status: 'pending' | 'reviewing' | 'resolved' | 'rejected'
    date: string
    relatedItem?: string
  }
  