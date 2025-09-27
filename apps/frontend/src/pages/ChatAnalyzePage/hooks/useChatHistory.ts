import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Conversation, Message, AnalysisResult } from '../types/analyze.types'
import { storage } from '../lib/storage'
export const useChatHistory = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  // Load conversations from localStorage on mount
  useEffect(() => {
    const storedConversations = storage.getConversations()
    setConversations(storedConversations)
    // If there are conversations, set the most recent one as active
    if (storedConversations.length > 0) {
      setActiveId(storedConversations[0].id)
    } else {
      // If no conversations, create a new one
      const id = uuidv4()
      const newConversation: Conversation = {
        id,
        title: 'Cuộc chat mới',
        messages: [],
        result: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        snippet: '',
      }
      const updatedConversations = [newConversation, ...storedConversations]
      storage.setConversations(updatedConversations)
      setConversations(updatedConversations)
      setActiveId(id)
    }
  }, [])
  const saveConversations = useCallback(
    (updatedConversations: Conversation[]) => {
      storage.setConversations(updatedConversations)
      setConversations(updatedConversations)
    },
    [],
  )
  const createConversation = useCallback(() => {
    const id = uuidv4()
    const newConversation: Conversation = {
      id,
      title: 'Cuộc chat mới',
      messages: [],
      result: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      snippet: '',
    }
    const updatedConversations = [newConversation, ...conversations]
    saveConversations(updatedConversations)
    setActiveId(id)
    return id
  }, [conversations, saveConversations])
  const updateConversation = useCallback(
    (id: string, messages: Message[], result?: AnalysisResult | null) => {
      const updatedConversations = conversations.map((conversation) => {
        if (conversation.id === id) {
          // Generate snippet from the first user message if it exists
          let snippet = ''
          const firstUserMessage = messages.find(
            (msg) => msg.role === 'user' && msg.type === 'text',
          )
          if (
            firstUserMessage &&
            typeof firstUserMessage.content === 'string'
          ) {
            snippet =
              firstUserMessage.content.length > 30
                ? `${firstUserMessage.content.substring(0, 30)}...`
                : firstUserMessage.content
          } else if (
            messages.some((msg) => msg.role === 'user' && msg.type === 'image')
          ) {
            snippet = '[Hình ảnh]'
          }
          // Update title if it's still the default and we have a user message
          let title = conversation.title
          if (
            title === 'Cuộc chat mới' &&
            firstUserMessage &&
            typeof firstUserMessage.content === 'string'
          ) {
            title =
              firstUserMessage.content.length > 30
                ? `${firstUserMessage.content.substring(0, 30)}...`
                : firstUserMessage.content
          }
          return {
            ...conversation,
            messages,
            result: result !== undefined ? result : conversation.result,
            updatedAt: new Date().toISOString(),
            snippet,
            title,
          }
        }
        return conversation
      })
      saveConversations(updatedConversations)
    },
    [conversations, saveConversations],
  )
  const renameConversation = useCallback(
    (id: string, title: string) => {
      const updatedConversations = conversations.map((conversation) => {
        if (conversation.id === id) {
          return { ...conversation, title }
        }
        return conversation
      })
      saveConversations(updatedConversations)
    },
    [conversations, saveConversations],
  )
  const deleteConversation = useCallback(
    (id: string) => {
      const updatedConversations = conversations.filter(
        (conversation) => conversation.id !== id,
      )
      saveConversations(updatedConversations)
      // If the active conversation is deleted, set the first available conversation as active
      if (id === activeId) {
        if (updatedConversations.length > 0) {
          setActiveId(updatedConversations[0].id)
        } else {
          const newId = createConversation()
          setActiveId(newId)
        }
      }
    },
    [activeId, conversations, createConversation, saveConversations],
  )
  const clearConversations = useCallback(() => {
    saveConversations([])
    const newId = createConversation()
    setActiveId(newId)
  }, [createConversation, saveConversations])
  const selectConversation = useCallback((id: string) => {
    setActiveId(id)
  }, [])
  const activeConversation =
    conversations.find((c) => c.id === activeId) || null
  return {
    conversations,
    activeConversation,
    activeId,
    createConversation,
    updateConversation,
    renameConversation,
    deleteConversation,
    clearConversations,
    selectConversation,
  }
}
