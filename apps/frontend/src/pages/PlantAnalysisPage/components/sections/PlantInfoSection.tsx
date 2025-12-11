import React from 'react'
import { PlantInfoCard } from '../PlantInfoCard'
import { PlantInfoCardSkeleton } from '../LoadingSkeletons'
import type { PlantInfo, Disease } from '../../types'

interface PlantInfoSectionProps {
  plant: PlantInfo | null
  isHealthy: boolean
  diseases: Disease[]
  isLoading: boolean
  imageUrl: string
}

export const PlantInfoSection: React.FC<PlantInfoSectionProps> = ({
  plant,
  isHealthy,
  diseases,
  isLoading,
  imageUrl,
}) => {
  // Show skeleton while loading
  if (isLoading && !plant) {
    return (
      <div className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
        <PlantInfoCardSkeleton />
      </div>
    )
  }

  // Don't render if no plant data
  if (!plant) return null

  // Show plant info with fade-in animation
  return (
    <div className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <PlantInfoCard
        result={{
          plant,
          isHealthy,
          diseases,
          treatments: {},
          additionalInfo: {},
          care: null,
          analyzedAt: new Date().toISOString(),
          imageUrl,
        }}
      />
    </div>
  )
}

