import React, { useEffect, useState } from 'react'
import { InfoIcon } from 'lucide-react'
import { DiseaseTooltip } from '../DiseaseTooltip'
import { DiseaseDetectionSkeleton } from '../LoadingSkeletons'
import { useDiseaseExplanation } from '../../hooks/useDiseaseExplanation'
import type { Disease } from '../../types'

interface DiseaseListSectionProps {
  diseases: Disease[]
  plantName?: string
  isLoading: boolean
  enabled: boolean
}

export const DiseaseListSection: React.FC<DiseaseListSectionProps> = ({
  diseases,
  plantName,
  isLoading,
  enabled,
}) => {
  const { getExplanation, explanations } = useDiseaseExplanation()
  const [openDiseaseName, setOpenDiseaseName] = useState<string | null>(null)

  // Pre-fetch explanations for all diseases after analysis completes
  useEffect(() => {
    if (!isLoading && diseases.length > 0 && enabled) {
      console.log('📥 [DiseaseListSection] Pre-fetching explanations for', diseases.length, 'diseases')
      diseases.forEach((disease) => {
        // Only fetch if not already cached
        if (!explanations[disease.name]) {
          // Fetch in background without blocking UI
          getExplanation(disease.name, plantName).catch((error) => {
            console.error('Failed to pre-fetch explanation for', disease.name, error)
          })
        }
      })
    }
  }, [isLoading, diseases, enabled, plantName, explanations, getExplanation])

  // Show skeleton while loading diseases
  if (isLoading && diseases.length === 0) {
    return (
      <div className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
        <DiseaseDetectionSkeleton />
      </div>
    )
  }

  // Don't render if no diseases
  if (diseases.length === 0) return null

  // Show diseases with fade-in animation
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>🦠</span>
        Bệnh phát hiện ({diseases.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {diseases.map((disease, index) => (
          <DiseaseTooltip
            key={`${disease.name}-${index}`}
            diseaseName={disease.name}
            plantName={plantName}
            enabled={true} // Always enabled - tooltip works anytime
            isOpen={openDiseaseName === disease.name}
            onOpen={() => {
              // Close any other open modal and open this one
              setOpenDiseaseName(disease.name)
            }}
            onClose={() => {
              setOpenDiseaseName(null)
            }}
          >
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <span className="truncate">{disease.name}</span>
                    <InfoIcon className="text-blue-500 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" size={14} />
                  </div>
                  {disease.description && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">{disease.description}</div>
                  )}
                </div>
              </div>
              <div className="text-sm font-semibold text-amber-700 ml-3 flex-shrink-0">
                {Math.round(disease.confidence * 100)}%
              </div>
            </div>
          </DiseaseTooltip>
        ))}
      </div>
    </div>
  )
}

