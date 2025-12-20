import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { DetailHeader } from './components/DetailHeader'
import { PlantOverviewCard } from './components/PlantOverviewCard'
import { TabNavigation } from './components/TabNavigation'
import { StrategyTab } from './components/StrategyTab'
import { NotesTab } from './components/NotesTab'
import { MiniChatBot } from './components/MiniChatBot'
import { DiseaseManagement } from './components/DiseaseManagement'
import { usePlantDetail } from './hooks/usePlantDetail'
import { useCareStrategy } from './hooks/useCareStrategy'
import { Loader2Icon } from 'lucide-react'
import type { PlantNote } from '../MyPlantsPage/types/plantBox.types'
import { useAuth } from '../../contexts/AuthContext'
type TabType = 'strategy' | 'notes'
export const PlantDetailPage: React.FC = () => {
  const { id } = useParams<{
    id: string
  }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('strategy')
  const { plantBox, loading, error, addNote, refreshPlantBox, updatePlantBox } = usePlantDetail(id || '')
  const {
    strategy,
    loading: strategyLoading,
    refreshing,
    refreshStrategy,
    toggleActionComplete,
  } = useCareStrategy(plantBox)
  const handleDelete = async () => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa "${plantBox?.name}"?\n\nHành động này không thể hoàn tác.`,
      )
    ) {
      return
    }

    try {
      const { deletePlantBox } = await import('../../services/plantBoxService')
      const response = await deletePlantBox(id || '')
      
      if (response.success) {
        navigate('/my-plants')
      } else {
        alert('Không thể xóa plant box')
      }
    } catch (err: any) {
      console.error('Error deleting plant box:', err)
      alert('Không thể xóa plant box: ' + (err.message || 'Lỗi không xác định'))
    }
  }
  const handleAddNote = async (note: Omit<PlantNote, '_id' | 'date'>) => {
    if (!id) return
    try {
      await addNote(note.content, note.type, note.imageUrl)
    } catch (err: any) {
      console.error('Error adding note:', err)
      alert('Không thể thêm ghi chú: ' + (err.message || 'Lỗi không xác định'))
    }
  }
  if (!isAuthenticated) {
    return null
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2Icon className="animate-spin text-green-600" size={48} />
        </div>
      </div>
    )
  }
  
  if (error || !plantBox) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <p className="text-red-500 text-lg mb-4">
            {error || 'Không tìm thấy cây trồng'}
          </p>
          <button
            onClick={() => navigate('/my-plants')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Quay lại My Plants
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <DetailHeader
        plantName={plantBox.name}
        onDelete={handleDelete}
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        <PlantOverviewCard 
          plantBox={plantBox} 
          onImageUpload={refreshPlantBox}
          onUpdate={async (updatedBox) => {
            // Refresh to get latest data
            await refreshPlantBox()
          }}
        />

        {/* Disease Management Section (includes feedback) */}
        <DiseaseManagement
          plantBoxId={plantBox._id}
          diseases={plantBox.currentDiseases || []}
          plantName={plantBox.plantName}
          onUpdate={refreshPlantBox}
          onRefreshStrategy={refreshStrategy}
        />

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="py-6">
          {activeTab === 'strategy' && (
            <StrategyTab
              strategy={strategy}
              loading={strategyLoading}
              refreshing={refreshing}
              onRefresh={refreshStrategy}
              onToggleAction={toggleActionComplete}
              plantBoxId={plantBox._id}
              plantBox={plantBox}
            />
          )}
          {activeTab === 'notes' && (
            <NotesTab plantBox={plantBox} onAddNote={handleAddNote} />
          )}
        </div>
      </div>

      <MiniChatBot plantName={plantBox.name} plantBoxId={plantBox._id} />
    </div>
  )
}
