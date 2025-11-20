import React from 'react'
import { InfoIcon } from 'lucide-react'
import type { LastAnalysis } from '../types'

interface ContextBannerProps {
  lastAnalysis: LastAnalysis | null
}

export const ContextBanner: React.FC<ContextBannerProps> = ({ lastAnalysis }) => {
  if (!lastAnalysis) return null

  return (
    <div className="bg-green-50 border-b border-green-200 px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center text-sm">
        <InfoIcon className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
        <span className="text-green-800">
          Phân tích gần nhất:{' '}
          <strong>{lastAnalysis.plant?.commonName || 'Không xác định'}</strong>
          {lastAnalysis.disease && (
            <span>
              {' '}
              - Bệnh: <strong>{lastAnalysis.disease.name}</strong>
            </span>
          )}
          <span className="ml-2 text-green-600">
            ({Math.round(lastAnalysis.confidence * 100)}%)
          </span>
        </span>
      </div>
    </div>
  )
}

