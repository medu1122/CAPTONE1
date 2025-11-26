import React, { useEffect, useState } from 'react'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { ContextBanner } from './components/ContextBanner'
import { ChatMessages } from './components/ChatMessages'
import { ChatInput } from './components/ChatInput'
import { EmptyState } from './components/EmptyState'
import { HistorySidebar } from './components/HistorySidebar'
import { useChat } from './hooks/useChat'
import { useChatHistory } from './hooks/useChatHistory'
import { getContext } from './services/chatService'
import type { LastAnalysis } from './types'

export const KnowledgePage: React.FC = () => {
  const [lastAnalysis, setLastAnalysis] = useState<LastAnalysis | null>(null)
  const [loadingContext, setLoadingContext] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('gg_knowledge_sidebar_collapsed') === 'true'
  })
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem('gg_knowledge_sidebar_open') === 'true'
  })

  // Chat history management
  const {
    conversations,
    activeId,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    clearConversations,
    loadConversations,
  } = useChatHistory()

  // Chat with session support
  const { messages, isTyping, error, loadingHistory, send, sendWithSession, clearMessages } = useChat(activeId)

  useEffect(() => {
    loadContext()
  }, [])

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('gg_knowledge_sidebar_collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    localStorage.setItem('gg_knowledge_sidebar_open', String(sidebarOpen))
  }, [sidebarOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B to toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(!sidebarOpen)
      }
      // Esc to close sidebar
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  // Handle body scroll lock when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const loadContext = async () => {
    try {
      const context = await getContext()
      setLastAnalysis(context)
    } catch (error) {
      console.error('Failed to load context:', error)
    } finally {
      setLoadingContext(false)
    }
  }

  const handleSend = async (message: string) => {
    // If no active session, create one
    let currentSessionId = activeId
    if (!currentSessionId) {
      currentSessionId = await createConversation()
      // Wait a bit for session to be created and state to update
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    
    // Use currentSessionId directly to ensure it's passed
    if (currentSessionId) {
      // Temporarily update activeId if needed
      if (activeId !== currentSessionId) {
        selectConversation(currentSessionId)
      }
      // Use sendWithSession to explicitly pass sessionId
      await sendWithSession(message, currentSessionId)
    } else {
      // Fallback to regular send if no sessionId
      await send(message)
    }
    
    // Refresh conversations list after sending message
    // This ensures the sidebar shows updated conversation titles
    setTimeout(() => {
      loadConversations()
    }, 500)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion)
  }

  const handleCreateConversation = async (): Promise<string> => {
    const id = await createConversation()
    selectConversation(id)
    clearMessages()
    return id
  }

  const handleSelectConversation = (id: string) => {
    selectConversation(id)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />

      {/* Context Banner */}
      {!loadingContext && <ContextBanner lastAnalysis={lastAnalysis} />}

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* History Sidebar */}
        <HistorySidebar
          collapsed={sidebarCollapsed}
          open={sidebarOpen}
          onToggleRail={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpen={() => setSidebarOpen(true)}
          onClose={() => setSidebarOpen(false)}
          items={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
          onCreate={handleCreateConversation}
          onRename={renameConversation}
          onDelete={deleteConversation}
          onClear={clearConversations}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Fixed Header */}
          <div className="bg-white border-b shadow-sm flex-shrink-0">
            <div className="px-4 py-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Kiến Thức Nông Nghiệp</h1>
                  <p className="text-sm text-gray-600">Hỏi đáp về cây trồng, bệnh hại, và cách chăm sóc</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area - Fixed height with scroll */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-4xl mx-auto px-4 py-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Đang tải lịch sử chat...</div>
                </div>
              ) : messages.length === 0 ? (
                <EmptyState onSuggestionClick={handleSuggestionClick} />
              ) : (
                <ChatMessages messages={messages} isTyping={isTyping} />
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="border-t border-gray-200 bg-red-50 px-6 py-3 flex-shrink-0">
              <div className="max-w-4xl mx-auto">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="max-w-4xl mx-auto">
              <ChatInput onSend={handleSend} disabled={isTyping} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

