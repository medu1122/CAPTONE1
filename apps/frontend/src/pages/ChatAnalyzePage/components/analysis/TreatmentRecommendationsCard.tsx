import React, { useState } from 'react'
import { Pill, Leaf, Sprout, AlertCircle } from 'lucide-react'
import type { TreatmentRecommendation } from '../../types/analyze.types'

interface TreatmentRecommendationsCardProps {
  treatments: TreatmentRecommendation[]
}

export const TreatmentRecommendationsCard: React.FC<TreatmentRecommendationsCardProps> = ({
  treatments,
}) => {
  const [activeTab, setActiveTab] = useState<'chemical' | 'biological' | 'cultural'>('chemical')

  // Empty state
  if (!treatments || treatments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">🩺 Gợi ý Điều trị & Khắc phục</h2>
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <AlertCircle size={32} className="text-gray-400 mb-2" />
          <p className="text-gray-500 text-center">
            Chưa có gợi ý điều trị. Hãy gửi ảnh hoặc mô tả bệnh cây.
          </p>
        </div>
      </div>
    )
  }

  // Get treatment by type
  const chemicalTreatment = treatments.find((t) => t.type === 'chemical')
  const biologicalTreatment = treatments.find((t) => t.type === 'biological')
  const culturalTreatment = treatments.find((t) => t.type === 'cultural')

  // Get active treatment
  const activeTreatment = treatments.find((t) => t.type === activeTab)

  // Tab configuration
  const tabs = [
    {
      id: 'chemical' as const,
      label: 'Thuốc',
      icon: Pill,
      treatment: chemicalTreatment,
    },
    {
      id: 'biological' as const,
      label: 'Sinh học',
      icon: Leaf,
      treatment: biologicalTreatment,
    },
    {
      id: 'cultural' as const,
      label: 'Canh tác',
      icon: Sprout,
      treatment: culturalTreatment,
    },
  ]

  // Priority badge colors
  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'Low':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">🩺 Gợi ý Điều trị & Khắc phục</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isDisabled = !tab.treatment

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className={`
                flex items-center gap-2 px-4 py-2 font-medium transition-colors
                border-b-2 
                ${isActive
                  ? 'border-green-600 text-green-600'
                  : isDisabled
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-600 hover:text-green-600 hover:border-green-300'
                }
              `}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTreatment && activeTreatment.items.length > 0 ? (
        <div className="space-y-4">
          {activeTreatment.items.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                {item.priority && (
                  <span
                    className={`
                      px-2 py-1 text-xs font-medium rounded border
                      ${getPriorityStyle(item.priority)}
                    `}
                  >
                    {item.priority}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 mb-3">{item.description}</p>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {/* Chemical specific: Dosage */}
                {activeTab === 'chemical' && item.dosage && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📊 Liều lượng:</span>
                    <span className="font-medium text-gray-900">{item.dosage}</span>
                  </div>
                )}

                {/* Biological specific: Materials */}
                {activeTab === 'biological' && item.materials && (
                  <div className="flex items-start gap-2 col-span-2">
                    <span className="text-gray-500 flex-shrink-0">🧪 Vật liệu:</span>
                    <span className="text-gray-900">{item.materials}</span>
                  </div>
                )}

                {/* Biological specific: Effectiveness & Timeframe */}
                {activeTab === 'biological' && (
                  <>
                    {item.effectiveness && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">⏱️ Hiệu quả:</span>
                        <span className="font-medium text-green-600">{item.effectiveness}</span>
                      </div>
                    )}
                    {item.timeframe && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📅 Thời gian:</span>
                        <span className="text-gray-900">{item.timeframe}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Source */}
                {item.source && (
                  <div className="flex items-center gap-2 col-span-2 text-xs text-gray-500">
                    <span>📚 Nguồn:</span>
                    <span>{item.source}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <AlertCircle size={24} className="text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm text-center">
            Không có gợi ý {activeTab === 'chemical' ? 'thuốc hóa học' : activeTab === 'biological' ? 'phương pháp sinh học' : 'biện pháp canh tác'} cho trường hợp này.
          </p>
        </div>
      )}
    </div>
  )
}

