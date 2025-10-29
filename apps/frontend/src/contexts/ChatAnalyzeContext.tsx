import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Message, AnalysisResult, Conversation } from '../pages/ChatAnalyzePage/types/analyze.types'
import { storage } from '../pages/ChatAnalyzePage/lib/storage'
// import { chatAnalyzeService } from '../services/chatAnalyzeService' // Replaced by streamingChatService
import { imageUploadService } from '../services/imageUploadService'
import { weatherService } from '../services/weatherService'
import { geolocationService } from '../services/geolocationService'
import { streamingChatService } from '../services/streamingChatService'
import { chatHistoryService } from '../services/chatHistoryService'
import { sessionService } from '../services/sessionService'
// import { streamingService } from '../services/streamingService' // TODO: Implement when WebSocket backend is ready

interface ErrorState {
  hasError: boolean
  errorMessage: string | null
  errorType: 'network' | 'analysis' | 'upload' | 'auth' | 'weather' | 'permission' | 'timeout' | 'server'
  retryCount: number
  canRetry: boolean
  originalError?: any
}

interface ChatAnalyzeContextType {
  // Chat state
  messages: Message[]
  result: AnalysisResult | null
  loading: boolean
  send: (input: string | File) => Promise<void>
  resetChat: () => void
  
  // Streaming state
  streamingText: string
  isStreaming: boolean
  stopStreaming: () => void
  
