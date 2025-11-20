import axios from 'axios'
import type { LastAnalysis } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'

export const sendMessage = async (message: string): Promise<string> => {
  const response = await axios.post(`${API_BASE_URL}/chat/ask`, {
    message,
  })

  return response.data.data.answer
}

export const getContext = async (): Promise<LastAnalysis | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chat/context`)
    return response.data.data.lastAnalysis
  } catch (error: any) {
    // User might not be authenticated or no analysis yet
    if (error.response?.status === 401 || error.response?.status === 404) {
      return null
    }
    throw error
  }
}

