import React, { useState } from 'react'
import { AlertCircleIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon, CheckCircleIcon, MessageSquareIcon } from 'lucide-react'
import type { PlantDisease } from '../../MyPlantsPage/types/plantBox.types'
import { addDiseaseFeedback } from '../../../services/plantBoxService'

interface DiseaseFeedbackCardProps {
  plantBoxId: string
  disease: PlantDisease
  diseaseIndex: number
  onUpdate: () => void
}

export const DiseaseFeedbackCard: React.FC<DiseaseFeedbackCardProps> = ({
  plantBoxId,
  disease,
  diseaseIndex,
  onUpdate,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'worse' | 'same' | 'better' | 'resolved' | null>(null)
  const [notes, setNotes] = useState('')

  const handleSubmitFeedback = async () => {
    if (!selectedStatus) return

    setIsSubmitting(true)
    try {
      await addDiseaseFeedback(plantBoxId, {
        diseaseIndex,
        status: selectedStatus,
        notes: notes.trim() || undefined,
      })
      setShowFeedbackForm(false)
      setSelectedStatus(null)
      setNotes('')
      onUpdate()
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      alert('Không thể gửi phản hồi. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-yellow-100 text-yellow-800'
      case 'moderate':
        return 'bg-orange-100 text-orange-800'
      case 'severe':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800'
      case 'treating':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const latestFeedback = disease.feedback && disease.feedback.length > 0
    ? disease.feedback[disease.feedback.length - 1]
    : null

  return (
    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircleIcon size={20} className="text-orange-600" />
            <h4 className="font-semibold text-orange-900">{disease.name}</h4>
          </div>
          {disease.symptoms && (
            <p className="text-sm text-gray-700 mb-2">{disease.symptoms}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {disease.severity && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(disease.severity)}`}>
                Mức độ: {disease.severity === 'mild' ? 'Nhẹ' : disease.severity === 'moderate' ? 'Trung bình' : 'Nghiêm trọng'}
              </span>
            )}
            {disease.status && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(disease.status)}`}>
                {disease.status === 'active' ? 'Đang hoạt động' : disease.status === 'treating' ? 'Đang điều trị' : 'Đã khỏi'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Latest Feedback */}
      {latestFeedback && (
        <div className="mb-3 p-2 bg-white rounded border border-orange-100">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareIcon size={14} className="text-orange-600" />
            <span className="text-xs font-medium text-gray-700">Phản hồi gần nhất:</span>
            <span className={`text-xs font-semibold ${
              latestFeedback.status === 'worse' ? 'text-red-600' :
              latestFeedback.status === 'better' ? 'text-green-600' :
              latestFeedback.status === 'resolved' ? 'text-green-700' :
              'text-gray-600'
            }`}>
              {latestFeedback.status === 'worse' ? 'Tệ hơn' :
               latestFeedback.status === 'better' ? 'Đỡ hơn' :
               latestFeedback.status === 'resolved' ? 'Đã khỏi' :
               'Không thay đổi'}
            </span>
          </div>
          {latestFeedback.notes && (
            <p className="text-xs text-gray-600 mt-1">{latestFeedback.notes}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(latestFeedback.date).toLocaleDateString('vi-VN')}
          </p>
        </div>
      )}

      {/* Feedback Form */}
      {!showFeedbackForm ? (
        <button
          onClick={() => setShowFeedbackForm(true)}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <MessageSquareIcon size={16} />
          <span>Phản hồi về tình trạng bệnh</span>
        </button>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tình trạng hiện tại:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedStatus('worse')}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  selectedStatus === 'worse'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <TrendingDownIcon size={18} className={selectedStatus === 'worse' ? 'text-red-600' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${selectedStatus === 'worse' ? 'text-red-700' : 'text-gray-700'}`}>
                  Tệ hơn
                </span>
              </button>
              <button
                onClick={() => setSelectedStatus('same')}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  selectedStatus === 'same'
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <MinusIcon size={18} className={selectedStatus === 'same' ? 'text-gray-600' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${selectedStatus === 'same' ? 'text-gray-700' : 'text-gray-700'}`}>
                  Không đổi
                </span>
              </button>
              <button
                onClick={() => setSelectedStatus('better')}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  selectedStatus === 'better'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <TrendingUpIcon size={18} className={selectedStatus === 'better' ? 'text-green-600' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${selectedStatus === 'better' ? 'text-green-700' : 'text-gray-700'}`}>
                  Đỡ hơn
                </span>
              </button>
              <button
                onClick={() => setSelectedStatus('resolved')}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  selectedStatus === 'resolved'
                    ? 'border-green-600 bg-green-100'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                <CheckCircleIcon size={18} className={selectedStatus === 'resolved' ? 'text-green-700' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${selectedStatus === 'resolved' ? 'text-green-800' : 'text-gray-700'}`}>
                  Đã khỏi
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú (tùy chọn):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mô tả thêm về tình trạng..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmitFeedback}
              disabled={!selectedStatus || isSubmitting}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
            <button
              onClick={() => {
                setShowFeedbackForm(false)
                setSelectedStatus(null)
                setNotes('')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

