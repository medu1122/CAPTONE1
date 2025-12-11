import axios from 'axios'
import { API_CONFIG } from '../../../config/api'

const API_BASE_URL = API_CONFIG.BASE_URL

export interface ValidationResult {
  isValid: boolean
  isPlant: boolean | null
  confidence: number
  plantName?: string
  message: string
  warning?: boolean
}

/**
 * Validate image before analysis
 * @param imageUrl - Image URL to validate
 * @returns Validation result
 */
export const validateImage = async (imageUrl: string): Promise<ValidationResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/analyze/validate-image`, {
      imageUrl,
    })

    return response.data.data
  } catch (error: any) {
    console.error('Validation error:', error)
    // If validation fails, allow user to proceed but show warning
    return {
      isValid: true,
      isPlant: null,
      confidence: 0,
      message: 'Không thể kiểm tra hình ảnh. Bạn vẫn có thể thử phân tích.',
      warning: true,
    }
  }
}

