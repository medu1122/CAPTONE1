import React from 'react'
import { ImageIcon } from 'lucide-react'

export const EmptyState: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
      <ImageIcon size={64} className="text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có phân tích</h3>
      <p className="text-gray-600 dark:text-gray-300">Upload ảnh cây để bắt đầu phân tích</p>
    </div>
  )
}

