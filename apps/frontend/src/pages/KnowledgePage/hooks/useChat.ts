import { useState, useCallback, useEffect } from 'react'
import type { Message } from '../types'
import { sendMessage } from '../services/chatService'
import { chatHistoryService } from '../../../services/chatHistoryService'
import type { HistoryMessage } from '../../../services/chatHistoryService'
import { createSession } from '../services/chatService'

export const useChat = (sessionId: string | null = null) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load messages from history when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      return
    }

    // Skip loading history for temporary sessions
    if (sessionId.startsWith('temp_')) {
      setMessages([])
      return
    }

    const loadHistory = async () => {
      setLoadingHistory(true)
      try {
        const historyMessages = await chatHistoryService.loadHistory(sessionId, 100, 1)
        
        // Convert HistoryMessage to Message format
        const convertedMessages: Message[] = historyMessages.map((msg) => {
          // Ensure content is always a string
          let content = msg.message
          if (typeof content !== 'string') {
            if (typeof content === 'object' && content !== null) {
              // If it's an object, try to extract string or stringify
              content = JSON.stringify(content)
            } else {
              content = String(content || '')
            }
          }
          
          return {
            role: msg.role,
            content: content,
            timestamp: msg.createdAt,
          }
        })

        setMessages(convertedMessages)
      } catch (err) {
        console.error('Failed to load chat history:', err)
        setMessages([]) // Clear messages on error
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()
  }, [sessionId])

  const send = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      // Ensure we have a sessionId
      const currentSessionId = sessionId
      if (!currentSessionId) {
        console.warn('⚠️ [useChat] No sessionId provided, chat history will not be loaded')
      }

      const userMessage: Message = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsTyping(true)
      setError(null)

      try {
        // Always pass sessionId, even if null (backend will handle it)
        const aiResponse = await sendMessage(content.trim(), currentSessionId)

        const aiMessage: Message = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, aiMessage])
        
        // Reload messages from history to ensure sync
        if (sessionId && !sessionId.startsWith('temp_')) {
          try {
            const historyMessages = await chatHistoryService.loadHistory(sessionId, 100, 1)
            const convertedMessages: Message[] = historyMessages.map((msg) => {
              let content = msg.message
              if (typeof content !== 'string') {
                content = typeof content === 'object' && content !== null
                  ? JSON.stringify(content)
                  : String(content || '')
              }
              return {
                role: msg.role,
                content: content,
                timestamp: msg.createdAt,
              }
            })
            setMessages(convertedMessages)
          } catch (err) {
            console.warn('Failed to reload history after send:', err)
            // Keep current messages if reload fails
          }
        }
      } catch (err: any) {
        console.error('Chat error:', err)
        setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
        // Remove user message if failed
        setMessages((prev) => prev.slice(0, -1))
      } finally {
        setIsTyping(false)
      }
    },
    [sessionId],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  // Send with explicit sessionId (override prop if needed)
  const sendWithSession = useCallback(
    async (content: string, explicitSessionId?: string | null) => {
      const currentSessionId = explicitSessionId || sessionId
      if (!content.trim()) return

      if (!currentSessionId) {
        console.warn('⚠️ [useChat] No sessionId provided, chat history will not be loaded')
      }

      const userMessage: Message = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsTyping(true)
      setError(null)

      try {
        // Always pass sessionId, even if null (backend will handle it)
        const aiResponse = await sendMessage(content.trim(), currentSessionId)

        const aiMessage: Message = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, aiMessage])
        
        // Reload messages from history to ensure sync
        if (currentSessionId && !currentSessionId.startsWith('temp_')) {
          try {
            const historyMessages = await chatHistoryService.loadHistory(currentSessionId, 100, 1)
            const convertedMessages: Message[] = historyMessages.map((msg) => {
              let content = msg.message
              if (typeof content !== 'string') {
                content = typeof content === 'object' && content !== null
                  ? JSON.stringify(content)
                  : String(content || '')
              }
              return {
                role: msg.role,
                content: content,
                timestamp: msg.createdAt,
              }
            })
            setMessages(convertedMessages)
          } catch (err) {
            console.warn('Failed to reload history after send:', err)
            // Keep current messages if reload fails
          }
        }
      } catch (err: any) {
        console.error('Chat error:', err)
        setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
        // Remove user message if failed
        setMessages((prev) => prev.slice(0, -1))
      } finally {
        setIsTyping(false)
      }
    },
    [sessionId],
  )

  return {
    messages,
    isTyping,
    error,
    loadingHistory,
    send,
    sendWithSession, // New function that accepts explicit sessionId
    clearMessages,
  }
}

