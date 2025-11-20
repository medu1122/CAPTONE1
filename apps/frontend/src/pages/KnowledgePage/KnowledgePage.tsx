import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { ContextBanner } from './components/ContextBanner'
import { ChatMessages } from './components/ChatMessages'
import { ChatInput } from './components/ChatInput'
import { EmptyState } from './components/EmptyState'
import { useChat } from './hooks/useChat'
import { useAuth } from '../../contexts/AuthContext'
import { getContext } from './services/chatService'
import type { LastAnalysis } from './types'

export const KnowledgePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { messages, isTyping, error, send, clearMessages } = useChat()
  const [lastAnalysis, setLastAnalysis] = useState<LastAnalysis | null>(null)
  const [loadingContext, setLoadingContext] = useState(true)

  useEffect(() => {
    loadContext()
  }, [])

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

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const handleSend = async (message: string) => {
    await send(message)
  }

  const handleSuggestionClick = (suggestion: string) => {
    send(suggestion)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isLoggedIn={!!user} onLogout={handleLogout} />

      {/* Context Banner */}
      {!loadingContext && <ContextBanner lastAnalysis={lastAnalysis} />}

      {/* Fixed Header */}
      <div className="bg-white border-b shadow-sm">
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

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <ChatMessages messages={messages} isTyping={isTyping} />
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="border-t border-gray-200 bg-red-50 px-6 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  )
}

