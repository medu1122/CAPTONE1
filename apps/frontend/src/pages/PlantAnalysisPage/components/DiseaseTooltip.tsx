import React, { useState, useEffect, useRef } from 'react'
import { Loader2Icon, InfoIcon, XIcon } from 'lucide-react'
import { useDiseaseExplanation } from '../hooks/useDiseaseExplanation'

interface DiseaseTooltipProps {
  diseaseName: string
  plantName?: string
  children: React.ReactNode
  enabled?: boolean // Only enable after analysis complete
}

export const DiseaseTooltip: React.FC<DiseaseTooltipProps> = ({
  diseaseName,
  plantName,
  children,
  enabled = true, // Default enabled, but should be false until analysis complete
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
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

  // Calculate tooltip position - improved positioning logic
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (!triggerRef.current) return

        const triggerRect = triggerRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const scrollY = window.scrollY
        const scrollX = window.scrollX

        // Estimate tooltip size (will be adjusted after render)
        const estimatedWidth = 350 // max-w-sm ≈ 350px
        const estimatedHeight = 150 // approximate

        // Default: show below the trigger, centered horizontally
        let top = triggerRect.bottom + scrollY + 8
        let left = triggerRect.left + scrollX + (triggerRect.width / 2) - (estimatedWidth / 2)

        // Adjust horizontal position if goes off screen
        if (left + estimatedWidth > scrollX + viewportWidth - 16) {
          // Tooltip goes off right edge - align to right with margin
          left = scrollX + viewportWidth - estimatedWidth - 16
        }
        if (left < scrollX + 16) {
          // Tooltip goes off left edge - align to left with margin
          left = scrollX + 16
        }

        // Adjust vertical position if goes off screen
        const spaceBelow = viewportHeight - triggerRect.bottom
        const spaceAbove = triggerRect.top

        if (estimatedHeight + 8 > spaceBelow && spaceAbove > spaceBelow) {
          // Not enough space below, but more space above - show above
          top = triggerRect.top + scrollY - estimatedHeight - 8
        } else if (estimatedHeight + 8 > spaceBelow) {
          // Not enough space below or above - show at bottom of viewport
          top = scrollY + viewportHeight - estimatedHeight - 16
        }

        // Ensure tooltip doesn't go above viewport
        if (top < scrollY + 16) {
          top = scrollY + 16
        }

        setPosition({ top, left })

        // Recalculate after tooltip is rendered to get actual size
        if (tooltipRef.current) {
          requestAnimationFrame(() => {
            if (!tooltipRef.current || !triggerRef.current) return

            const actualTooltipRect = tooltipRef.current.getBoundingClientRect()
            const actualTriggerRect = triggerRef.current.getBoundingClientRect()

            // Recalculate with actual dimensions
            let finalTop = actualTriggerRect.bottom + scrollY + 8
            let finalLeft = actualTriggerRect.left + scrollX + (actualTriggerRect.width / 2) - (actualTooltipRect.width / 2)

            // Adjust horizontal
            if (finalLeft + actualTooltipRect.width > scrollX + viewportWidth - 16) {
              finalLeft = scrollX + viewportWidth - actualTooltipRect.width - 16
            }
            if (finalLeft < scrollX + 16) {
              finalLeft = scrollX + 16
            }

            // Adjust vertical
            const actualSpaceBelow = viewportHeight - actualTriggerRect.bottom
            const actualSpaceAbove = actualTriggerRect.top

            if (actualTooltipRect.height + 8 > actualSpaceBelow && actualSpaceAbove > actualSpaceBelow) {
              finalTop = actualTriggerRect.top + scrollY - actualTooltipRect.height - 8
            } else if (actualTooltipRect.height + 8 > actualSpaceBelow) {
              finalTop = scrollY + viewportHeight - actualTooltipRect.height - 16
            }

            if (finalTop < scrollY + 16) {
              finalTop = scrollY + 16
            }

            setPosition({ top: finalTop, left: finalLeft })
          })
        }
      })
    }
  }, [isVisible, explanation])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('🖱️ [DiseaseTooltip] Clicked, opening tooltip for:', diseaseName)
    // Only open, don't toggle - user must click X or outside to close
    if (!isVisible) {
      setIsVisible(true)
    }
  }

  // Close tooltip when clicking outside (but not on trigger or tooltip itself)
  useEffect(() => {
    if (!isVisible) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Don't close if clicking on trigger or tooltip
      if (
        triggerRef.current?.contains(target) ||
        tooltipRef.current?.contains(target)
      ) {
        return
      }
      
      // Close if clicking outside both trigger and tooltip
      console.log('🖱️ [DiseaseTooltip] Clicked outside, closing tooltip')
      setIsVisible(false)
    }

    // Use a delay to avoid immediate close after open
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true) // Use capture phase
    }, 200)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside, true)
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

      {/* Tooltip */}
      {isVisible && (
        <>
          {/* Backdrop to ensure tooltip is on top - completely transparent */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              e.stopPropagation()
              setIsVisible(false)
            }}
            style={{ 
              pointerEvents: 'auto',
              backgroundColor: 'transparent',
              backdropFilter: 'none',
            }}
          />
          <div
            ref={tooltipRef}
            className="fixed z-[9999] bg-white rounded-lg shadow-2xl border-2 border-blue-200 p-4 max-w-sm"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              pointerEvents: 'auto',
              maxWidth: '400px',
              minWidth: '250px',
            }}
            onClick={(e) => {
              // Prevent closing when clicking inside tooltip
              e.stopPropagation()
            }}
          >
          {/* Header */}
          <div className="flex items-start gap-2 mb-2">
            <InfoIcon className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900 text-sm">{diseaseName}</h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsVisible(false)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Đóng"
                >
                  <XIcon size={14} />
                </button>
              </div>
              {loading[diseaseName] ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2Icon className="animate-spin" size={14} />
                  <span>Đang tải giải thích...</span>
                </div>
              ) : explanation ? (
                <p className="text-xs text-gray-700 leading-relaxed">{explanation}</p>
              ) : (
                <p className="text-xs text-gray-500">Không thể tải giải thích</p>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-blue-200 rotate-45"></div>
        </div>
        </>
      )}
    </div>
  )
}

