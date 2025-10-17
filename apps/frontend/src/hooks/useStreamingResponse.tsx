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
  simulateTyping?: boolean
}

export const useStreamingResponse = (options: StreamingOptions = {}) => {
  const {
    onComplete,
    onError,
    chunkDelay = 50,
    simulateTyping = true
  } = options

  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentText: '',
    isComplete: false,
    error: null
  })

  const streamRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const simulateStreaming = useCallback(async (fullText: string) => {
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

      if (simulateTyping) {
        // Simulate API response with realistic delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate mock response based on prompt
        const mockResponse = generateMockResponse(prompt)
        await simulateStreaming(mockResponse)
      } else {
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
  }, [simulateTyping, simulateStreaming, onComplete, onError])

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

  // Generate mock response based on prompt
  const generateMockResponse = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase()
    
    if (lowerPrompt.includes('bệnh') || lowerPrompt.includes('phân tích')) {
      return `Tôi đã phân tích hình ảnh của bạn và phát hiện một số dấu hiệu bất thường. Dựa trên các đặc điểm quan sát được, có khả năng cây trồng đang gặp vấn đề về sức khỏe. Tôi khuyến nghị bạn nên thực hiện các biện pháp chăm sóc phù hợp và theo dõi tình trạng cây thường xuyên.`
    }
    
    if (lowerPrompt.includes('chăm sóc') || lowerPrompt.includes('hướng dẫn')) {
      return `Để chăm sóc cây trồng hiệu quả, bạn cần chú ý đến các yếu tố sau: tưới nước đều đặn nhưng không quá nhiều, đảm bảo ánh sáng phù hợp, bón phân định kỳ, và kiểm tra sâu bệnh thường xuyên. Mỗi loại cây có nhu cầu chăm sóc khác nhau, vì vậy hãy tìm hiểu kỹ về loại cây bạn đang trồng.`
    }
    
    if (lowerPrompt.includes('thời tiết') || lowerPrompt.includes('weather')) {
      return `Thời tiết hiện tại khá thuận lợi cho cây trồng. Nhiệt độ và độ ẩm trong khoảng phù hợp. Tuy nhiên, bạn nên chú ý đến việc tưới nước và che chắn khi cần thiết. Theo dõi dự báo thời tiết để có kế hoạch chăm sóc cây phù hợp.`
    }
    
    if (lowerPrompt.includes('sản phẩm') || lowerPrompt.includes('khuyến nghị')) {
      return `Dựa trên tình trạng cây trồng của bạn, tôi khuyến nghị một số sản phẩm chăm sóc phù hợp: phân bón hữu cơ, thuốc trừ sâu sinh học, và các dụng cụ chăm sóc cây cơ bản. Những sản phẩm này sẽ giúp cây phát triển khỏe mạnh và tăng năng suất.`
    }
    
    return `Cảm ơn bạn đã chia sẻ thông tin. Tôi đã ghi nhận câu hỏi của bạn và sẽ cung cấp phản hồi chi tiết trong phần phân tích. Hãy để tôi xem xét kỹ hơn về tình trạng cây trồng của bạn.`
  }

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

    // Simulate streaming response
    const mockResponse = `Tôi đã nhận được câu hỏi của bạn về "${userMessage}". Hãy để tôi phân tích và cung cấp phản hồi chi tiết...`
    
    // Simulate typing effect
    const words = mockResponse.split(' ')
    let currentText = ''
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i]
      setCurrentStreamingText(currentText)
      await new Promise(resolve => setTimeout(resolve, 100))
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
