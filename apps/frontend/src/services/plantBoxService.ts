import axios from 'axios'
import { API_CONFIG } from '../config/api'
import type { PlantBox, CreatePlantBoxData } from '../pages/MyPlantsPage/types/plantBox.types'
import { getAccessToken, getRefreshToken, refreshAccessToken, saveTokens, clearTokens } from './authService'

const API_BASE_URL = API_CONFIG.BASE_URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout to 60s for long-running operations like task analysis
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

export interface ProgressReportResponse {
  success: boolean
  message: string
  data: {
    plantName: string
    hasStrategy: boolean
    message?: string
    statistics?: {
      totalTasks: number
      completedTasks: number
      completionRate: number
      daysTracked: number
    }
    health?: {
      status: 'excellent' | 'good' | 'fair' | 'poor'
      icon: string
      color: string
      message: string
    }
    issues?: {
      count: number
      hasIssues: boolean
      message: string
    }
    recommendations?: Array<{
      icon: string
      type: 'urgent' | 'health' | 'praise' | 'weather'
      message: string
    }>
    summary?: string
  }
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
 * Get AI progress report for plant box
 */
export const getProgressReport = async (
  id: string
): Promise<ProgressReportResponse> => {
  const response = await api.get(`/plant-boxes/${id}/progress-report`)
  return response.data
}

/**
 * Chat with plant box (mini chat bot)
 */
export const chatWithPlantBox = async (
  id: string,
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ChatResponse> => {
  const response = await api.post(`/plant-boxes/${id}/chat`, { 
    message,
    conversationHistory: conversationHistory || [],
  })
  return response.data
}

/**
 * Add a new disease to plant box
 */
export const addDisease = async (
  id: string,
  data: { name: string; symptoms?: string; severity?: 'mild' | 'moderate' | 'severe' }
): Promise<{ success: boolean; message: string; data: any }> => {
  const response = await api.post(`/plant-boxes/${id}/diseases`, data)
  return response.data
}

/**
 * Delete a disease from plant box
 */
export const deleteDisease = async (
  id: string,
  diseaseIndex: number
): Promise<{ success: boolean; message: string; data: any }> => {
  const response = await api.delete(`/plant-boxes/${id}/diseases`, {
    data: { diseaseIndex },
  })
  return response.data
}

/**
 * Update selected treatments for a disease
 */
export const updateDiseaseTreatments = async (
  id: string,
  diseaseIndex: number,
  treatments: {
    chemical?: any[]
    biological?: any[]
    cultural?: any[]
  }
): Promise<{ success: boolean; message: string; data: any }> => {
  const response = await api.put(`/plant-boxes/${id}/diseases/${diseaseIndex}/treatments`, {
    treatments,
  })
  return response.data
}

/**
 * Analyze a specific task action
 */
export const analyzeTask = async (
  id: string,
  dayIndex: number,
  actionIndex: number
): Promise<{
  success: boolean
  message: string
  data: {
    analyzedAt: string
    detailedSteps: string[]
    materials: string[]
    precautions: string[]
    tips: string
    estimatedDuration: string
    dosageCalculation?: {
      baseDosage: string
      totalQuantity: string
      totalWater: string
      soilAdjustment: string
      finalDosage: string
      purchaseAmount: string
    }
  }
}> => {
  console.log('📤 [analyzeTask] Sending request:', { id, dayIndex, actionIndex, dayIndexType: typeof dayIndex, actionIndexType: typeof actionIndex })
  
  // Ensure dayIndex and actionIndex are numbers
  const payload = {
    dayIndex: Number(dayIndex),
    actionIndex: Number(actionIndex),
  }
  
  console.log('📤 [analyzeTask] Payload:', payload)
  
  const response = await api.post(`/plant-boxes/${id}/analyze-task`, payload)
  return response.data
}

/**
 * Toggle action completed status
 */
export const toggleActionCompleted = async (
  id: string,
  dayIndex: number,
  actionId: string,
  completed: boolean
): Promise<{ success: boolean; message: string; data: any }> => {
  const response = await api.put(`/plant-boxes/${id}/actions/toggle`, {
    dayIndex,
    actionId,
    completed,
  })
  return response.data
}

/**
 * Add note to plant box
 */
export const addNoteToPlantBox = async (
  id: string,
  content: string,
  type: 'care' | 'observation' | 'issue' | 'milestone' = 'observation',
  imageUrl?: string
): Promise<AddNoteResponse> => {
  const response = await api.post(`/plant-boxes/${id}/notes`, {
    content,
    type,
    imageUrl,
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

