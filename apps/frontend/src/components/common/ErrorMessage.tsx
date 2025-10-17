import React from 'react'
import { AlertTriangleIcon, RefreshCwIcon, XIcon, WifiIcon, UploadIcon, ShieldIcon, CloudIcon, DatabaseIcon } from 'lucide-react'
import type { ErrorType } from '../../hooks/useErrorHandler'

interface ErrorMessageProps {
  error: {
    hasError: boolean
    errorMessage: string | null
    errorType: ErrorType
    retryCount: number
    canRetry: boolean
  }
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  showRetryButton?: boolean
  showDismissButton?: boolean
}

const getErrorIcon = (errorType: ErrorType) => {
  const iconProps = { size: 20, className: "text-red-500" }
  
  switch (errorType) {
    case 'network':
      return <WifiIcon {...iconProps} />
    case 'upload':
      return <UploadIcon {...iconProps} />
    case 'auth':
      return <ShieldIcon {...iconProps} />
    case 'weather':
      return <CloudIcon {...iconProps} />
    case 'storage':
      return <DatabaseIcon {...iconProps} />
    case 'analysis':
    default:
      return <AlertTriangleIcon {...iconProps} />
  }
}

const getErrorColor = (errorType: ErrorType) => {
  switch (errorType) {
    case 'network':
      return 'border-orange-200 bg-orange-50 text-orange-800'
    case 'upload':
      return 'border-blue-200 bg-blue-50 text-blue-800'
    case 'auth':
      return 'border-red-200 bg-red-50 text-red-800'
    case 'weather':
      return 'border-cyan-200 bg-cyan-50 text-cyan-800'
    case 'storage':
      return 'border-purple-200 bg-purple-50 text-purple-800'
    case 'analysis':
    default:
      return 'border-red-200 bg-red-50 text-red-800'
  }
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  showRetryButton = true,
  showDismissButton = true
}) => {
  if (!error.hasError || !error.errorMessage) {
    return null
  }

  const errorColor = getErrorColor(error.errorType)
  const ErrorIcon = getErrorIcon(error.errorType)

  return (
    <div className={`rounded-lg border p-4 ${errorColor} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {ErrorIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {error.errorType === 'network' && 'Lỗi kết nối'}
              {error.errorType === 'upload' && 'Lỗi tải ảnh'}
              {error.errorType === 'auth' && 'Lỗi xác thực'}
              {error.errorType === 'weather' && 'Lỗi thời tiết'}
              {error.errorType === 'storage' && 'Lỗi lưu trữ'}
              {error.errorType === 'analysis' && 'Lỗi phân tích'}
            </h3>
            {showDismissButton && onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
                aria-label="Đóng thông báo lỗi"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm">
            {error.errorMessage}
          </p>
          {error.retryCount > 0 && (
            <p className="mt-1 text-xs opacity-75">
              Đã thử lại {error.retryCount} lần
            </p>
          )}
          {showRetryButton && error.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-white/50 hover:bg-white/70 transition-colors"
            >
              <RefreshCwIcon size={14} className="mr-1" />
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Toast-style error message
export const ErrorToast: React.FC<ErrorMessageProps> = (props) => {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <ErrorMessage {...props} />
    </div>
  )
}

// Inline error message for forms
export const InlineErrorMessage: React.FC<{
  message: string
  className?: string
}> = ({ message, className = '' }) => {
  if (!message) return null

  return (
    <div className={`flex items-center text-sm text-red-600 mt-1 ${className}`}>
      <AlertTriangleIcon size={16} className="mr-1 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Error boundary fallback component
export const ErrorFallback: React.FC<{
  error: Error
  resetError: () => void
  className?: string
}> = ({ error, resetError, className = '' }) => {
  return (
    <div className={`min-h-[200px] flex items-center justify-center p-6 ${className}`}>
      <div className="text-center">
        <AlertTriangleIcon size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Đã xảy ra lỗi
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {error.message || 'Có lỗi không mong muốn xảy ra'}
        </p>
        <button
          onClick={resetError}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
        >
          <RefreshCwIcon size={16} className="mr-2" />
          Thử lại
        </button>
      </div>
    </div>
  )
}
