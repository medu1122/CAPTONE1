import React, { useState, useCallback, useRef, useEffect } from 'react'

interface VoiceInputState {
  isListening: boolean
  transcript: string
  isSupported: boolean
  error: string | null
}

interface VoiceInputOptions {
  onTranscript?: (transcript: string) => void
  onError?: (error: string) => void
  continuous?: boolean
  interimResults?: boolean
  language?: string
}

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void
  disabled?: boolean
  className?: string
}

export const useVoiceInput = (options: VoiceInputOptions = {}) => {
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: '',
    isSupported: false,
    error: null
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if Speech Recognition is supported
  useEffect(() => {
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    setState(prev => ({ ...prev, isSupported }))
  }, [])

  // Initialize Speech Recognition
  useEffect(() => {
    if (!state.isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = options.continuous ?? true
    recognition.interimResults = options.interimResults ?? true
    recognition.lang = options.language ?? 'vi-VN'

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }))
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      const fullTranscript = finalTranscript || interimTranscript
      setState(prev => ({ ...prev, transcript: fullTranscript }))

      if (finalTranscript && options.onTranscript) {
        options.onTranscript(finalTranscript)
      }
    }

    recognition.onerror = (event) => {
      const errorMessage = `Speech recognition error: ${event.error}`
      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        error: errorMessage 
      }))
      
      if (options.onError) {
        options.onError(errorMessage)
      }
    }

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }))
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [state.isSupported, options])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || state.isListening) return

    try {
      recognitionRef.current.start()
    } catch (error) {
      const errorMessage = 'Failed to start speech recognition'
      setState(prev => ({ ...prev, error: errorMessage }))
      if (options.onError) {
        options.onError(errorMessage)
      }
    }
  }, [state.isListening, options])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !state.isListening) return

    try {
      recognitionRef.current.stop()
    } catch (error) {
      console.error('Error stopping speech recognition:', error)
    }
  }, [state.isListening])

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [state.isListening, startListening, stopListening])

  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '' }))
  }, [])

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript
  }
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ 
  onTranscript, 
  disabled = false, 
  className = '' 
}) => {
  const { isListening, isSupported, error, toggleListening } = useVoiceInput({
    onTranscript,
    onError: (error) => console.error('Voice input error:', error)
  })

  if (!isSupported) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`p-2 rounded-full transition-colors ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
      >
        {isListening ? (
          <div className="w-5 h-5 bg-white rounded-full" />
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {error && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
}