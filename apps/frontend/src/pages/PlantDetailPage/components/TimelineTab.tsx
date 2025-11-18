import React from 'react'
import {
  PlusIcon,
  FileTextIcon,
  ImageIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
} from 'lucide-react'
import type { PlantBox } from '../../MyPlantsPage/types/plantBox.types'
interface TimelineTabProps {
  plantBox: PlantBox
}
export const TimelineTab: React.FC<TimelineTabProps> = ({ plantBox }) => {
  const timelineItems = [
    ...(plantBox.notes || []).map((note) => ({
      id: note._id,
      type: note.type,
      date: note.date,
      content: note.content,
      isNote: true,
    })),
    ...(plantBox.images || []).map((image) => ({
      id: image._id,
      type: 'image' as const,
      date: image.date,
      content: image.description || 'Cập nhật hình ảnh',
      imageUrl: image.url,
      isNote: false,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const getIcon = (type: string) => {
    const icons: Record<string, any> = {
      care: {
        Icon: FileTextIcon,
        bg: 'bg-blue-100',
        color: 'text-blue-600',
      },
      observation: {
        Icon: AlertTriangleIcon,
        bg: 'bg-purple-100',
        color: 'text-purple-600',
      },
      issue: {
        Icon: AlertTriangleIcon,
        bg: 'bg-red-100',
        color: 'text-red-600',
      },
      milestone: {
        Icon: TrendingUpIcon,
        bg: 'bg-green-100',
        color: 'text-green-600',
      },
      image: {
        Icon: ImageIcon,
        bg: 'bg-gray-100',
        color: 'text-gray-600',
      },
    }
    return icons[type] || icons.care
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      care: 'Care',
      observation: 'Observation',
      issue: 'Issue',
      milestone: 'Milestone',
      image: 'Image',
    }
    return labels[type] || type
  }
  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Chưa có sự kiện nào
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Bắt đầu ghi lại quá trình chăm sóc cây
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">📊 Timeline</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
          <PlusIcon size={16} />
          <span>Thêm sự kiện</span>
        </button>
      </div>

      <div className="space-y-3">
        {timelineItems.map((item) => {
          const { Icon, bg, color } = getIcon(item.type)
          return (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded ${bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon size={14} className={color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${bg} ${color}`}
                    >
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{item.content}</p>
                  {!item.isNote && 'imageUrl' in item && item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt="Timeline"
                      className="mt-3 rounded-lg max-w-xs h-32 object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
