import React, { useEffect, useRef } from 'react'
import type { Message } from '../../types/analyze.types'
import { Loader2Icon } from 'lucide-react'
import { FloatingQuickActions } from './QuickActions'
import { StreamingMessage } from '../../../../hooks/useStreamingResponse'
import ReactMarkdown from 'react-markdown'
interface ChatMessagesProps {
  messages: Message[]
  loading: boolean
  onQuickAction?: (message: string) => void
  streamingText?: string
  isStreaming?: boolean
}
export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  loading,
  onQuickAction,
  streamingText,
  isStreaming,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500 max-w-md">
            <p className="mb-2">Xin chào! Tôi là trợ lý GreenGrow.</p>
            <p className="mb-6">Bạn cần hỗ trợ gì hôm nay?</p>
            {onQuickAction && (
              <FloatingQuickActions onAction={onQuickAction} />
            )}
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${message.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}
              >
                {message.type === 'text' && (
                  message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                        // Customize markdown rendering
                        h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 mt-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base font-bold mb-1 mt-2" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="ml-2" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        code: ({node, ...props}) => <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props} />,
                        pre: ({node, ...props}) => <pre className="bg-gray-200 p-2 rounded mt-2 mb-2 overflow-x-auto" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-400 pl-3 italic my-2" {...props} />,
                        a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                        }}
                      >
                        {message.content || '(Empty message)'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content || '(Empty message)'}</p>
                  )
                )}
                {message.type === 'image' && (
                  <div className="relative">
                    <img
                      src={message.content}
                      alt="Uploaded plant"
                      className="rounded-lg max-w-full"
                      style={{
                        maxHeight: '200px',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
        ))
      )}
      {loading && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl p-4 bg-gray-100 text-gray-800 flex items-center gap-2">
            <Loader2Icon className="animate-spin" size={16} />
            <p>Đang phân tích...</p>
          </div>
        </div>
      )}
      
      {isStreaming && streamingText && (
        <div className="flex justify-start">
          <StreamingMessage 
            text={streamingText} 
            isStreaming={true}
          />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
