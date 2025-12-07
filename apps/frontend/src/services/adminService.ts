import axios from 'axios'
import { API_CONFIG } from '../config/api'
import { getAccessToken } from './authService'

const API_BASE_URL = API_CONFIG.BASE_URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('isAuthenticated')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  _id: string
  name: string
  email: string
  profileImage?: string
  status: 'active' | 'blocked'
  isVerified: boolean
  role: 'user' | 'admin'
  createdAt: string
  online?: boolean
  mutedUntil?: string | null
  muteReason?: string | null
}

export interface UserStats {
  total: number
  online: number
  unverified: number
  blocked: number
  chartData: {
    last7Days: Array<{ _id: string; count: number }>
    last30Days: Array<{ _id: string; count: number }>
  }
}

export interface AnalysisStats {
  usersToday: number
  analysesToday: number
  pendingComplaints: number
  chartData: {
    dailyUsage: Array<{ _id: string; count: number }>
  }
  topDiseases: Array<{ name: string; count: number }>
  topPlants: Array<{ name: string; count: number }>
}

export interface CommunityStats {
  postsToday: number
  likesToday: number
  commentsToday: number
  pendingReports: number
  chartData: {
    postsTrend: Array<{ _id: string; count: number }>
    interactionsTrend: Array<{ _id: string; count: number }>
    reportsTrend: {
      pending: Array<{ _id: string; count: number }>
      resolved: Array<{ _id: string; count: number }>
    }
  }
  topPosts: {
    mostLiked: Array<{
      id: string
      author: { avatar: string; name: string }
      title: string
      likes: number
      comments: number
    }>
    mostCommented: Array<{
      id: string
      author: { avatar: string; name: string }
      title: string
      likes: number
      comments: number
    }>
  }
}

export interface Complaint {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    profileImage?: string
  }
  type: 'analysis' | 'chatbot' | 'my-plants' | 'map' | 'general'
  category: 'error' | 'suggestion' | 'bug' | 'other'
  title: string
  description: string
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected'
  relatedId?: string
  relatedType?: string
  adminNotes?: string
  resolvedAt?: string
  resolvedBy?: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface Report {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    profileImage?: string
  }
  type: 'post' | 'comment'
  targetId: string
  targetType: 'post' | 'comment'
  reason: 'spam' | 'inappropriate' | 'harassment' | 'fake' | 'other'
  description?: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  adminNotes?: string
  resolvedAt?: string
  resolvedBy?: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Data Management Types
export interface Product {
  _id: string
  name: string
  activeIngredient: string
  manufacturer: string
  targetDiseases: string[]
  targetCrops: string[]
  dosage: string
  usage: string
  price?: string
  imageUrl?: string
  source: string
  verified: boolean
  frequency?: string
  isolationPeriod?: string
  precautions?: string[]
  createdAt: string
  updatedAt: string
}

export interface BiologicalMethod {
  _id: string
  name: string
  targetDiseases: string[]
  materials: string
  steps: string
  timeframe: string
  effectiveness: string
  source: string
  verified: boolean
  createdAt: string
  updatedAt: string
}

export interface CulturalPractice {
  _id: string
  category: 'soil' | 'water' | 'fertilizer' | 'light' | 'spacing'
  action: string
  description: string
  priority: 'High' | 'Medium' | 'Low'
  applicableTo: string[]
  source: string
  verified: boolean
  createdAt: string
  updatedAt: string
}

export interface DataStats {
  products: {
    total: number
    verified: number
    unverified: number
  }
  biologicalMethods: {
    total: number
    verified: number
    unverified: number
  }
  culturalPractices: {
    total: number
    verified: number
    unverified: number
  }
  total: number
}

