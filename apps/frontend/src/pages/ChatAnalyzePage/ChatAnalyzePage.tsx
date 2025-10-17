import React, { useEffect } from 'react'
import { HistorySidebar } from './components/history/HistorySidebar'
import { ChatHeader } from './components/chat/ChatHeader'
import { ChatMessages } from './components/chat/ChatMessages'
import { ChatInput } from './components/chat/ChatInput'
import { OverviewCard } from './components/analysis/OverviewCard'
import { ImageAnalysisCard } from './components/analysis/ImageAnalysisCard'
import { ProductListCard } from './components/analysis/ProductListCard'
import { WeatherLocationCard } from './components/weather/WeatherLocationCard'
import { Header } from './components/layout/Header'
import { useChatAnalyze } from '../../contexts/ChatAnalyzeContext'
import { useWeatherLocation } from './hooks/useWeatherLocation.ts'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { LoadingOverlay } from '../../components/common/LoadingStates'

export const ChatAnalyzePage: React.FC = () => {
  // Use the new ChatAnalyzeContext
  const {
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
    
    // Error state
    error,
    retry,
    clearError,
    
    // Sidebar state
    sidebarCollapsed,
    sidebarOpen,
    setSidebarCollapsed,
    setSidebarOpen
  } = useChatAnalyze()

  // Weather data (still using the existing hook)
  const {
    data: weatherData,
    loading: weatherLoading,
    error: weatherError,
    setLocation: setWeatherLocation,
  } = useWeatherLocation()

  // Mock authentication state (removed unused variables)

  // Set up keyboard shortcuts
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
  }, [sidebarOpen, setSidebarOpen])

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

  const handleToggleRail = () => {
    setSidebarCollapsed(!sidebarCollapsed)
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
      resetChat()
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleCreateConversation = () => {
    const id = createConversation()
    resetChat()
    return id
  }

  const handleChangeLocation = (location: string) => {
    setWeatherLocation(location)
  }

  // Removed unused handleLogout function

  const handleRetry = () => {
    retry()
  }

  const handleDismissError = () => {
    clearError()
  }

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50">
      <Header />
      
      {/* Error Message */}
      {error.hasError && (
        <div className="px-4 pt-2">
          <ErrorMessage
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
        </div>
      )}

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
              <ChatMessages 
                messages={messages} 
                loading={loading} 
                onQuickAction={send}
                streamingText={streamingText}
                isStreaming={isStreaming}
              />
              <ChatInput 
                onSend={send} 
                disabled={loading} 
                isStreaming={isStreaming}
                onStopStreaming={stopStreaming}
              />
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

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={loading} 
        message="Đang phân tích..." 
      />
    </div>
  )
}