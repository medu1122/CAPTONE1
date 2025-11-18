// EmptyState component
// Add your code here
import React from 'react'
import { SproutIcon } from 'lucide-react'
interface EmptyStateProps {
  onCreateClick: () => void
}
export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateClick }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-gray-300 mb-6">
        <SproutIcon size={64} />
      </div>
      <h3 className="text-2xl font-bold text-gray-600 mb-2">
        Chưa có cây trồng nào
      </h3>
      <p className="text-gray-500 text-center mb-8 max-w-md">
        Bắt đầu quản lý cây trồng của bạn
      </p>
      <button
        onClick={onCreateClick}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <span>+</span>
        <span>Tạo Box đầu tiên</span>
      </button>
    </div>
  )
}
