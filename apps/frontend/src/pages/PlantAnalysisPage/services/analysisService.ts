import axios from 'axios'
import type { AnalysisResult } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)

  const response = await axios.post(`${API_BASE_URL}/image-upload/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  const imageUrl = response.data.data.url
  console.log('📤 [uploadImage] Cloudinary URL:', imageUrl)
  return imageUrl
}

export const analyzeImage = async (imageUrl: string): Promise<AnalysisResult> => {
  console.log('🔬 [analyzeImage] Sending to backend:', imageUrl)
  
  const response = await axios.post(`${API_BASE_URL}/analyze/image`, {
    imageUrl,
  })

  console.log('✅ [analyzeImage] Backend response:', response.data.data)
  return response.data.data
}

export const getAnalysisHistory = async (limit: number = 10): Promise<any[]> => {
  const response = await axios.get(`${API_BASE_URL}/analyze/history`, {
    params: { limit },
  })

  return response.data.data
}

export const getAnalysisById = async (id: string): Promise<any> => {
  const response = await axios.get(`${API_BASE_URL}/analyze/${id}`)

  return response.data.data
}

