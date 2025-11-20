import React from 'react'
import { MessageCircleIcon } from 'lucide-react'

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void
}

const QUICK_SUGGESTIONS = [
  'Cách chữa bệnh đạo ôn trên lúa?',
  'Cây cà chua bị vàng lá phải làm sao?',
  'Thuốc sinh học là gì?',
  'Lịch bón phân cho cây ngô?',
]

export const EmptyState: React.FC<EmptyStateProps> = ({ onSuggestionClick }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <MessageCircleIcon size={64} className="text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Bắt đầu cuộc trò chuyện</h2>
      <p className="text-gray-600 mb-8">Hỏi bất kỳ câu hỏi nào về cây trồng, bệnh hại...</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {QUICK_SUGGESTIONS.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-green-500 hover:bg-green-50 transition-all text-left"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}

