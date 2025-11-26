import axios from 'axios'
import { API_CONFIG } from '../config/api'

const API_BASE_URL = API_CONFIG.BASE_URL

/**
 * Search disease names for autocomplete
 * Supports fuzzy matching with and without diacritics
 * @param query - Search query
 * @returns Array of disease name suggestions
 */
export const searchDiseaseNames = async (query: string): Promise<string[]> => {
  try {
    // Allow empty query to get common diseases
    const searchQuery = query ? query.trim() : ''
    
    // Only make API call if query is empty or has at least 1 character
    // For empty query, backend will return common diseases
    const response = await axios.get(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.TREATMENTS.SEARCH_DISEASES}`, {
      params: { q: searchQuery },
      timeout: 5000,
    })

    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data
    }

    return []
  } catch (error: any) {
    // Silently fail - don't spam console with errors
    // Only log if it's not a network error or 404
    if (error?.response?.status !== 404 && error?.code !== 'ECONNABORTED') {
      console.error('Error searching disease names:', error?.response?.status || error?.message)
    }
    return []
  }
}

