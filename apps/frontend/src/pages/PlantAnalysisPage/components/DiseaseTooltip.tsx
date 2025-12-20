import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Loader2Icon, InfoIcon, XIcon } from 'lucide-react'
import { useDiseaseExplanation } from '../hooks/useDiseaseExplanation'

interface DiseaseTooltipProps {
  diseaseName: string
  plantName?: string
  children: React.ReactNode
  enabled?: boolean // Only enable after analysis complete
  onOpen?: () => void // Callback when modal opens
  isOpen?: boolean // Controlled open state
  onClose?: () => void // Callback when modal closes
}

export const DiseaseTooltip: React.FC<DiseaseTooltipProps> = ({
  diseaseName,
  plantName,
  children,
  enabled = true, // Default enabled, but should be false until analysis complete
  onOpen,
  isOpen: controlledIsOpen,
  onClose,
}) => {
  // Use controlled state if provided, otherwise use internal state
  const [internalIsVisible, setInternalIsVisible] = useState(false)
  const isVisible = controlledIsOpen !== undefined ? controlledIsOpen : internalIsVisible
  const setIsVisible = (value: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsVisible(value)
    }
    if (value && onOpen) {
      onOpen()
    }
    if (!value && onClose) {
      onClose()
    }
  }
  
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const { getExplanation, explanations, loading } = useDiseaseExplanation()
  const [explanation, setExplanation] = useState<string | null>(null)

  // Fetch explanation when tooltip becomes visible AND enabled
  // Keep explanation in state even when tooltip is hidden (for caching)
  useEffect(() => {
    if (isVisible && enabled) {
      if (explanations[diseaseName]) {
        // Use cached explanation
        setExplanation(explanations[diseaseName])
      } else {
        // Fetch new explanation
        getExplanation(diseaseName, plantName)
          .then((expl) => {
            setExplanation(expl)
          })
          .catch((error) => {
            console.error('Failed to fetch explanation:', error)
            setExplanation('Không thể tải giải thích về bệnh này.')
          })
      }
    }
    // Don't clear explanation when hidden - keep it cached for next time
  }, [isVisible, enabled, diseaseName, plantName, explanations, getExplanation])

  // Pre-load explanation if available in cache
  useEffect(() => {
    if (explanations[diseaseName] && !explanation) {
      setExplanation(explanations[diseaseName])
    }
  }, [explanations, diseaseName, explanation])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('🖱️ [DiseaseTooltip] Clicked, opening tooltip for:', diseaseName)
    // Only open, don't toggle - user must click X or outside to close
    if (!isVisible) {
      setIsVisible(true)
    }
  }

  // Close modal on Escape key
  useEffect(() => {
    if (!isVisible) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVisible(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible])

  // Always render tooltip wrapper (removed disabled check)

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onClick={handleClick}
    >
      {children}

      {/* Modal - Render via Portal to body for highest z-index */}
      {isVisible && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 99999 }}>
          {/* Invisible backdrop - only for click detection, no blur/opacity */}
          <div
            className="absolute inset-0 bg-transparent pointer-events-auto"
            onClick={() => setIsVisible(false)}
          />
          
          {/* Modal Content - Centered, highest z-index */}
          <div
            ref={modalRef}
            className="relative bg-white rounded-xl shadow-2xl border-2 border-gray-300 p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto pointer-events-auto animate-[fadeIn_0.2s_ease-out]"
            style={{ zIndex: 100000 }}
            onClick={(e) => {
              // Prevent closing when clicking inside modal
              e.stopPropagation()
            }}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <InfoIcon className="text-blue-600" size={24} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{diseaseName}</h3>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100 dark:bg-gray-700 flex-shrink-0"
                    aria-label="Đóng"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              {loading[diseaseName] ? (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2Icon className="animate-spin text-blue-600" size={20} />
                  <span className="text-gray-600 dark:text-gray-300">Đang tải giải thích...</span>
                </div>
              ) : explanation ? (
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                  <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{explanation}</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Không thể tải giải thích về bệnh này.</p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsVisible(false)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

