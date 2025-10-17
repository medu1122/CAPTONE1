import React from 'react'
import { AlertTriangleIcon, CheckCircleIcon } from 'lucide-react'
import type { AnalysisResult } from '../../types/analyze.types'
import { ShareAnalysis } from './ShareAnalysis'
interface OverviewCardProps {
  result: AnalysisResult | null
}
export const OverviewCard: React.FC<OverviewCardProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">Phân tích tổng quan</h2>
        <p className="text-gray-500">Gửi câu hỏi hoặc ảnh để bắt đầu.</p>
      </div>
    )
  }
  const hasDiagnosis = result.disease && result.confidence > 0.5
  const confidencePercent = Math.round(result.confidence * 100)
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Phân tích tổng quan</h2>
        <ShareAnalysis result={result} />
      </div>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {hasDiagnosis ? (
            <AlertTriangleIcon className="text-amber-500" size={20} />
          ) : (
            <CheckCircleIcon className="text-green-600" size={20} />
          )}
          <h3 className="font-medium">
            {hasDiagnosis
              ? `Có dấu hiệu ${result.disease?.name} (${confidencePercent}% tin cậy)`
              : 'Không phát hiện bệnh rõ ràng'}
          </h3>
        </div>
        <div className="mb-4">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Loại cây:</span>{' '}
            {result.plant.commonName}
          </div>
          <div className="text-sm text-gray-500 italic">
            {result.plant.scientificName}
          </div>
        </div>
        {hasDiagnosis && result.disease && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 mb-4">
            <p className="text-sm text-gray-700">
              {result.disease.description}
            </p>
          </div>
        )}
      </div>
      {result.care && result.care.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Hướng dẫn chăm sóc</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {result.care.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
