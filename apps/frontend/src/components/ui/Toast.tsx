import React, { useEffect, useState } from 'react'
import { CheckCircleIcon, AlertCircleIcon, InfoIcon, XIcon } from 'lucide-react'
interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}
export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (duration / 100)
        return newProgress < 0 ? 0 : newProgress
      })
    }, 100)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [duration, onClose])
  if (!isVisible) return null
  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />
      case 'info':
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />
    }
  }
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/30'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/30'
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/30'
    }
  }
  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 dark:border-green-800'
      case 'error':
        return 'border-red-200 dark:border-red-800'
      case 'info':
      default:
        return 'border-blue-200 dark:border-blue-800'
    }
  }
  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'info':
      default:
        return 'bg-blue-500'
    }
  }
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full">
      <div
        className={`rounded-lg border shadow-lg ${getBgColor()} ${getBorderColor()}`}
      >
        <div className="p-4 flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-b-lg">
          <div
            className={`h-full ${getProgressColor()} rounded-b-lg transition-all duration-100 ease-linear`}
            style={{
              width: `${progress}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default Toast
