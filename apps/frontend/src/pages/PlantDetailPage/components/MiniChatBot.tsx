import React, { useState } from 'react'
import { SendIcon, XIcon, MessageCircleIcon, MinusIcon, Loader2Icon } from 'lucide-react'
import { chatWithPlantBox } from '../../../services/plantBoxService'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface MiniChatBotProps {
  plantName: string
  plantBoxId: string
}

export const MiniChatBot: React.FC<MiniChatBotProps> = ({ plantName, plantBoxId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Xin chào! Tôi có thể giúp gì về ${plantName} của bạn?`,
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  
  const quickQuestions = [
    'Tại sao tưới nhiều?',
    'Có cần bón phân?',
    'Khi nào thu hoạch?',
  ]
  
  const handleSend = async () => {
    if (!input.trim() || sending) return
    
    const userMessage: Message = {
      role: 'user',
      content: input,
    }
    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setSending(true)

    try {
      const response = await chatWithPlantBox(plantBoxId, currentInput)
      
      if (response.success && response.data) {
        const botMessage: Message = {
          role: 'assistant',
          content: response.data.response || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
        }
        setMessages((prev) => [...prev, botMessage])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (err: any) {
      console.error('Error sending message:', err)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }
  const handleQuickQuestion = (question: string) => {
    setInput(question)
  }
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:scale-110 transition-all flex items-center justify-center z-50"
      >
        <MessageCircleIcon size={24} />
      </button>
    )
  }
  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-green-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <MessageCircleIcon size={20} />
          <h3 className="text-sm font-medium">Hỏi về {plantName}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-green-700 rounded transition-colors"
          >
            <MinusIcon size={20} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-green-700 rounded transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Questions */}
          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Câu hỏi nhanh:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Hỏi về cây này..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <Loader2Icon size={18} className="animate-spin" />
                ) : (
                  <SendIcon size={18} />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
