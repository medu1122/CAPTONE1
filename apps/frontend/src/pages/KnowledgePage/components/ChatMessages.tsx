import React, { useEffect, useRef } from 'react'
import { Loader2Icon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Message } from '../types'

interface ChatMessagesProps {
  messages: Message[]
  isTyping: boolean
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getMessageContent = (message: Message): string => {
    if (typeof message.content === 'string') {
      return message.content
    }
    if (typeof message.content === 'object') {
      return JSON.stringify(message.content)
    }
    return String(message.content || '')
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const content = getMessageContent(message)
        const isUser = message.role === 'user'
        
        return (
          <div
            key={index}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                isUser
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              {isUser ? (
                // User messages: simple text
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {content}
                </p>
              ) : (
                // Assistant messages: render markdown
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      // Headings
                      h1: ({ node, ...props }) => (
                        <h1 className="text-lg font-bold mb-3 mt-2 text-gray-900 dark:text-white" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-base font-bold mb-2 mt-3 text-gray-900 dark:text-white" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-sm font-semibold mb-1.5 mt-2 text-gray-900 dark:text-white" {...props} />
                      ),
                      // Paragraphs
                      p: ({ node, ...props }) => (
                        <p className="mb-2.5 last:mb-0 text-sm leading-relaxed text-gray-800" {...props} />
                      ),
                      // Lists
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside mb-3 space-y-1.5 text-sm text-gray-800" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal list-inside mb-3 space-y-1.5 text-sm text-gray-800" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="ml-2 text-sm leading-relaxed" {...props} />
                      ),
                      // Text formatting
                      strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-gray-900 dark:text-white" {...props} />
                      ),
                      em: ({ node, ...props }) => (
                        <em className="italic" {...props} />
                      ),
                      // Code blocks
                      code: ({ node, inline, ...props }: any) => {
                        if (inline) {
                          return (
                            <code
                              className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800"
                              {...props}
                            />
                          )
                        }
                        return (
                          <code
                            className="block bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono text-gray-800 overflow-x-auto"
                            {...props}
                          />
                        )
                      },
                      pre: ({ node, ...props }) => (
                        <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-2 mb-2 overflow-x-auto text-xs" {...props} />
                      ),
                      // Blockquote
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-green-500 pl-3 italic my-2 text-gray-700 dark:text-gray-200"
                          {...props}
                        />
                      ),
                      // Links
                      a: ({ node, ...props }) => (
                        <a
                          className="text-green-600 hover:text-green-700 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                      // Horizontal rule
                      hr: ({ node, ...props }) => (
                        <hr className="my-3 border-gray-300" {...props} />
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}
              <p
                className={`text-xs mt-2.5 ${
                  isUser ? 'text-green-100' : 'text-gray-500'
                }`}
              >
                {formatTimestamp(message.timestamp)}
              </p>
            </div>
          </div>
        )
      })}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

