import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { UploadSection } from './components/UploadSection'
import { PlantInfoCard } from './components/PlantInfoCard'
import { TreatmentPanel } from './components/TreatmentPanel'
import { EmptyState } from './components/EmptyState'
import { useImageAnalysis } from './hooks/useImageAnalysis'
import { useAuth } from '../../contexts/AuthContext'

export const PlantAnalysisPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const {
    images,
    selectedImage,
    selectedImageId,
    setSelectedImageId,
    addImage,
    removeImage,
    analyze,
    resetImage,
    needsAnalysis,
  } = useImageAnalysis()

  const handleFileSelect = async (files: File[]) => {
    for (const file of files) {
      try {
        // Just add image, don't analyze yet
        const { id, image } = addImage(file)
        console.log('🖼️ Image added:', { id, hasFile: !!image.file, fileName: image.file.name })
      } catch (error: any) {
        console.error('Failed to add image:', error)
        alert(error.message)
      }
    }
  }

  const handleAnalyze = async () => {
    if (!selectedImage || !selectedImage.file) {
      alert('Vui lòng chọn ảnh để phân tích')
      return
    }

    try {
      console.log('🔍 Starting manual analysis:', selectedImage.id)
      await analyze(selectedImage.id, selectedImage.file)
      console.log('✅ Analysis complete')
    } catch (error: any) {
      console.error('❌ Failed to analyze image:', error)
      alert(error.message || 'Phân tích thất bại')
    }
  }

  const handleReset = () => {
    if (!selectedImage) return
    resetImage(selectedImage.id)
  }

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={!!user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🌿 Phân Tích Cây & Bệnh</h1>
          <p className="text-gray-600">Upload ảnh cây để nhận diện và phát hiện bệnh</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image Upload */}
          <div className="lg:col-span-1">
            <UploadSection
              images={images}
              selectedImageId={selectedImageId}
              onFileSelect={handleFileSelect}
              onImageSelect={setSelectedImageId}
              onImageRemove={removeImage}
            />
          </div>

          {/* Right Column - Analysis Results */}
          <div className="lg:col-span-2 space-y-6">
            {selectedImage ? (
              <>
                {/* Analysis Control Buttons */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  {needsAnalysis || !selectedImage.result ? (
                    <button
                      onClick={handleAnalyze}
                      disabled={selectedImage.analyzing}
                      className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {selectedImage.analyzing ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Đang phân tích...
                        </>
                      ) : (
                        <>
                          🔬 Phân Tích Ảnh
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleReset}
                      className="w-full px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      🔄 Phân Tích Lại
                    </button>
                  )}
                </div>

                {/* Analysis Results */}
                {selectedImage.result ? (
                  <>
                    <PlantInfoCard result={selectedImage.result} />
                    <TreatmentPanel result={selectedImage.result} />
                  </>
                ) : !selectedImage.analyzing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-blue-800">📸 Ảnh đã sẵn sàng. Click "Phân Tích Ảnh" để bắt đầu.</p>
                  </div>
                )}
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

