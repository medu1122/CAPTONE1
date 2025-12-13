import { useState, useEffect, useCallback } from 'react'
import { chatHistoryService } from '../../../services/chatHistoryService'
import type { BackendSession, HistoryMessage } from '../../../services/chatHistoryService'
import { useAuth } from '../../../contexts/AuthContext'
import { createSession as createBackendSession } from '../services/chatService'

export interface Conversation {
  id: string
  sessionId: string
  title: string
  messages: HistoryMessage[]
  createdAt: string
  updatedAt: string
  snippet: string
}

export const useChatHistory = () => {
  const { isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(() => {
    // Restore activeId from localStorage on mount
    return localStorage.getItem('gg_knowledge_active_session') || null
  })
  const [loading, setLoading] = useState(false)

  // Load conversations from backend
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([])
      setActiveId(null)
      localStorage.removeItem('gg_knowledge_active_session')
      return
    }

    setLoading(true)
    try {
      const backendSessions = await chatHistoryService.loadSessions(50)
      
      // Load first message for each session to get snippet
      const convertedConversations: Conversation[] = await Promise.all(
        backendSessions.map(async (session) => {
          let firstMessage = session.firstMessage || ''
          let snippet = ''
          
          // If no firstMessage from backend, try to load it from messages
          if (!firstMessage && session.messagesCount > 0) {
            try {
              const messages = await chatHistoryService.loadHistory(session.sessionId, 1, 1)
              if (messages.length > 0 && messages[0].role === 'user') {
                firstMessage = messages[0].message || ''
              }
            } catch (error) {
              console.warn('Failed to load first message for session:', session.sessionId, error)
            }
          }
          
          snippet = firstMessage.substring(0, 100) || ''
          
          return {
            id: session.sessionId,
            sessionId: session.sessionId,
            title: session.title || firstMessage.substring(0, 50) || 'Chat cũ',
            messages: [],
            createdAt: session.lastMessageAt,
            updatedAt: session.lastMessageAt,
            snippet: snippet || (session.messagesCount > 0 ? 'Có tin nhắn' : 'Không có tin nhắn')
          }
        })
      )

      setConversations(convertedConversations)
      
      // Restore activeId from localStorage or select first conversation
      const savedActiveId = localStorage.getItem('gg_knowledge_active_session')
      if (savedActiveId && convertedConversations.find(c => c.id === savedActiveId)) {
        // Restore saved session if it exists
        setActiveId(savedActiveId)
      } else if (convertedConversations.length > 0 && !activeId) {
        // Auto-select first conversation if no activeId
        const firstId = convertedConversations[0].id
        setActiveId(firstId)
        localStorage.setItem('gg_knowledge_active_session', firstId)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, activeId])

  // Load messages for a specific session
  const loadMessages = useCallback(async (sessionId: string): Promise<HistoryMessage[]> => {
    try {
      const messages = await chatHistoryService.loadHistory(sessionId, 100, 1)
      return messages
    } catch (error) {
      console.error('Failed to load messages:', error)
      return []
    }
  }, [])

  // Create new conversation
  const createConversation = useCallback(async (): Promise<string> => {
    try {
      // Create session on backend
      const sessionId = await createBackendSession()
      
      const newConversation: Conversation = {
        id: sessionId,
        sessionId: sessionId,
        title: 'Cuộc chat mới',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        snippet: ''
      }
      
      setConversations((prev) => [newConversation, ...prev])
      setActiveId(sessionId)
      localStorage.setItem('gg_knowledge_active_session', sessionId)
      return sessionId
    } catch (error) {
      console.error('Failed to create session:', error)
      // Fallback to temporary ID
      const tempId = `temp_${Date.now()}`
      const newConversation: Conversation = {
        id: tempId,
        sessionId: tempId,
        title: 'Cuộc chat mới',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        snippet: ''
      }
      setConversations((prev) => [newConversation, ...prev])
      setActiveId(tempId)
      localStorage.setItem('gg_knowledge_active_session', tempId)
      return tempId
    }
  }, [])

  // Select conversation
  const selectConversation = useCallback((id: string) => {
    setActiveId(id)
    // Save to localStorage for persistence
    localStorage.setItem('gg_knowledge_active_session', id)
  }, [])

  // Rename conversation
  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      const conversation = conversations.find((c) => c.id === id)
      if (conversation?.sessionId && !conversation.sessionId.startsWith('temp_')) {
        // Update on backend
        await chatHistoryService.updateSessionTitle(conversation.sessionId, title)
      }
      // Update local state
      setConversations((prev) =>
        prev.map((conv) => (conv.id === id ? { ...conv, title } : conv))
      )
    } catch (error) {
      console.error('Failed to rename conversation:', error)
      // Still update local state even if backend fails
      setConversations((prev) =>
        prev.map((conv) => (conv.id === id ? { ...conv, title } : conv))
      )
    }
  }, [conversations])

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      const conversation = conversations.find((c) => c.id === id)
      if (conversation?.sessionId) {
        await chatHistoryService.clearHistory(conversation.sessionId)
      }
      setConversations((prev) => prev.filter((conv) => conv.id !== id))
      if (activeId === id) {
        setActiveId(null)
        localStorage.removeItem('gg_knowledge_active_session')
        // Auto-select first conversation if available
        const remaining = conversations.filter((conv) => conv.id !== id)
        if (remaining.length > 0) {
          const firstId = remaining[0].id
          setActiveId(firstId)
          localStorage.setItem('gg_knowledge_active_session', firstId)
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }, [conversations, activeId])

  // Clear all conversations
  const clearConversations = useCallback(async () => {
    try {
      for (const conv of conversations) {
        if (conv.sessionId) {
          await chatHistoryService.clearHistory(conv.sessionId)
        }
      }
      setConversations([])
      setActiveId(null)
    } catch (error) {
      console.error('Failed to clear conversations:', error)
    }
  }, [conversations])

  // Load conversations on mount and when auth changes
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const activeConversation = conversations.find((c) => c.id === activeId) || null

  return {
    conversations,
    activeId,
    activeConversation,
    loading,
    loadConversations,
    loadMessages,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    clearConversations,
  }
}

