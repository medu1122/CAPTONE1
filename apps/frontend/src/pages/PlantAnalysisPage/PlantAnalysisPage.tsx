import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { UploadSection } from './components/UploadSection'
import { PlantInfoCard } from './components/PlantInfoCard'
import { TreatmentPanel } from './components/TreatmentPanel'
import { WelcomeSection } from './components/WelcomeSection'
import { PlantInfoSection } from './components/sections/PlantInfoSection'
import { DiseaseListSection } from './components/sections/DiseaseListSection'
import { TreatmentSection } from './components/sections/TreatmentSection'
import { AnalysisReportModal } from './components/AnalysisReportModal'
import { useImageAnalysis } from './hooks/useImageAnalysis'
import { useAuth } from '../../contexts/AuthContext'

export const PlantAnalysisPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, logout } = useAuth()
  const [showReportModal, setShowReportModal] = useState(false)
  const [autoUploading, setAutoUploading] = useState(false)
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
    streamingState,
  } = useImageAnalysis()

  // Auto-upload image from URL parameter
  useEffect(() => {
    const imageUrl = searchParams.get('imageUrl')
    if (imageUrl && !autoUploading && images.length === 0) {
      setAutoUploading(true)
      // Fetch image and convert to File
      fetch(imageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'analysis-image.jpg', { type: blob.type })
          const { id, image } = addImage(file)
          console.log('✅ [PlantAnalysisPage] Auto-uploaded image from URL:', imageUrl, 'Image ID:', id)
          // Auto-analyze after upload
          setTimeout(() => {
            analyze(id, image.file).catch((error) => {
              console.error('Failed to auto-analyze:', error)
            })
          }, 1000)
        })
        .catch((error) => {
          console.error('Failed to auto-upload image:', error)
          alert('Không thể tải hình ảnh từ URL')
        })
        .finally(() => {
          setAutoUploading(false)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('imageUrl')])

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
            {/* Show WelcomeSection if no image OR image uploaded but not analyzing yet */}
            {!selectedImage || (!selectedImage.analyzing && !selectedImage.result) ? (
              <div className="space-y-6">
                {!selectedImage ? (
                  <WelcomeSection />
                ) : (
                  <>
                    {/* Compact welcome when image uploaded */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-sm p-6 border border-green-200">
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                          <span className="text-3xl">🌿</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                          Ảnh đã sẵn sàng!
                        </h2>
                        <p className="text-gray-700">
                          Click nút bên dưới để bắt đầu phân tích cây và phát hiện bệnh
                        </p>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Show analyze button if image is uploaded */}
                {selectedImage && (
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
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
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Report Button - Only show after analysis is complete */}
                {selectedImage.result && !selectedImage.analyzing && (
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>🚩</span>
                      <span>Báo cáo lỗi hoặc kết quả sai</span>
                    </button>
                  </div>
                )}

                {/* Analysis Interface - Show when analyzing or has result */}
                {/* Small Progress Indicator - Only show progress bar, not full component */}
                {selectedImage.analyzing && streamingState.status !== 'idle' && streamingState.status !== 'complete' && (
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{streamingState.currentStep}</span>
                      <span className="text-sm text-gray-500">{streamingState.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${streamingState.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sections - Load in order with animations */}
                <PlantInfoSection
                  plant={streamingState.plant}
                  isHealthy={streamingState.diseases.length === 0}
                  diseases={streamingState.diseases}
                  isLoading={selectedImage.analyzing && !streamingState.plant && streamingState.status !== 'error'}
                  imageUrl={selectedImage.previewUrl}
                />

                <DiseaseListSection
                  diseases={streamingState.diseases}
                  plantName={streamingState.plant?.commonName}
                  isLoading={selectedImage.analyzing && streamingState.plant && streamingState.diseases.length === 0 && streamingState.status !== 'error'}
                  enabled={!selectedImage.analyzing && (selectedImage.result !== null || streamingState.status === 'complete')}
                />

                <TreatmentSection
                  plant={streamingState.plant}
                  diseases={streamingState.diseases}
                  treatments={streamingState.treatments}
                  care={streamingState.care}
                  isLoading={selectedImage.analyzing && streamingState.diseases.length > 0 && Object.keys(streamingState.treatments).length === 0 && streamingState.status !== 'error'}
                  imageUrl={selectedImage.previewUrl}
                />

                {/* Final Results - Show when complete (fallback for non-streaming) */}
                {selectedImage.result && !selectedImage.analyzing && !streamingState.plant && (
                  <>
                    <PlantInfoSection
                      plant={selectedImage.result.plant}
                      isHealthy={selectedImage.result.isHealthy}
                      diseases={selectedImage.result.diseases}
                      isLoading={false}
                      imageUrl={selectedImage.previewUrl}
                    />
                    <DiseaseListSection
                      diseases={selectedImage.result.diseases}
                      plantName={selectedImage.result.plant.commonName}
                      isLoading={false}
                      enabled={true}
                    />
                    <TreatmentSection
                      plant={selectedImage.result.plant}
                      diseases={selectedImage.result.diseases}
                      treatments={selectedImage.result.treatments}
                      care={selectedImage.result.care}
                      isLoading={false}
                      imageUrl={selectedImage.previewUrl}
                    />
                  </>
                )}

                {/* Reset button when analysis complete */}
                {selectedImage.result && !selectedImage.analyzing && (
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <button
                      onClick={handleReset}
                      className="w-full px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      🔄 Phân Tích Lại
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Analysis Report Modal */}
      <AnalysisReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        analysisId={selectedImage?.result?.analysisId || null}
        originalImageUrl={selectedImage?.result?.imageUrl || selectedImage?.previewUrl || null}
        onSuccess={() => {
          console.log('✅ Report submitted successfully')
        }}
      />
    </div>
  )
}

