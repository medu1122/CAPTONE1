import React from 'react'
import { Loader2Icon, UploadIcon, BrainIcon, CloudIcon, DatabaseIcon } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: number
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 20, 
  className = '' 
}) => {
  return (
    <Loader2Icon 
      size={size} 
      className={`animate-spin ${className}`} 
    />
  )
}

interface LoadingMessageProps {
  message: string
  icon?: React.ReactNode
  className?: string
}

export const LoadingMessage: React.FC<LoadingMessageProps> = ({ 
  message, 
  icon,
  className = '' 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {icon || <LoadingSpinner size={16} />}
      <span>{message}</span>
    </div>
  )
}

interface LoadingCardProps {
  title: string
  message: string
  icon?: React.ReactNode
  className?: string
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  title, 
  message, 
  icon,
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        {icon || <LoadingSpinner size={24} />}
        <h2 className="text-lg font-medium">{title}</h2>
      </div>
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

// Skeleton loaders
export const SkeletonLoader: React.FC<{
  className?: string
  lines?: number
}> = ({ className = '', lines = 1 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-gray-200 rounded mb-2"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

export const SkeletonCard: React.FC<{
  className?: string
}> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  )
}

// Specific loading states for chat analyze
export const AnalysisLoading: React.FC<{
  className?: string
}> = ({ className = '' }) => {
  return (
    <LoadingCard
      title="Đang phân tích"
      message="AI đang phân tích hình ảnh và tạo phản hồi..."
      icon={<BrainIcon size={24} className="text-blue-500" />}
      className={className}
    />
  )
}

export const WeatherLoading: React.FC<{
  className?: string
}> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-3 ${className}`}>
      <div className="animate-pulse flex space-x-4 w-full">
        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  )
}

export const UploadLoading: React.FC<{
  className?: string
}> = ({ className = '' }) => {
  return (
    <LoadingMessage
      message="Đang tải ảnh lên..."
      icon={<UploadIcon size={16} className="text-blue-500" />}
      className={className}
    />
  )
}

export const DatabaseLoading: React.FC<{
  className?: string
}> = ({ className = '' }) => {
  return (
    <LoadingMessage
      message="Đang lưu dữ liệu..."
      icon={<DatabaseIcon size={16} className="text-green-500" />}
      className={className}
    />
  )
}

// Progress bar
export const ProgressBar: React.FC<{
  progress: number
  className?: string
  showPercentage?: boolean
}> = ({ progress, className = '', showPercentage = true }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">Tiến độ</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}

// Loading overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean
  message?: string
  className?: string
}> = ({ isVisible, message = "Đang xử lý...", className = '' }) => {
  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 flex items-center gap-3">
        <LoadingSpinner size={24} />
        <span className="text-gray-700">{message}</span>
      </div>
    </div>
  )
}

// Button loading state
export const LoadingButton: React.FC<{
  loading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
  onClick?: () => void
  disabled?: boolean
}> = ({ 
  loading, 
  children, 
  loadingText = "Đang xử lý...", 
  className = "",
  onClick,
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        loading || disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${className}`}
    >
      {loading && <LoadingSpinner size={16} />}
      {loading ? loadingText : children}
    </button>
  )
}
