import React from 'react'
import { 
  CameraIcon, 
  LeafIcon, 
  CloudIcon, 
  ShoppingBagIcon,
  SunIcon,
  DropletsIcon,
  BugIcon,
  HeartIcon
} from 'lucide-react'

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  message: string
  category: 'analysis' | 'care' | 'weather' | 'products' | 'general'
}

interface QuickActionsProps {
  onAction: (message: string) => void
  disabled?: boolean
  className?: string
}

const quickActions: QuickAction[] = [
  {
    id: 'analyze-disease',
    label: 'Phân tích bệnh cây',
    icon: <BugIcon size={16} />,
    message: 'Tôi muốn phân tích bệnh cây trồng của tôi',
    category: 'analysis'
  },
  {
    id: 'plant-care',
    label: 'Hướng dẫn chăm sóc',
    icon: <HeartIcon size={16} />,
    message: 'Tôi cần hướng dẫn chăm sóc cây trồng',
    category: 'care'
  },
  {
    id: 'weather-check',
    label: 'Kiểm tra thời tiết',
    icon: <CloudIcon size={16} />,
    message: 'Thời tiết hôm nay như thế nào?',
    category: 'weather'
  },
  {
    id: 'product-recommend',
    label: 'Gợi ý sản phẩm',
    icon: <ShoppingBagIcon size={16} />,
    message: 'Bạn có thể gợi ý sản phẩm chăm sóc cây không?',
    category: 'products'
  },
  {
    id: 'watering-schedule',
    label: 'Lịch tưới nước',
    icon: <DropletsIcon size={16} />,
    message: 'Tôi nên tưới nước như thế nào?',
    category: 'care'
  },
  {
    id: 'sunlight-advice',
    label: 'Ánh sáng mặt trời',
    icon: <SunIcon size={16} />,
    message: 'Cây của tôi cần bao nhiêu ánh sáng?',
    category: 'care'
  },
  {
    id: 'plant-identification',
    label: 'Nhận dạng cây',
    icon: <LeafIcon size={16} />,
    message: 'Đây là loại cây gì?',
    category: 'analysis'
  },
  {
    id: 'upload-photo',
    label: 'Tải ảnh lên',
    icon: <CameraIcon size={16} />,
    message: 'Tôi sẽ gửi ảnh cây để phân tích',
    category: 'analysis'
  }
]

const categoryColors = {
  analysis: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  care: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  weather: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  products: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  general: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
}

export const QuickActions: React.FC<QuickActionsProps> = ({ 
  onAction, 
  disabled = false, 
  className = '' 
}) => {
  const handleActionClick = (action: QuickAction) => {
    if (!disabled) {
      onAction(action.message)
    }
  }

  const groupedActions = quickActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = []
    }
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, QuickAction[]>)

  const categoryLabels = {
    analysis: 'Phân tích',
    care: 'Chăm sóc',
    weather: 'Thời tiết',
    products: 'Sản phẩm',
    general: 'Chung'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-3">
        Câu hỏi nhanh
      </div>
      
      {Object.entries(groupedActions).map(([category, actions]) => (
        <div key={category} className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {categoryLabels[category as keyof typeof categoryLabels]}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={disabled}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
                  transition-all duration-200 text-left
                  ${categoryColors[action.category]}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                aria-label={action.label}
              >
                {action.icon}
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Compact version for mobile
export const QuickActionsCompact: React.FC<QuickActionsProps> = ({ 
  onAction, 
  disabled = false, 
  className = '' 
}) => {
  const popularActions = quickActions.slice(0, 4)

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {popularActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.message)}
          disabled={disabled}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
            transition-all duration-200
            ${categoryColors[action.category]}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label={action.label}
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}

// Floating quick actions for empty state
export const FloatingQuickActions: React.FC<QuickActionsProps> = ({ 
  onAction, 
  disabled = false, 
  className = '' 
}) => {
  const floatingActions = [
    {
      id: 'analyze-disease',
      label: 'Phân tích bệnh',
      icon: <BugIcon size={20} />,
      message: 'Tôi muốn phân tích bệnh cây trồng của tôi',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'plant-care',
      label: 'Chăm sóc',
      icon: <HeartIcon size={20} />,
      message: 'Tôi cần hướng dẫn chăm sóc cây trồng',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'weather-check',
      label: 'Thời tiết',
      icon: <CloudIcon size={20} />,
      message: 'Thời tiết hôm nay như thế nào?',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'product-recommend',
      label: 'Sản phẩm',
      icon: <ShoppingBagIcon size={20} />,
      message: 'Bạn có thể gợi ý sản phẩm chăm sóc cây không?',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ]

  return (
    <div className={`flex flex-wrap gap-3 justify-center ${className}`}>
      {floatingActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.message)}
          disabled={disabled}
          className={`
            flex flex-col items-center gap-2 p-4 rounded-xl text-white font-medium
            transition-all duration-200 shadow-lg hover:shadow-xl
            ${action.color}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label={action.label}
        >
          {action.icon}
          <span className="text-sm">{action.label}</span>
        </button>
      ))}
    </div>
  )
}
