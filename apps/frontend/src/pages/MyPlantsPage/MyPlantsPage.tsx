import React, { useState } from 'react'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { useAuth } from '../../contexts/AuthContext'
import { usePlantBoxes } from './hooks/usePlantBoxes'
import { PlantBoxCard } from './components/PlantBoxCard'
import { FilterBar } from './components/FilterBar'
import { StatsCards } from './components/StatsCards'
import { CreateBoxModal } from './components/CreateBoxModal'
import { EmptyState } from './components/EmptyState'
import { PlusIcon, Loader2Icon, AlertCircleIcon } from 'lucide-react'
import { ComplaintModal } from '../../components/ComplaintModal'
export const MyPlantsPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const {
    boxes,
    loading,
    filters,
    updateFilters,
    createBox,
    totalCount,
    activeCount,
    plannedCount,
  } = usePlantBoxes()
  const handleCreateBox = async (data: any) => {
    await createBox(data)
    setShowCreateModal(false)
  }
  
  if (!isAuthenticated) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Cây trồng của tôi
            </h1>
            <p className="text-gray-600 mt-2">
              Quản lý và theo dõi các cây trồng của bạn
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowComplaintModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <AlertCircleIcon size={18} />
              <span>Khiếu nại</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <PlusIcon size={20} />
              <span className="font-medium">Tạo Box mới</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2Icon className="animate-spin text-green-600" size={48} />
          </div>
        ) : totalCount === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <>
            {/* Stats Cards */}
            <StatsCards
              totalCount={totalCount}
              activeCount={activeCount}
              plannedCount={plannedCount}
            />

            {/* Filter Bar */}
            <FilterBar filters={filters} onFilterChange={updateFilters} />

            {/* Plant Boxes Grid */}
            {boxes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">
                  Không tìm thấy cây trồng nào phù hợp
                </p>
                <button
                  onClick={() =>
                    updateFilters({
                      search: '',
                      type: 'all',
                      sortBy: 'newest',
                    })
                  }
                  className="mt-4 text-green-600 hover:text-green-700 font-medium"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {boxes.map((box) => (
                  <PlantBoxCard key={box._id} box={box} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Box Modal */}
      <CreateBoxModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBox}
      />

      {/* Complaint Modal */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        type="my-plants"
        onSuccess={() => {
          alert('Cảm ơn bạn đã gửi khiếu nại. Chúng tôi sẽ xem xét và cải thiện tính năng!')
        }}
      />
    </div>
  )
}
