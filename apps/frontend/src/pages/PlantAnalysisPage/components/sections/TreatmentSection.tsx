import React from 'react'
import { TreatmentPanel } from '../TreatmentPanel'
import { TreatmentPanelSkeleton } from '../LoadingSkeletons'
import type { PlantInfo, Disease } from '../../types'

interface TreatmentSectionProps {
  plant: PlantInfo | null
  diseases: Disease[]
  treatments: Record<string, any>
  care: any
  isLoading: boolean
  imageUrl: string
}

export const TreatmentSection: React.FC<TreatmentSectionProps> = ({
  plant,
  diseases,
  treatments,
  care,
  isLoading,
  imageUrl,
}) => {
  // Show skeleton while loading treatments (only if we have diseases but no treatments yet)
  if (isLoading && diseases.length > 0 && Object.keys(treatments).length === 0) {
    return (
      <div className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
        <TreatmentPanelSkeleton />
      </div>
    )
  }

  // Don't render if no diseases
  if (diseases.length === 0) return null

  // Show treatments even if partially loaded (at least one treatment exists)
  // This allows progressive display as treatments come in
  if (Object.keys(treatments).length === 0 && !isLoading) {
    return null // Don't show anything if no treatments and not loading
  }

  // Show treatments with fade-in animation (even if partially loaded)
  return (
    <div className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <TreatmentPanel
        result={{
          plant: plant || {
            commonName: 'Đang nhận diện...',
            scientificName: '',
            confidence: 0,
            reliable: false,
          },
          isHealthy: false,
          diseases,
          treatments,
          additionalInfo: {},
          care,
          analyzedAt: new Date().toISOString(),
          imageUrl,
        }}
      />
    </div>
  )
}

