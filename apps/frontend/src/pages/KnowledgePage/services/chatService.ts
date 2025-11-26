import axios from 'axios'
import { API_CONFIG } from '../../../config/api'
import type { LastAnalysis } from '../types'

const API_BASE_URL = API_CONFIG.BASE_URL

// Get auth token
const getAuthToken = (): string | null => {
  return (window as any).accessToken || null
}

// Create or get session
export const createSession = async (): Promise<string> => {
  try {
    const token = getAuthToken()
    if (!token) {
      // Not authenticated, return temporary session ID
      return `temp_${Date.now()}`
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }

    const response = await axios.post(
      `${API_BASE_URL}/chat/sessions/start`,
      {},
      { headers }
    )

    // Check response format
    if (response.data?.data?.sessionId) {
      return response.data.data.sessionId
    }
    
    // Fallback if format is different
    if (response.data?.sessionId) {
      return response.data.sessionId
    }

    throw new Error('Invalid response format')
  } catch (error: any) {
    console.error('Failed to create session:', error)
    // If not authenticated or error, return a temporary session ID
    return `temp_${Date.now()}`
  }
}

// Save message to session
export const saveMessage = async (
  sessionId: string,
  role: 'user' | 'assistant',
  message: string
): Promise<void> => {
  try {
    // Skip saving for temporary sessions
    if (sessionId.startsWith('temp_')) {
      return
    }

    const token = getAuthToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    await axios.post(
      `${API_BASE_URL}/chat/messages`,
      {
        sessionId,
        role,
        message,
      },
      { headers }
    )
  } catch (error: any) {
    console.error('Failed to save message:', error)
    // Don't throw, just log - allow chat to continue even if save fails
  }
}

export const sendMessage = async (
  message: string,
  sessionId?: string | null
): Promise<string> => {
  // Log for debugging
  console.log('📤 [chatService] Sending message:', {
    messagePreview: message.substring(0, 50),
    sessionId: sessionId || 'null',
    hasSessionId: !!sessionId
  })

  // Get AI response with sessionId for context
  const response = await axios.post(`${API_BASE_URL}/chat/ask`, {
    message,
    sessionId: sessionId || null, // Pass sessionId for chat history context
  })

  // Extract answer string from response
  let aiResponse: string
  if (typeof response.data.data.answer === 'string') {
    aiResponse = response.data.data.answer
  } else if (response.data.data.answer?.data?.message) {
    // Handle nested response format
    aiResponse = response.data.data.answer.data.message
  } else if (response.data.data.answer?.message) {
    aiResponse = response.data.data.answer.message
  } else {
    // Fallback: try to stringify or use default
    console.warn('Unexpected response format:', response.data)
    aiResponse = typeof response.data.data.answer === 'object' 
      ? JSON.stringify(response.data.data.answer)
      : String(response.data.data.answer || 'Xin lỗi, tôi không thể trả lời.')
  }

  // Save to session if sessionId is provided
  if (sessionId && typeof aiResponse === 'string') {
    // Save user message
    await saveMessage(sessionId, 'user', message)
    // Save AI response
    await saveMessage(sessionId, 'assistant', aiResponse)
  }

  return aiResponse
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

