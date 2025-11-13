import { useState, useCallback, useRef } from 'react'
import type { Message } from '../pages/ChatAnalyzePage/types/analyze.types'

interface StreamingState {
  isStreaming: boolean
  currentText: string
  isComplete: boolean
  error: string | null
}

interface StreamingOptions {
  onComplete?: (finalText: string) => void
  onError?: (error: string) => void
  chunkDelay?: number
  // simulateTyping removed - always use real API
}

export const useStreamingResponse = (options: StreamingOptions = {}) => {
  const {
    onComplete,
    onError,
    chunkDelay = 50,
    // simulateTyping removed
  } = options

  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentText: '',
    isComplete: false,
    error: null
  })

  const streamRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // simulateStreaming removed - always use real API
  const _unused_simulateStreaming = useCallback(async (fullText: string) => {
    setState({
      isStreaming: true,
      currentText: '',
      isComplete: false,
      error: null
    })

    const words = fullText.split(' ')
    let currentIndex = 0

    const streamNext = () => {
      if (currentIndex < words.length) {
        const nextWord = words[currentIndex]
        setState(prev => ({
          ...prev,
          currentText: prev.currentText + (currentIndex > 0 ? ' ' : '') + nextWord
        }))
        currentIndex++
        
        streamRef.current = setTimeout(streamNext, chunkDelay)
      } else {
        setState(prev => ({
          ...prev,
          isStreaming: false,
          isComplete: true
        }))
        onComplete?.(fullText)
      }
    }

    streamNext()
  }, [chunkDelay, onComplete])

  const startStreaming = useCallback(async (prompt: string) => {
    try {
      setState({
        isStreaming: true,
        currentText: '',
        isComplete: false,
        error: null
      })

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      // Always use real API - removed mock/simulateTyping
      // Real API streaming implementation
      const response = await fetch('/api/v1/chat-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setState(prev => ({
                ...prev,
                isStreaming: false,
                isComplete: true
              }))
              onComplete?.(fullText)
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullText += parsed.content
                setState(prev => ({
                  ...prev,
                  currentText: fullText
                }))
              }
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState({
        isStreaming: false,
        currentText: '',
        isComplete: false,
        error: errorMessage
      })
      onError?.(errorMessage)
    }
  }, [onComplete, onError])

  const stopStreaming = useCallback(() => {
    if (streamRef.current) {
      clearTimeout(streamRef.current)
      streamRef.current = null
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setState(prev => ({
      ...prev,
      isStreaming: false
    }))
  }, [])

  const reset = useCallback(() => {
    stopStreaming()
    setState({
      isStreaming: false,
      currentText: '',
      isComplete: false,
      error: null
    })
  }, [stopStreaming])

  // Mock response generation removed - always use real API

  return {
    ...state,
    startStreaming,
    stopStreaming,
    reset
  }
}

// Streaming message component
export const StreamingMessage: React.FC<{
  text: string
  isStreaming: boolean
  className?: string
}> = ({ text, isStreaming, className = '' }) => {
  return (
    <div className={`max-w-[80%] rounded-2xl p-4 bg-gray-100 text-gray-800 ${className}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="whitespace-pre-wrap">{text}</p>
          {isStreaming && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-gray-500 ml-2">Đang gõ...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook for managing streaming chat
export const useStreamingChat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStreamingText, setCurrentStreamingText] = useState('')

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const startStreamingResponse = useCallback(async (userMessage: string) => {
    // Add user message
    const userMsg: Message = {
      role: 'user',
      type: 'text',
      content: userMessage
    }
    addMessage(userMsg)

    // Start streaming
    setIsStreaming(true)
    setCurrentStreamingText('')

    // Use real API instead of mock response
    // TODO: Replace with actual streaming API call
    try {
      const response = await fetch('/api/v1/chat-analyze/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setIsStreaming(false)
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullText += parsed.content
                setCurrentStreamingText(fullText)
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      setIsStreaming(false)
      // Show error message to user
      setCurrentStreamingText(`Lỗi: ${error instanceof Error ? error.message : 'Không thể kết nối với server'}`)
    }

    // Add final response
    const assistantMsg: Message = {
      role: 'assistant',
      type: 'text',
      content: currentText
    }
    addMessage(assistantMsg)

    setIsStreaming(false)
    setCurrentStreamingText('')
  }, [addMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
    setIsStreaming(false)
    setCurrentStreamingText('')
  }, [])

  return {
    messages,
    isStreaming,
    currentStreamingText,
    startStreamingResponse,
    clearMessages
  }
}
