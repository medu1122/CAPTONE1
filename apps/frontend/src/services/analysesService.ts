import axios from 'axios'
import { API_CONFIG } from '../config/api'
import { getAccessToken } from './authService'

const API_BASE_URL = API_CONFIG.BASE_URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      // Token expired, redirect to login
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export interface Plant {
  id: string
  name: string
  scientificName: string
  imageUrl: string
  status: 'healthy' | 'disease' | 'warning'
  confidence: number
  disease?: {
    name: string
    description: string
  }
  analyzedAt: string
  createdAt: string
  notes?: string
}

export interface GetMyPlantsParams {
  page?: number
  limit?: number
  status?: 'all' | 'healthy' | 'disease' | 'warning'
  search?: string
  sortBy?: 'newest' | 'oldest' | 'nameAsc' | 'nameDesc'
}

export interface GetMyPlantsResponse {
  success: boolean
  message: string
  data: {
    plants: Plant[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export interface AnalysisDetail {
  _id: string
  user: string
  source: 'plantid' | 'manual' | 'ai'
  inputImages: Array<{
    url?: string
    base64?: string
    metadata?: Record<string, any>
  }>
  resultTop: {
    plant: {
      commonName: string
      scientificName: string
    }
    confidence: number
    summary: string
  } | null
  raw: any
  createdAt: string
  updatedAt: string
}

export interface GetAnalysisResponse {
  success: boolean
  message: string
  data: AnalysisDetail
}

/**
 * Analyses Service
 * Handles API calls for plant analyses (My Plants)
 */
export const analysesService = {
  /**
   * Get all analyses for current user (My Plants)
   */
  getMyPlants: async (params: GetMyPlantsParams = {}): Promise<GetMyPlantsResponse> => {
    try {
      const response = await api.get('/analyses/my-plants', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          status: params.status || 'all',
          search: params.search || '',
          sortBy: params.sortBy || 'newest',
        },
      })

      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to fetch plants'
      )
    }
  },

  /**
   * Get analysis by ID
   */
  getAnalysisById: async (id: string): Promise<GetAnalysisResponse> => {
    try {
      const response = await api.get(`/analyses/${id}`)
      return response.data
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to fetch analysis'
      )
    }
  },

  /**
   * Delete analysis by ID
   */
  deleteAnalysis: async (id: string): Promise<void> => {
    try {
      await api.delete(`/analyses/${id}`)
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to delete analysis'
      )
    }
  },
}

export default analysesService

