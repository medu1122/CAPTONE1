import React from 'react'
import { CheckCircleIcon, AlertTriangleIcon } from 'lucide-react'
import type { AnalysisResult } from '../types'

interface PlantInfoCardProps {
  result: AnalysisResult
}

export const PlantInfoCard: React.FC<PlantInfoCardProps> = ({ result }) => {
  const { plant, isHealthy, diseases } = result
  const topDisease = diseases[0]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>🌱</span>
        Phân tích tổng quan
      </h2>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isHealthy ? (
              <CheckCircleIcon className="text-green-600" size={24} />
            ) : (
              <AlertTriangleIcon className="text-amber-500" size={24} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {isHealthy
                  ? 'Không phát hiện bệnh rõ ràng'
                  : topDisease
                    ? `Có dấu hiệu ${topDisease.name} (${Math.round(topDisease.confidence * 100)}% tin cậy)`
                    : 'Đang phân tích...'}
              </h3>
            </div>
            {/* Plant Name - LARGER */}
            <div className="mt-3 mb-2">
              <div className="text-xs text-gray-500 mb-1">Loại cây:</div>
              <div className="text-2xl font-bold text-green-700">{plant.commonName}</div>
              <div className="text-sm text-gray-500 italic mt-1">{plant.scientificName}</div>
            </div>
            
            {/* Confidence */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-300">Độ tin cậy:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{Math.round(plant.confidence * 100)}%</span>
              {!plant.reliable && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Độ tin cậy thấp</span>
              )}
            </div>
          </div>
        </div>

        {!isHealthy && topDisease && topDisease.description && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-sm text-gray-700 dark:text-gray-200">{topDisease.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}

