import React from 'react'
import { Loader2Icon } from 'lucide-react'

/**
 * Loading skeleton for Plant Info Card
 */
export const PlantInfoCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <Loader2Icon className="animate-spin" size={16} />
        <span>Đang nhận diện cây...</span>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for Disease Detection
 */
export const DiseaseDetectionSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2Icon className="animate-spin" size={16} />
          <span>Đang kiểm tra bệnh...</span>
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for Treatment Panel
 */
export const TreatmentPanelSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-56 animate-pulse"></div>
      </div>

      <div className="space-y-4">
        {/* Disease tabs skeleton */}
        <div className="flex gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          ))}
        </div>

        {/* Treatment sections skeleton */}
        <div className="space-y-4">
          <div>
            <div className="h-5 bg-gray-200 rounded w-40 mb-3 animate-pulse"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2Icon className="animate-spin" size={16} />
          <span>Đang tìm phương pháp điều trị...</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Loading indicator for specific step
 */
export const StepLoadingIndicator: React.FC<{
  step: string
  message: string
}> = ({ step, message }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Loader2Icon className="animate-spin text-blue-600" size={20} />
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-900">{step}</div>
          <div className="text-xs text-blue-700 mt-1">{message}</div>
        </div>
      </div>
    </div>
  )
}

