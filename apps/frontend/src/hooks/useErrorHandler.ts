import { useState, useCallback } from 'react'

export type ErrorType = 'network' | 'analysis' | 'upload' | 'auth' | 'weather' | 'storage' | 'permission' | 'timeout' | 'server'

export interface ErrorState {
  hasError: boolean
  errorMessage: string | null
  errorType: ErrorType
  retryCount: number
  canRetry: boolean
  lastError?: Error
}

export interface ErrorHandlerOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: () => void
  onError?: (error: Error, type: ErrorType) => void
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onError
  } = options

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    errorMessage: null,
    errorType: 'network',
    retryCount: 0,
    canRetry: true
  })

  const handleError = useCallback((error: Error, type: ErrorType, customMessage?: string) => {
    const errorMessage = customMessage || getErrorMessage(error, type)
    
    setErrorState({
      hasError: true,
      errorMessage,
      errorType: type,
      retryCount: errorState.retryCount,
      canRetry: errorState.retryCount < maxRetries,
      lastError: error
    })

    // Call error callback
    onError?.(error, type)
    
    console.error(`[${type.toUpperCase()}] Error:`, error)
  }, [errorState.retryCount, maxRetries, onError])

  const retry = useCallback(async () => {
    if (!errorState.canRetry) {
      console.warn('Max retries exceeded')
      return
    }

    setErrorState(prev => ({
      ...prev,
      hasError: false,
      errorMessage: null,
      retryCount: prev.retryCount + 1
    }))

    // Call retry callback
    onRetry?.()

    // Add delay before retry
    if (retryDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }, [errorState.canRetry, onRetry, retryDelay])

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      errorMessage: null,
      errorType: 'network',
      retryCount: 0,
      canRetry: true
    })
  }, [])

  const resetRetryCount = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      retryCount: 0,
      canRetry: true
    }))
  }, [])

  // Get user-friendly error message
  const getErrorMessage = (error: Error, type: ErrorType): string => {
    const errorMessages: Record<ErrorType, string> = {
      network: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.',
      analysis: 'Không thể phân tích. Vui lòng thử lại với ảnh khác.',
      upload: 'Lỗi tải ảnh lên. Vui lòng kiểm tra file và thử lại.',
      auth: 'Lỗi xác thực. Vui lòng đăng nhập lại.',
      weather: 'Không thể lấy dữ liệu thời tiết. Vui lòng thử lại.',
      storage: 'Lỗi lưu trữ dữ liệu. Vui lòng thử lại.'
    }

    // Check for specific error messages
    if (error.message.includes('timeout')) {
      return 'Yêu cầu hết thời gian chờ. Vui lòng thử lại.'
    }
    
    if (error.message.includes('network')) {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.'
    }
    
    if (error.message.includes('unauthorized')) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    }

    return errorMessages[type] || 'Đã xảy ra lỗi. Vui lòng thử lại.'
  }

  return {
    error: errorState,
    handleError,
    retry,
    clearError,
    resetRetryCount,
    isRetrying: errorState.retryCount > 0 && !errorState.hasError
  }
}

// Error boundary hook for React error boundaries
export const useErrorBoundary = () => {
  const [error, setError] = useState<Error | null>(null)

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  const captureError = useCallback((error: Error) => {
    setError(error)
  }, [])

  if (error) {
    throw error
  }

  return { captureError, resetError }
}

// Network error detection
export const isNetworkError = (error: Error): boolean => {
  return (
    error.message.includes('network') ||
    error.message.includes('fetch') ||
    error.message.includes('timeout') ||
    error.name === 'TypeError'
  )
}

// Retry with exponential backoff
export const useRetryWithBackoff = (baseDelay: number = 1000, maxDelay: number = 10000) => {
  const calculateDelay = useCallback((retryCount: number): number => {
    const delay = baseDelay * Math.pow(2, retryCount)
    return Math.min(delay, maxDelay)
  }, [baseDelay, maxDelay])

  const retryWithBackoff = useCallback(async (fn: () => Promise<any>, retryCount: number = 0): Promise<any> => {
    try {
      return await fn()
    } catch (error) {
      if (retryCount >= 3) {
        throw error
      }
      
      const delay = calculateDelay(retryCount)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      return retryWithBackoff(fn, retryCount + 1)
    }
  }, [calculateDelay])

  return { retryWithBackoff, calculateDelay }
}