// Admin Service
export const adminService = {
  // User Management
  async getUserStats(): Promise<UserStats> {
    const response = await api.get('/admin/stats/users')
    return response.data.data
  },

  async getUsersList(params?: {
    search?: string
    role?: string
    status?: string
    isVerified?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ users: User[]; pagination: Pagination }> {
    const response = await api.get('/admin/users', { params })
    return response.data.data
  },

  async blockUser(userId: string, reason?: string): Promise<User> {
    const response = await api.put(`/admin/users/${userId}/block`, { reason })
    return response.data.data
  },

  async unblockUser(userId: string): Promise<User> {
    const response = await api.put(`/admin/users/${userId}/unblock`)
    return response.data.data
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`)
  },

  async muteUser(userId: string, data: { reason?: string; duration?: number }): Promise<User> {
    const response = await api.post(`/admin/users/${userId}/mute`, data)
    return response.data.data
  },

  async unmuteUser(userId: string): Promise<User> {
    const response = await api.put(`/admin/users/${userId}/unmute`)
    return response.data.data
  },

  // Analysis Statistics
  async getAnalysisStats(): Promise<AnalysisStats> {
    const response = await api.get('/admin/stats/analysis')
    return response.data.data
  },

  // Community Statistics
  async getCommunityStats(): Promise<CommunityStats> {
    const response = await api.get('/admin/stats/community')
    return response.data.data
  },

  // Complaints Management
  async getComplaints(params?: {
    type?: string
    status?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ complaints: Complaint[]; pagination: Pagination }> {
    const response = await api.get('/admin/complaints', { params })
    return response.data.data
  },

  async getComplaintById(complaintId: string): Promise<Complaint> {
    const response = await api.get(`/complaints/${complaintId}`)
    return response.data.data
  },

  async updateComplaintStatus(
    complaintId: string,
    data: { status: string; adminNotes?: string }
  ): Promise<Complaint> {
    const response = await api.put(`/admin/complaints/${complaintId}/status`, data)
    return response.data.data
  },

  async getComplaintStats(): Promise<any> {
    const response = await api.get('/admin/complaints/stats')
    return response.data.data
  },

  // Reports Management
  async getReports(params?: {
    type?: string
    status?: string
    reason?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ reports: Report[]; pagination: Pagination }> {
    const response = await api.get('/admin/reports', { params })
    return response.data.data
  },

  async getReportById(reportId: string): Promise<Report> {
    const response = await api.get(`/reports/${reportId}`)
    return response.data.data
  },

  async updateReportStatus(
    reportId: string,
    data: { status: string; adminNotes?: string }
  ): Promise<Report> {
    const response = await api.put(`/admin/reports/${reportId}/status`, data)
    return response.data.data
  },

  async getReportStats(): Promise<any> {
    const response = await api.get('/admin/reports/stats')
    return response.data.data
  },

  // User-facing APIs
  async createComplaint(data: {
    type: 'analysis' | 'chatbot' | 'my-plants' | 'map' | 'general'
    category?: 'error' | 'suggestion' | 'bug' | 'other'
    title: string
    description: string
    relatedId?: string | null
    relatedType?: 'analysis' | 'post' | 'plant' | 'plantBox' | 'map' | null
    attachments?: Array<{ url: string; filename: string; mimeType: string }>
  }): Promise<Complaint> {
    const response = await api.post('/complaints', data)
    return response.data.data
  },

  async createReport(data: {
    type: 'post' | 'comment'
    targetId: string
    targetType: 'post' | 'comment'
    reason: 'spam' | 'inappropriate' | 'harassment' | 'fake' | 'other'
    description?: string
  }): Promise<Report> {
    const response = await api.post('/reports', data)
    return response.data.data
  },

  // Data Management - Products
  async getProducts(params?: {
    page?: number
    limit?: number
    search?: string
    verified?: string
  }): Promise<{ products: Product[]; pagination: Pagination }> {
    const response = await api.get('/admin/data/products', { params })
    return response.data.data
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await api.post('/admin/data/products', data)
    return response.data.data
  },

  async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
    const response = await api.put(`/admin/data/products/${productId}`, data)
    return response.data.data
  },

  async deleteProduct(productId: string): Promise<void> {
    await api.delete(`/admin/data/products/${productId}`)
  },

  // Data Management - Biological Methods
  async getBiologicalMethods(params?: {
    page?: number
    limit?: number
    search?: string
    verified?: string
  }): Promise<{ methods: BiologicalMethod[]; pagination: Pagination }> {
    const response = await api.get('/admin/data/biological-methods', { params })
    return response.data.data
  },

  async createBiologicalMethod(data: Partial<BiologicalMethod>): Promise<BiologicalMethod> {
    const response = await api.post('/admin/data/biological-methods', data)
    return response.data.data
  },

  async updateBiologicalMethod(
    methodId: string,
    data: Partial<BiologicalMethod>
  ): Promise<BiologicalMethod> {
    const response = await api.put(`/admin/data/biological-methods/${methodId}`, data)
    return response.data.data
  },

  async deleteBiologicalMethod(methodId: string): Promise<void> {
    await api.delete(`/admin/data/biological-methods/${methodId}`)
  },

  // Data Management - Cultural Practices
  async getCulturalPractices(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    verified?: string
  }): Promise<{ practices: CulturalPractice[]; pagination: Pagination }> {
    const response = await api.get('/admin/data/cultural-practices', { params })
    return response.data.data
  },

  async createCulturalPractice(data: Partial<CulturalPractice>): Promise<CulturalPractice> {
    const response = await api.post('/admin/data/cultural-practices', data)
    return response.data.data
  },

  async updateCulturalPractice(
    practiceId: string,
    data: Partial<CulturalPractice>
  ): Promise<CulturalPractice> {
    const response = await api.put(`/admin/data/cultural-practices/${practiceId}`, data)
    return response.data.data
  },

  async deleteCulturalPractice(practiceId: string): Promise<void> {
    await api.delete(`/admin/data/cultural-practices/${practiceId}`)
  },

  // Data Management - Statistics
  async getDataStats(): Promise<DataStats> {
    const response = await api.get('/admin/data/stats')
    return response.data.data
  },
}

