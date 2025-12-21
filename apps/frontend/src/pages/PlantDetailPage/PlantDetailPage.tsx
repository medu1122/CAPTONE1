import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { DetailHeader } from './components/DetailHeader'
import { PlantOverviewCard } from './components/PlantOverviewCard'
import { TabNavigation } from './components/TabNavigation'
import { StrategyTab } from './components/StrategyTab'
import { NotesTab } from './components/NotesTab'
import { ProgressReportModal } from './components/ProgressReportModal'
import { DiseaseManagement } from './components/DiseaseManagement'
import { usePlantDetail } from './hooks/usePlantDetail'
import { useCareStrategy } from './hooks/useCareStrategy'
import { Loader2Icon, AlertCircleIcon } from 'lucide-react'
import type { PlantNote } from '../MyPlantsPage/types/plantBox.types'
import { useAuth } from '../../contexts/AuthContext'
import { ComplaintModal } from '../../components/ComplaintModal'
type TabType = 'strategy' | 'notes'
export const PlantDetailPage: React.FC = () => {
  const { id } = useParams<{
    id: string
  }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('strategy')
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [showProgressReport, setShowProgressReport] = useState(false)
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
        onComplaintClick={() => setShowComplaintModal(true)}
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

      {/* AI Progress Report Button */}
      <button
        onClick={() => setShowProgressReport(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 font-medium text-lg z-40"
      >
        <span className="text-2xl">✨</span>
        <span>Báo Cáo Tiến Độ AI</span>
      </button>

      {/* Progress Report Modal */}
      <ProgressReportModal
        isOpen={showProgressReport}
        onClose={() => setShowProgressReport(false)}
        plantBoxId={plantBox._id}
      />

      {/* Complaint Modal */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        type="my-plants"
        relatedId={plantBox._id}
        relatedType="plantBox"
        contextData={{
          // Thông tin Plant Box đầy đủ
          plantBox: {
            _id: plantBox._id,
            name: plantBox.name,
            plantName: plantBox.plantName,
            scientificName: plantBox.scientificName,
            type: plantBox.type,
            plantedDate: plantBox.plantedDate,
            plannedDate: plantBox.plannedDate,
            location: {
              name: plantBox.location.name,
              coordinates: plantBox.location.coordinates,
              area: plantBox.location.area,
              soilType: plantBox.location.soilType,
              sunlight: plantBox.location.sunlight,
            },
            quantity: plantBox.quantity,
            growthStage: plantBox.growthStage,
            currentHealth: plantBox.currentHealth,
            careLevel: plantBox.careLevel,
            wateringMethod: plantBox.wateringMethod,
            fertilizerType: plantBox.fertilizerType,
            specialRequirements: plantBox.specialRequirements,
            companionPlants: plantBox.companionPlants,
            healthNotes: plantBox.healthNotes,
            currentDiseases: plantBox.currentDiseases?.map(d => ({
              name: d.name,
              symptoms: d.symptoms,
              severity: d.severity,
              severityScore: d.severityScore,
              status: d.status,
              detectedDate: d.detectedDate,
              selectedTreatments: d.selectedTreatments,
              feedback: d.feedback,
            })) || [],
          },
          // Care Strategy hiện tại (7 ngày)
          careStrategy: strategy ? {
            lastUpdated: strategy.lastUpdated,
            summary: strategy.summary,
            next7Days: strategy.next7Days?.map(day => ({
              date: day.date,
              actions: day.actions?.map(action => ({
                _id: action._id,
                type: action.type,
                time: action.time,
                description: action.description,
                reason: action.reason,
                products: action.products,
                completed: action.completed,
              })) || [],
              weather: day.weather,
            })) || [],
          } : null,
        }}
        onSuccess={() => {
          alert('Cảm ơn bạn đã gửi khiếu nại về plant box này. Chúng tôi sẽ xem xét và cải thiện!')
        }}
      />
    </div>
  )
}
