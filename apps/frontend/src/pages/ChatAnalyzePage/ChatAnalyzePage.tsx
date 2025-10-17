import React, { useEffect, useState } from 'react'
import { HistorySidebar } from './components/history/HistorySidebar'
import { ChatHeader } from './components/chat/ChatHeader'
import { ChatMessages } from './components/chat/ChatMessages'
import { ChatInput } from './components/chat/ChatInput'
import { OverviewCard } from './components/analysis/OverviewCard'
import { ImageAnalysisCard } from './components/analysis/ImageAnalysisCard'
import { ProductListCard } from './components/analysis/ProductListCard'
import { WeatherLocationCard } from './components/weather/WeatherLocationCard'
import { Header } from './components/layout/Header'
import { useChat } from './hooks/useChat'
import { useChatHistory } from './hooks/useChatHistory'
import { useWeatherLocation } from './hooks/useWeatherLocation.ts'
import { STORAGE_KEYS } from './lib/storage'
export const ChatAnalyzePage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.HISTORY_COLLAPSED) === 'true'
  })
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.HISTORY_OPEN) === 'true'
  })
  // Mock authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const {
    conversations,
    activeConversation,
    activeId,
    createConversation,
    renameConversation,
    deleteConversation,
    clearConversations,
    selectConversation,
    updateConversation,
  } = useChatHistory()
  const { messages, result, loading, send, resetChat, setExternalState } =
    useChat((messages, result) => {
      if (activeId) {
        updateConversation(activeId, messages)
      }
    })
  const {
    data: weatherData,
    loading: weatherLoading,
    error: weatherError,
    setLocation: setWeatherLocation,
  } = useWeatherLocation()
  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B to toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen((prev) => !prev)
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
  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.HISTORY_COLLAPSED,
      String(sidebarCollapsed),
    )
  }, [sidebarCollapsed])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY_OPEN, String(sidebarOpen))
  }, [sidebarOpen])
  const handleToggleRail = () => {
    setSidebarCollapsed((prev) => !prev)
  }
  const handleOpenSidebar = () => {
    setSidebarOpen(true)
  }
  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }
  const handleSelectConversation = (id: string) => {
    selectConversation(id)
    const conversation = conversations.find((c) => c.id === id)
    if (conversation) {
      resetChat(conversation.messages, conversation.result)
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }
  const handleCreateConversation = () => {
    const id = createConversation()
    resetChat([], null)
    return id
  }
  const handleChangeLocation = (location: string) => {
    setWeatherLocation(location)
  }
  const handleLogout = () => {
    setIsLoggedIn(false)
    // In a real app, this would clear auth tokens, etc.
  }
  return (
    <div className="flex flex-col w-full h-screen bg-gray-50">
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <HistorySidebar
          collapsed={sidebarCollapsed}
          open={sidebarOpen}
          onToggleRail={handleToggleRail}
          onOpen={handleOpenSidebar}
          onClose={handleCloseSidebar}
          items={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
          onCreate={handleCreateConversation}
          onRename={renameConversation}
          onDelete={deleteConversation}
          onClear={clearConversations}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Weather and Location Card */}
          <div className="px-4 pt-4">
            <WeatherLocationCard
              data={weatherData}
              loading={weatherLoading}
              error={weatherError}
              onChangeLocation={handleChangeLocation}
            />
          </div>
          <div className="flex flex-1 overflow-hidden">
            {/* Chat Section */}
            <div className="flex flex-col w-full md:w-1/2 h-full border-r">
              <ChatHeader
                onOpenSidebar={handleOpenSidebar}
                title={activeConversation?.title || 'Cuộc chat mới'}
              />
              <ChatMessages messages={messages} loading={loading} />
              <ChatInput onSend={send} disabled={loading} />
            </div>
            {/* Analysis Panel */}
            <div className="hidden md:block w-1/2 h-full overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-6">
                <OverviewCard result={result} />
                <ImageAnalysisCard imageInsights={result?.imageInsights} />
                <ProductListCard products={result?.products || []} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
