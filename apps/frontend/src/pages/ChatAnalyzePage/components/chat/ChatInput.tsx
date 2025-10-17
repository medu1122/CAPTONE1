import React, { useState, useRef } from 'react'
import { SendIcon, ImageIcon, XIcon } from 'lucide-react'
import { VoiceInputButton } from '../../../../hooks/useVoiceInput'
interface ChatInputProps {
  onSend: (input: string | File) => void
  disabled?: boolean
  isStreaming?: boolean
  onStopStreaming?: () => void
}
export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, isStreaming, onStopStreaming }) => {
  const [message, setMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleSend = () => {
    if (selectedImage) {
      onSend(selectedImage)
      clearSelectedImage()
    } else if (message.trim()) {
      onSend(message.trim())
      setMessage('')
    }
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!selectedImage && message.trim()) {
        handleSend()
      }
    }
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const imageUrl = URL.createObjectURL(file)
      setPreviewUrl(imageUrl)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  const clearSelectedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedImage(null)
    setPreviewUrl(null)
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      setSelectedImage(imageFile)
      const imageUrl = URL.createObjectURL(imageFile)
      setPreviewUrl(imageUrl)
    }
  }

  // Removed unused handleFileSelect function

  const handleVoiceTranscript = (transcript: string) => {
    setMessage(transcript)
  }
  return (
    <div 
      className={`sticky bottom-0 border-t bg-white p-4 transition-colors ${
        isDragOver ? 'bg-green-50 border-green-300' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-green-50 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <ImageIcon size={32} className="text-green-600 mx-auto mb-2" />
            <p className="text-green-600 font-medium">Thả ảnh vào đây để tải lên</p>
          </div>
        </div>
      )}

      {selectedImage && previewUrl && (
        <div className="mb-3 relative">
          <div className="rounded-lg border border-gray-200 p-2 bg-gray-50">
            <div className="flex items-start">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-20 rounded-lg object-cover mr-3"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedImage.name}
                  </p>
                  <button
                    onClick={clearSelectedImage}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Xóa ảnh"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(selectedImage.size / 1024).toFixed(0)} KB
                </p>
                <button
                  onClick={handleSend}
                  className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 flex items-center gap-1"
                  disabled={disabled}
                >
                  <span>Gửi ảnh</span>
                  <SendIcon size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Chọn ảnh"
          disabled={disabled}
        >
          <ImageIcon size={20} />
        </button>
        <VoiceInputButton
          onTranscript={handleVoiceTranscript}
          disabled={disabled}
        />
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "Đang nhận phản hồi..." : "Nhập câu hỏi hoặc mô tả về cây trồng..."}
            className="w-full border rounded-xl py-3 px-4 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            rows={1}
            disabled={disabled || isStreaming}
            style={{
              minHeight: '50px',
              maxHeight: '120px',
            }}
          />
          {isStreaming && onStopStreaming ? (
            <button
              onClick={onStopStreaming}
              className="absolute right-3 bottom-2.5 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700"
              aria-label="Dừng streaming"
            >
              <XIcon size={18} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              className="absolute right-3 bottom-2.5 p-1.5 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={(!message.trim() && !selectedImage) || disabled}
              aria-label="Gửi tin nhắn"
            >
              <SendIcon size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
