import { useState, useCallback } from 'react'
import type { Message, AnalysisResult } from '../types/analyze.types'
// Note: This hook is deprecated. Use ChatAnalyzeContext instead.
// Keeping for backward compatibility but should be removed.
type SyncFunction = (messages: Message[], result: AnalysisResult | null) => void
export const useChat = (externalSyncFn?: SyncFunction) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncFn, setSyncFn] = useState<SyncFunction | undefined>(externalSyncFn)
  const setExternalState = useCallback((fn: SyncFunction) => {
    setSyncFn(() => fn)
  }, [])
  const updateState = useCallback(
    (newMessages: Message[], newResult: AnalysisResult | null) => {
      setMessages(newMessages)
      setResult(newResult)
      if (syncFn) {
        syncFn(newMessages, newResult)
      }
    },
    [syncFn],
  )
  const send = useCallback(
    async (input: string | File) => {
      let newMessage: Message
      if (typeof input === 'string') {
        newMessage = { role: 'user', type: 'text', content: input }
      } else {
        const imageUrl = URL.createObjectURL(input)
        newMessage = { role: 'user', type: 'image', content: imageUrl }
      }
      const newMessages = [...messages, newMessage]
      updateState(newMessages, result)
      setLoading(true)
      try {
        // This hook is deprecated. Use ChatAnalyzeContext instead.
        // For now, throw error to force migration
        throw new Error('useChat hook is deprecated. Please use ChatAnalyzeContext instead.')
        // Create bot response based on analysis
        let botResponse: Message
        if (analysisResult.disease && analysisResult.confidence > 0.5) {
          const confidencePercent = Math.round(analysisResult.confidence * 100)
          botResponse = {
            role: 'assistant',
            type: 'text',
            content: `Có dấu hiệu ${analysisResult.disease.name} (${confidencePercent}% tin cậy). Tôi đã cung cấp thêm thông tin chi tiết và hướng dẫn chăm sóc trong phần phân tích.`,
          }
        } else {
          botResponse = {
            role: 'assistant',
            type: 'text',
            content: `Không phát hiện bệnh rõ ràng trên cây ${analysisResult.plant.commonName}. Tôi đã cung cấp thông tin và hướng dẫn chăm sóc trong phần phân tích.`,
          }
        }
        const finalMessages = [...newMessages, botResponse]
        updateState(finalMessages, analysisResult)
      } catch {
        const errorMessage: Message = {
          role: 'assistant',
          type: 'text',
          content:
            'Xin lỗi, đã xảy ra lỗi khi phân tích. Vui lòng thử lại sau.',
        }
        const errorMessages = [...newMessages, errorMessage]
        updateState(errorMessages, result)
      } finally {
        setLoading(false)
      }
    },
    [messages, result, updateState],
  )
  const resetChat = useCallback(
    (
      initMessages: Message[] = [],
      initResult: AnalysisResult | null = null,
    ) => {
      updateState(initMessages, initResult)
    },
    [updateState],
  )
  return {
    messages,
    result,
    loading,
    send,
    resetChat,
    setExternalState,
  }
}
