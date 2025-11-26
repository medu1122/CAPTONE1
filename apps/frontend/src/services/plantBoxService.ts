import axios from 'axios'
import { API_CONFIG } from '../config/api'
import type { PlantBox, CreatePlantBoxData } from '../pages/MyPlantsPage/types/plantBox.types'
import { getAccessToken, getRefreshToken, refreshAccessToken, saveTokens, clearTokens } from './authService'

const API_BASE_URL = API_CONFIG.BASE_URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag to prevent multiple refresh calls
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (refreshToken) {
          const response = await refreshAccessToken(refreshToken)
          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          
          // Save new tokens
          saveTokens(accessToken, newRefreshToken)
          
          // Process queued requests
          processQueue(null, accessToken)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } else {
          // No refresh token, redirect to login
          processQueue(error, null)
          clearTokens()
          window.location.href = '/auth'
          return Promise.reject(error)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        processQueue(refreshError, null)
        clearTokens()
        window.location.href = '/auth'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export interface GetPlantBoxesParams {
  plantType?: 'existing' | 'planned' | null
  page?: number
  limit?: number
}

export interface GetPlantBoxesResponse {
  success: boolean
  message: string
  data: {
    plantBoxes: PlantBox[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface GetPlantBoxResponse {
  success: boolean
  message: string
  data: PlantBox
}

export interface CreatePlantBoxResponse {
  success: boolean
  message: string
  data: PlantBox
}

export interface UpdatePlantBoxResponse {
  success: boolean
  message: string
  data: PlantBox
}

export interface DeletePlantBoxResponse {
  success: boolean
  message: string
  data: {
    message: string
  }
}

export interface RefreshStrategyResponse {
  success: boolean
  message: string
  data: PlantBox
}

export interface ChatResponse {
  success: boolean
  message: string
  data: {
    response: string
  }
}

export interface AddNoteResponse {
  success: boolean
  message: string
  data: PlantBox
}

export interface AddImageResponse {
  success: boolean
  message: string
  data: PlantBox
}

/**
 * Get all plant boxes for current user
 */
export const getPlantBoxes = async (
  params?: GetPlantBoxesParams
): Promise<GetPlantBoxesResponse> => {
  const response = await api.get('/plant-boxes', { params })
  return response.data
}

/**
 * Get plant box by ID
 */
export const getPlantBox = async (id: string): Promise<GetPlantBoxResponse> => {
  const response = await api.get(`/plant-boxes/${id}`)
  return response.data
}

/**
 * Create new plant box
 */
export const createPlantBox = async (
  data: CreatePlantBoxData
): Promise<CreatePlantBoxResponse> => {
  const response = await api.post('/plant-boxes', data)
  return response.data
}

/**
 * Update plant box
 */
export const updatePlantBox = async (
  id: string,
  data: Partial<PlantBox>
): Promise<UpdatePlantBoxResponse> => {
  const response = await api.put(`/plant-boxes/${id}`, data)
  return response.data
}

/**
 * Delete plant box
 */
export const deletePlantBox = async (
  id: string
): Promise<DeletePlantBoxResponse> => {
  const response = await api.delete(`/plant-boxes/${id}`)
  return response.data
}

/**
 * Refresh care strategy for plant box
 */
export const refreshCareStrategy = async (
  id: string
): Promise<RefreshStrategyResponse> => {
  const response = await api.post(`/plant-boxes/${id}/refresh-strategy`)
  return response.data
}

/**
 * Chat with plant box (mini chat bot)
 */
export const chatWithPlantBox = async (
  id: string,
  message: string
): Promise<ChatResponse> => {
  const response = await api.post(`/plant-boxes/${id}/chat`, { message })
  return response.data
}

/**
 * Add note to plant box
 */
export const addNoteToPlantBox = async (
  id: string,
  content: string,
  type: 'care' | 'observation' | 'issue' | 'milestone' = 'observation'
): Promise<AddNoteResponse> => {
  const response = await api.post(`/plant-boxes/${id}/notes`, {
    content,
    type,
  })
  return response.data
}

/**
 * Add image to plant box
 */
export const addImageToPlantBox = async (
  id: string,
  url: string,
  description?: string
): Promise<AddImageResponse> => {
  const response = await api.post(`/plant-boxes/${id}/images`, {
    url,
    description,
  })
  return response.data
}

/**
 * Add feedback for a disease
 */
export interface AddDiseaseFeedbackRequest {
  diseaseIndex: number
  status: 'worse' | 'same' | 'better' | 'resolved'
  notes?: string
}

export interface AddDiseaseFeedbackResponse {
  success: boolean
  message: string
  data: PlantBox
}

export const addDiseaseFeedback = async (
  id: string,
  data: AddDiseaseFeedbackRequest
): Promise<AddDiseaseFeedbackResponse> => {
  const response = await api.post(`/plant-boxes/${id}/disease-feedback`, data)
  return response.data
}

