import { useState, useCallback } from 'react'
import axios from 'axios'
import { API_CONFIG } from '../../../config/api'

const API_BASE_URL = API_CONFIG.BASE_URL

export const useDiseaseExplanation = () => {
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const getExplanation = useCallback(async (diseaseName: string, plantName?: string) => {
    // Return cached explanation if exists
    if (explanations[diseaseName]) {
      console.log('📋 [useDiseaseExplanation] Using cached explanation for:', diseaseName)
      return explanations[diseaseName]
    }

    console.log('🔍 [useDiseaseExplanation] Fetching explanation for:', diseaseName, 'Plant:', plantName)
    
    // Set loading state
    setLoading((prev) => ({ ...prev, [diseaseName]: true }))

    try {
      const url = `${API_BASE_URL}/analyze/disease-explanation`
      console.log('🌐 [useDiseaseExplanation] API URL:', url)
      
      const response = await axios.get(url, {
        params: {
          diseaseName,
          plantName,
        },
      })

      console.log('✅ [useDiseaseExplanation] Response:', response.data)

      const explanation = response.data?.data?.explanation || response.data?.explanation

      if (!explanation) {
        throw new Error('No explanation in response')
      }

      // Cache explanation
      setExplanations((prev) => ({
        ...prev,
        [diseaseName]: explanation,
      }))

      console.log('💾 [useDiseaseExplanation] Cached explanation for:', diseaseName)
      return explanation
    } catch (error: any) {
      console.error('❌ [useDiseaseExplanation] Error fetching disease explanation:', error)
      console.error('   URL:', `${API_BASE_URL}/analyze/disease-explanation`)
      console.error('   Params:', { diseaseName, plantName })
      console.error('   Response:', error.response?.data)
      return 'Không thể tải giải thích về bệnh này.'
    } finally {
      setLoading((prev) => ({ ...prev, [diseaseName]: false }))
    }
  }, [explanations])

  return {
    getExplanation,
    explanations,
    loading,
  }
}

