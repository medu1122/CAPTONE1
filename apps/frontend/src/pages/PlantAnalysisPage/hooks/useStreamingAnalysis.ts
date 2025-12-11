import { useState, useCallback, useRef, useEffect } from 'react'
import { API_CONFIG } from '../../../config/api'
import { getAccessToken } from '../../../services/authService'
import type { AnalysisResult, PlantInfo, Disease } from '../types'

const API_BASE_URL = API_CONFIG.BASE_URL

export interface StreamingState {
  status: 'idle' | 'validating' | 'uploading' | 'analyzing' | 'complete' | 'error'
  progress: number // 0-100
  currentStep: string
  plant: PlantInfo | null
  diseases: Disease[]
  treatments: Record<string, any>
  care: any
  error: string | null
  result: AnalysisResult | null
}

const INITIAL_STATE: StreamingState = {
  status: 'idle',
  progress: 0,
  currentStep: '',
  plant: null,
  diseases: [],
  treatments: {},
  care: null,
  error: null,
  result: null,
}

export const useStreamingAnalysis = () => {
  const [state, setState] = useState<StreamingState>(INITIAL_STATE)
  const eventSourceRef = useRef<EventSource | null>(null)

  const reset = useCallback(() => {
    setState(INITIAL_STATE)
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  const analyze = useCallback(async (imageUrl: string): Promise<AnalysisResult> => {
    return new Promise((resolve, reject) => {
      reset()

      const token = getAccessToken()
      const url = `${API_BASE_URL}/analyze/image-stream`

      // Track progress steps
      const progressMap: Record<string, number> = {
        validation: 5,
        upload: 10,
        plant_id: 20,
        plant_identified: 30,
        disease_check: 40,
        disease_found: 50,
        treatments: 60,
        treatments_chemical: 70,
        treatments_biological: 75,
        treatments_cultural: 80,
        ai_advice: 85,
        care: 90,
        saving: 95,
        complete: 100,
      }

      let currentProgress = 0
      const treatmentsByDisease: Record<string, any[]> = {}
      const diseases: Disease[] = []
      let plant: PlantInfo | null = null
      let care: any = null
      let currentEvent = ''

      // Use fetch with POST and read SSE stream
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ imageUrl }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const reader = response.body?.getReader()
          const decoder = new TextDecoder()

          if (!reader) {
            throw new Error('No response body')
          }

          let buffer = ''

          const processStream = (): Promise<void> => {
            return reader.read().then(({ done, value }) => {
              if (done) {
                if (state.status !== 'complete' && state.status !== 'error') {
                  setState((prev) => ({
                    ...prev,
                    status: 'error',
                    error: 'Stream ended unexpectedly',
                  }))
                  reject(new Error('Stream ended unexpectedly'))
                }
                return Promise.resolve()
              }

              buffer += decoder.decode(value, { stream: true })
              const chunks = buffer.split('\n\n')
              buffer = chunks.pop() || ''

              let shouldStop = false

              for (const chunk of chunks) {
                if (!chunk.trim()) continue

                let event = ''
                let dataStr = ''

                const lines = chunk.split('\n')
                for (const line of lines) {
                  if (line.startsWith('event: ')) {
                    event = line.substring(7).trim()
                  } else if (line.startsWith('data: ')) {
                    dataStr = line.substring(6).trim()
                  }
                }

                if (!dataStr) continue

                if (dataStr === '[DONE]') {
                  shouldStop = true
                  break
                }

                try {
                  const data = JSON.parse(dataStr)
                  currentEvent = event || currentEvent

                  // Update progress based on event
                  const eventProgress = progressMap[currentEvent] || progressMap[data.type] || currentProgress
                  if (eventProgress > currentProgress) {
                    currentProgress = eventProgress
                  }

                  // Handle different event types
                  if (currentEvent === 'connected' || (data.type === 'input' && currentEvent === 'validation')) {
                    setState((prev) => ({
                      ...prev,
                      status: 'validating',
                      progress: currentProgress,
                      currentStep: data.message || 'Đang kiểm tra hình ảnh...',
                    }))
                  } else if (currentEvent === 'plant_id' || data.type === 'calling' || data.type === 'processing') {
                    setState((prev) => ({
                      ...prev,
                      status: 'analyzing',
                      progress: currentProgress,
                      currentStep: data.message || 'Đang nhận diện cây...',
                    }))
                  } else if (currentEvent === 'plant_identified' || data.type === 'identified') {
                    plant = data.plant
                    setState((prev) => ({
                      ...prev,
                      plant: data.plant,
                      progress: currentProgress,
                      currentStep: data.message || `Đã nhận diện: ${data.plant?.commonName || 'Cây trồng'}`,
                    }))
                  } else if (currentEvent === 'disease_found' || data.type === 'disease') {
                    if (data.disease) {
                      diseases.push(data.disease)
                      setState((prev) => ({
                        ...prev,
                        diseases: [...diseases],
                        progress: currentProgress,
                        currentStep: data.message || `Đã phát hiện: ${data.disease.name}`,
                      }))
                    } else {
                      setState((prev) => ({
                        ...prev,
                        progress: currentProgress,
                        currentStep: data.message || 'Đang kiểm tra bệnh...',
                      }))
                    }
                  } else if (
                    currentEvent === 'treatments_chemical' ||
                    currentEvent === 'treatments_biological' ||
                    currentEvent === 'treatments_cultural'
                  ) {
                    const diseaseName = data.disease
                    if (diseaseName && data.treatments) {
                      if (!treatmentsByDisease[diseaseName]) {
                        treatmentsByDisease[diseaseName] = []
                      }
                      treatmentsByDisease[diseaseName].push({
                        type: currentEvent.replace('treatments_', ''),
                        title:
                          currentEvent === 'treatments_chemical'
                            ? 'Thuốc Hóa học'
                            : currentEvent === 'treatments_biological'
                            ? 'Phương Pháp Sinh học'
                            : 'Biện Pháp Canh tác',
                        items: data.treatments,
                      })
                      setState((prev) => ({
                        ...prev,
                        treatments: { ...treatmentsByDisease },
                        progress: currentProgress,
                        currentStep: data.message || 'Đang tìm phương pháp điều trị...',
                      }))
                    }
                  } else if (currentEvent === 'care' || data.type === 'care') {
                    if (data.care) {
                      care = data.care
                    }
                    setState((prev) => ({
                      ...prev,
                      care: data.care || prev.care,
                      progress: currentProgress,
                      currentStep: data.message || 'Đang lấy thông tin chăm sóc...',
                    }))
                  } else if (currentEvent === 'complete' || data.status === 'complete') {
                    const result: AnalysisResult = {
                      ...data.result,
                      plant: data.result?.plant || plant,
                      diseases: data.result?.diseases || diseases,
                      treatments: data.result?.treatments || treatmentsByDisease,
                      care: data.result?.care || care,
                      analyzedAt: new Date().toISOString(),
                      imageUrl,
                    }

                    setState((prev) => ({
                      ...prev,
                      status: 'complete',
                      progress: 100,
                      currentStep: 'Hoàn tất!',
                      result,
                    }))

                    // Save to localStorage via callback (will be handled by useImageAnalysis)
                    resolve(result)
                    shouldStop = true
                    break
                  } else if (currentEvent === 'error' || data.error) {
                    setState((prev) => ({
                      ...prev,
                      status: 'error',
                      error: data.error || 'Có lỗi xảy ra',
                    }))
                    reject(new Error(data.error || 'Analysis failed'))
                    shouldStop = true
                    break
                  } else {
                    // Generic progress update
                    setState((prev) => ({
                      ...prev,
                      progress: currentProgress,
                      currentStep: data.message || prev.currentStep,
                    }))
                  }
                } catch (error) {
                  console.error('Error parsing SSE data:', error, 'Data:', dataStr)
                }
              }

              if (shouldStop) {
                return Promise.resolve()
              }

              return processStream()
            })
          }

          return processStream()
        })
        .catch((error) => {
          console.error('Stream error:', error)
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: error.message || 'Stream failed',
          }))
          reject(error)
        })
    })
  }, [reset])

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return {
    state,
    analyze,
    reset,
  }
}

