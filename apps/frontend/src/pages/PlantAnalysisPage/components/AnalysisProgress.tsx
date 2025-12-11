import React from 'react'
import { Loader2Icon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react'
import type { StreamingState } from '../hooks/useStreamingAnalysis'
import type { PlantInfo, Disease } from '../types'

interface AnalysisProgressProps {
  state: StreamingState
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ state }) => {
  const { status, progress, currentStep, plant, diseases, treatments, care, error } = state

  if (status === 'idle') {
    return null
  }

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircleIcon className="text-red-600 mt-0.5" size={24} />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">Lỗi phân tích</h3>
            <p className="text-sm text-red-800">{error || 'Có lỗi xảy ra trong quá trình phân tích'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Đang phân tích...</h3>
          <span className="text-sm font-medium text-gray-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">{currentStep}</p>
      </div>

      {/* Plant Info Preview */}
      {plant && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="text-green-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">🌱 Đã nhận diện cây</h4>
              <div className="text-lg font-bold text-green-700">{plant.commonName}</div>
              {plant.scientificName && (
                <div className="text-sm text-gray-600 italic mt-1">{plant.scientificName}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Độ tin cậy: {Math.round(plant.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diseases Preview */}
      {diseases.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="text-amber-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">🦠 Bệnh phát hiện ({diseases.length})</h4>
              <div className="space-y-2">
                {diseases.map((disease, index) => (
                  <div key={index} className="bg-white rounded p-2 border border-amber-100">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{disease.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                        {Math.round(disease.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Treatments Preview */}
      {Object.keys(treatments).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="text-blue-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">💊 Đang tìm phương pháp điều trị...</h4>
              {Object.entries(treatments).map(([diseaseName, treatmentList]: [string, any]) => (
                <div key={diseaseName} className="mb-3 last:mb-0">
                  <div className="text-sm font-medium text-gray-700 mb-1">Cho bệnh: {diseaseName}</div>
                  <div className="flex flex-wrap gap-2">
                    {treatmentList.map((t: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-gray-700"
                      >
                        {t.title || t.type}
                        {t.count && ` (${t.count})`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Care Info Preview */}
      {care && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="text-purple-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">🌿 Thông tin chăm sóc</h4>
              <p className="text-sm text-gray-700">Đã tải thông tin chăm sóc cây</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {status !== 'complete' && (
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Loader2Icon className="animate-spin" size={20} />
          <span className="text-sm">Đang xử lý...</span>
        </div>
      )}

      {/* Complete Indicator */}
      {status === 'complete' && (
        <div className="flex items-center justify-center gap-2 text-green-600">
          <CheckCircleIcon size={20} />
          <span className="text-sm font-medium">Phân tích hoàn tất!</span>
        </div>
      )}
    </div>
  )
}