  // History state
  conversations: Conversation[]
  activeConversation: Conversation | null
  activeId: string | null
  createConversation: () => string
  selectConversation: (id: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  clearConversations: () => void
  updateConversation: (id: string, messages: Message[], result?: AnalysisResult | null) => void
  
  // Error state
  error: ErrorState
  setError: (error: ErrorState) => void
  retry: () => void
  clearError: () => void
  
  // Sidebar state
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarOpen: (open: boolean) => void
}

const ChatAnalyzeContext = createContext<ChatAnalyzeContextType | undefined>(undefined)

export const useChatAnalyze = () => {
  const context = useContext(ChatAnalyzeContext)
  if (context === undefined) {
    throw new Error('useChatAnalyze must be used within a ChatAnalyzeProvider')
  }
  return context
}

interface ChatAnalyzeProviderProps {
  children: ReactNode
}

export const ChatAnalyzeProvider: React.FC<ChatAnalyzeProviderProps> = ({ children }) => {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Streaming state
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  
  // History state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // Error state
  const [error, setError] = useState<ErrorState>({
    hasError: false,
    errorMessage: null,
    errorType: 'network',
    retryCount: 0,
    canRetry: true
  })
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('gg_history_collapsed') === 'true'
  })
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem('gg_history_open') === 'true'
  })
  
  // Load conversations from localStorage AND backend on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Get or create sessionId
      const sessionId = sessionService.getCurrentSessionId()
      
      // 2. Try to load history from backend (MongoDB)
      try {
        const historyMessages = await chatHistoryService.loadHistory(sessionId, 50)
        
        if (historyMessages.length > 0) {
          // Convert backend format to frontend Message format
          const convertedMessages: Message[] = historyMessages.map((msg) => ({
            role: msg.role,
            type: msg.messageType as 'text' | 'image',
            content: msg.message || ''
          }))
          
          setMessages(convertedMessages)
          
          // Extract analysis result if available
          const lastAnalysis = historyMessages.find(msg => msg.analysis)?.analysis
          if (lastAnalysis?.resultTop?.plant) {
            setResult({
              plant: {
                commonName: lastAnalysis.resultTop.plant.commonName,
                scientificName: lastAnalysis.resultTop.plant.scientificName
              },
              disease: null,
              confidence: lastAnalysis.resultTop.confidence,
              care: [],
              products: []
            })
          }
        }
      } catch (error) {
        // Silently handle error - not critical
      }
      
      // 3. Load sessions list from backend
      try {
        const backendSessions = await chatHistoryService.loadSessions(50)
        
        if (backendSessions.length > 0) {
          // Convert to Conversation format
          const convertedConversations: Conversation[] = backendSessions.map((session) => ({
            id: session.sessionId,
            sessionId: session.sessionId,
            title: session.firstMessage?.substring(0, 50) || 'Chat cũ',
            messages: [],
            result: null,
            createdAt: session.lastMessageAt,
            updatedAt: session.lastMessageAt,
            snippet: session.firstMessage?.substring(0, 100) || ''
          }))
          
          setConversations(convertedConversations)
          storage.setConversations(convertedConversations) // Sync to localStorage
          console.log('✅ Loaded', backendSessions.length, 'sessions from backend')
          
          // Set active to current session
          const currentSession = convertedConversations.find(c => c.sessionId === sessionId)
          if (currentSession) {
            setActiveId(currentSession.id)
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to load sessions from backend:', error)
      }
      
      // 4. Fallback to localStorage if backend fails
      const storedConversations = storage.getConversations()
      if (conversations.length === 0 && storedConversations.length > 0) {
        setConversations(storedConversations)
        setActiveId(storedConversations[0].id)
      } else if (conversations.length === 0 && !activeId) {
        // Create new conversation if none exist
        const id = createConversation()
        setActiveId(id)
      }
    }

    loadInitialData()
  }, [])
  
  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('gg_history_collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])
  
  useEffect(() => {
    localStorage.setItem('gg_history_open', String(sidebarOpen))
  }, [sidebarOpen])
  
  // Get active conversation
  const activeConversation = conversations.find(c => c.id === activeId) || null
  
  // Save conversations to localStorage
  const saveConversations = useCallback((updatedConversations: Conversation[]) => {
    storage.setConversations(updatedConversations)
    setConversations(updatedConversations)
  }, [])
  
  // Create new conversation
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
  
  // Update conversation
  const updateConversation = useCallback((
    id: string, 
    newMessages: Message[], 
    newResult?: AnalysisResult | null
  ) => {
    const updatedConversations = conversations.map((conversation) => {
      if (conversation.id === id) {
        // Generate snippet from the first user message
        let snippet = ''
        const firstUserMessage = newMessages.find(
          (msg) => msg.role === 'user' && msg.type === 'text',
        )
        if (firstUserMessage && typeof firstUserMessage.content === 'string') {
          snippet = firstUserMessage.content.length > 30
            ? `${firstUserMessage.content.substring(0, 30)}...`
            : firstUserMessage.content
        } else if (newMessages.some((msg) => msg.role === 'user' && msg.type === 'image')) {
          snippet = '[Hình ảnh]'
        }
        
        // Update title if it's still the default
        let title = conversation.title
        if (title === 'Cuộc chat mới' && firstUserMessage && typeof firstUserMessage.content === 'string') {
          title = firstUserMessage.content.length > 30
            ? `${firstUserMessage.content.substring(0, 30)}...`
            : firstUserMessage.content
        }
        
        return {
          ...conversation,
          messages: newMessages,
          result: newResult !== undefined ? newResult : conversation.result,
          updatedAt: new Date().toISOString(),
          snippet,
          title,
        }
      }
      return conversation
    })
    saveConversations(updatedConversations)
  }, [conversations, saveConversations])
  
  // Rename conversation
  const renameConversation = useCallback((id: string, title: string) => {
    const updatedConversations = conversations.map((conversation) => {
      if (conversation.id === id) {
        return { ...conversation, title }
      }
      return conversation
    })
    saveConversations(updatedConversations)
  }, [conversations, saveConversations])
  
  // Delete conversation
  const deleteConversation = useCallback((id: string) => {
    const updatedConversations = conversations.filter(conversation => conversation.id !== id)
    saveConversations(updatedConversations)
    
    if (id === activeId) {
      if (updatedConversations.length > 0) {
        setActiveId(updatedConversations[0].id)
      } else {
        const newId = createConversation()
        setActiveId(newId)
      }
    }
  }, [activeId, conversations, createConversation, saveConversations])
  
  // Clear all conversations
  const clearConversations = useCallback(() => {
    saveConversations([])
    const newId = createConversation()
    setActiveId(newId)
  }, [createConversation, saveConversations])
  
  // Select conversation and load history from backend
  const selectConversation = useCallback(async (id: string) => {
    setActiveId(id)
    
    // Switch sessionId
    sessionService.switchSession(id)
    
    // Try to load from MongoDB first
    try {
      const historyMessages = await chatHistoryService.loadHistory(id, 50)
      
      if (historyMessages.length > 0) {
        const convertedMessages: Message[] = historyMessages.map((msg) => ({
          role: msg.role,
          type: msg.messageType as 'text' | 'image',
          content: msg.message || ''
        }))
        
        console.log('✅ Loaded', convertedMessages.length, 'messages from DB for session:', id)
        setMessages(convertedMessages)
        
        // Extract analysis if available
        const lastAnalysis = historyMessages.find(msg => msg.analysis)?.analysis
        if (lastAnalysis?.resultTop?.plant) {
          setResult({
            plant: {
              commonName: lastAnalysis.resultTop.plant.commonName,
              scientificName: lastAnalysis.resultTop.plant.scientificName
            },
            disease: null,
            confidence: lastAnalysis.resultTop.confidence,
            care: [],
            products: []
          })
        }
        return
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from DB, using localStorage:', error)
    }
    
    // Fallback to localStorage
    const conversation = conversations.find(c => c.id === id)
    if (conversation) {
      setMessages(conversation.messages)
      setResult(conversation.result)
    }
  }, [conversations])
  
  // Send message with real API integration
  const send = useCallback(async (input: string | File | { message: string; image: File | null }) => {
    const newMessagesToAdd: Message[] = []
    let imageUrl: string | undefined
    let messageText: string | undefined
    
    // Handle different input types
    if (typeof input === 'string') {
      // Plain text message
      messageText = input
      newMessagesToAdd.push({ role: 'user', type: 'text', content: input })
    } else if (input instanceof File) {
      // Plain image
      try {
        const uploadResult = await imageUploadService.uploadImage(input, {
          folder: 'greengrow/plants',
          quality: 'auto',
          format: 'auto'
        })
        imageUrl = uploadResult.url
        newMessagesToAdd.push({ role: 'user', type: 'image', content: imageUrl })
      } catch (uploadError) {
        // Fallback to local URL
        imageUrl = URL.createObjectURL(input)
        newMessagesToAdd.push({ role: 'user', type: 'image', content: imageUrl })
      }
    } else {
      // Object with message and image
      messageText = input.message
      
      // Add text message if present
      if (input.message) {
        newMessagesToAdd.push({ role: 'user', type: 'text', content: input.message })
      }
      
      // Add image message if present
      if (input.image) {
        try {
          const uploadResult = await imageUploadService.uploadImage(input.image, {
            folder: 'greengrow/plants',
            quality: 'auto',
            format: 'auto'
          })
          imageUrl = uploadResult.url
          newMessagesToAdd.push({ role: 'user', type: 'image', content: imageUrl })
        } catch (uploadError) {
          // Fallback to local URL
          imageUrl = URL.createObjectURL(input.image)
          newMessagesToAdd.push({ role: 'user', type: 'image', content: imageUrl })
        }
      }
    }
    
    const newMessages = [...messages, ...newMessagesToAdd]
    setMessages(newMessages)
    setLoading(true)
    clearError()
    
    try {
      // Get weather data if available
      let weatherData: any = undefined
      try {
        const location = await geolocationService.getCurrentPosition()
        const weather = await weatherService.getCurrentWeather({
          lat: location.lat,
          lon: location.lon
        })
        weatherData = {
          current: {
            temperature: weather.data.current.temperature,
            humidity: weather.data.current.humidity,
            description: weather.data.current.description
          }
        }
      } catch (weatherError) {
        console.log('Weather data not available:', weatherError)
        // Continue without weather data
      }
      
      // Prepare request data
      const requestData: any = {}
      
      // Add message text if available
      if (messageText) {
        requestData.message = messageText
      }
      
      // Add image URL if available
      if (imageUrl) {
        requestData.imageUrl = imageUrl
      }
      
      if (weatherData) {
        requestData.weather = weatherData
      }
      
      // Add sessionId for chat history persistence
      const sessionId = sessionService.getCurrentSessionId()
      requestData.sessionId = sessionId
      
      // Start streaming
      setIsStreaming(true)
      setStreamingText('')
      
      let fullResponse = ''
      let analysisResult: AnalysisResult | null = null
      
      await streamingChatService.startStreamingChat(
        requestData,
        // onChunk
        (chunk) => {
          if (chunk.content) {
            fullResponse += chunk.content
            setStreamingText(fullResponse)
          }
          
          // Handle metadata for analysis result
          if (chunk.metadata) {
            if (chunk.metadata.plantInfo || chunk.metadata.productInfo) {
              analysisResult = {
                plant: chunk.metadata.plantInfo || {
                  commonName: 'Cây trồng',
                  scientificName: 'Unknown'
                },
                disease: chunk.metadata.plantInfo?.disease || null,
                confidence: 0.8,
                care: chunk.metadata.plantInfo?.careInstructions || [
                  'Tưới nước đều đặn',
                  'Đảm bảo ánh sáng phù hợp',
                  'Bón phân định kỳ'
                ],
                products: chunk.metadata.productInfo || [],
                imageInsights: typeof input === 'object' && imageUrl ? {
                  previewUrl: imageUrl,
                  boxes: []
                } : undefined
              }
            }
          }
        },
        // onComplete
        (finalResponse) => {
          const botResponse: Message = {
            role: 'assistant',
            type: 'text',
            content: finalResponse
          }
          
          const finalMessages = [...newMessages, botResponse]
          setMessages(finalMessages)
          setResult(analysisResult)
          setIsStreaming(false)
          setStreamingText('')
          
          // Update conversation
          if (activeId) {
            updateConversation(activeId, finalMessages, analysisResult)
          }
        },
        // onError
        (streamError) => {
          console.error('Streaming error:', streamError)
          setIsStreaming(false)
          setStreamingText('')
          throw streamError
        }
      )
      
    } catch (err) {
      console.error('Chat analyze error:', err)
      
      // Determine error type and message
      let errorType: ErrorState['errorType'] = 'analysis'
      let errorMessage = 'Không thể phân tích. Vui lòng thử lại.'
      
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorType = 'network'
          errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.'
        } else if (err.message.includes('permission') || err.message.includes('denied')) {
          errorType = 'permission'
          errorMessage = 'Quyền truy cập bị từ chối. Vui lòng cấp quyền vị trí.'
        } else if (err.message.includes('timeout')) {
          errorType = 'timeout'
          errorMessage = 'Hết thời gian chờ. Vui lòng thử lại.'
        } else if (err.message.includes('500') || err.message.includes('server')) {
          errorType = 'server'
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.'
        }
      }
      
      const errorMsg: Message = {
        role: 'assistant',
        type: 'text',
        content: 'Xin lỗi, đã xảy ra lỗi khi phân tích. Vui lòng thử lại sau.'
      }
      const errorMessages = [...newMessages, errorMsg]
      setMessages(errorMessages)
      
      setError({
        hasError: true,
        errorMessage,
        errorType,
        retryCount: error.retryCount + 1,
        canRetry: error.retryCount < 3,
        originalError: err
      })
    } finally {
      setLoading(false)
    }
  }, [messages, activeId, updateConversation, error.retryCount])
  
  // Reset chat
  const resetChat = useCallback(() => {
    setMessages([])
    setResult(null)
    clearError()
  }, [])
  
  // Clear error
  const clearError = useCallback(() => {
    setError({
      hasError: false,
      errorMessage: null,
      errorType: 'network',
      retryCount: 0,
      canRetry: true
    })
  }, [])
  
  // Stop streaming function
  const stopStreaming = useCallback(() => {
    setIsStreaming(false)
    setStreamingText('')
  }, [])
  
  // Retry function
  const retry = useCallback(() => {
    if (error.canRetry) {
      clearError()
      // Implement retry logic here
    }
  }, [error.canRetry, clearError])
  
  const value: ChatAnalyzeContextType = {
    // Chat state
    messages,
    result,
    loading,
    send,
    resetChat,
    
    // Streaming state
    streamingText,
    isStreaming,
    stopStreaming,
    
    // History state
    conversations,
    activeConversation,
    activeId,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    clearConversations,
    updateConversation,
    
    // Error state
    error,
    setError,
    retry,
    clearError,
    
    // Sidebar state
    sidebarCollapsed,
    sidebarOpen,
    setSidebarCollapsed,
    setSidebarOpen
  }
  
  return (
    <ChatAnalyzeContext.Provider value={value}>
      {children}
    </ChatAnalyzeContext.Provider>
  )
}
