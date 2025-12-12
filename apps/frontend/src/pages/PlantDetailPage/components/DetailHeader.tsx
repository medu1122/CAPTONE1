import React from 'react'
import { ArrowLeftIcon, Trash2Icon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
interface DetailHeaderProps {
  plantName: string
  onDelete: () => void
}
export const DetailHeader: React.FC<DetailHeaderProps> = ({
  plantName,
  onDelete,
}) => {
  const navigate = useNavigate()
  return (
    <div className="bg-white border-b border-gray-200 h-16 px-8 flex items-center justify-between">
      <button
        onClick={() => navigate('/my-plants')}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
      >
        <ArrowLeftIcon size={24} className="text-gray-600" />
        <span className="text-base font-medium">Quay lại</span>
      </button>

      <h1 className="text-xl font-bold text-gray-900">{plantName}</h1>

      <div className="flex items-center gap-4">
        <button
          onClick={onDelete}
          className="p-2 text-red-500 hover:text-red-600 transition-colors"
        >
          <Trash2Icon size={24} />
        </button>
      </div>
    </div>
  )
}
