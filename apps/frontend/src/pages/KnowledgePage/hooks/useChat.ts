import { useState, useCallback } from 'react'
import type { Message } from '../types'
import { sendMessage } from '../services/chatService'

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      const userMessage: Message = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsTyping(true)
      setError(null)

      try {
        const aiResponse = await sendMessage(content)

        const aiMessage: Message = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, aiMessage])
      } catch (err: any) {
        console.error('Chat error:', err)
        setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
        // Remove user message if failed
        setMessages((prev) => prev.slice(0, -1))
      } finally {
        setIsTyping(false)
      }
    },
    [],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isTyping,
    error,
    send,
    clearMessages,
  }
}

