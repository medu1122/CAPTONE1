import React, { useState, useRef, useEffect } from 'react'
import { PlusIcon, Trash2Icon, AlertCircleIcon, XIcon, ChevronDownIcon, Loader2Icon, TrendingUpIcon, TrendingDownIcon, MinusIcon, CheckCircleIcon, MessageSquareIcon, PackageIcon } from 'lucide-react'
import { addDisease, deleteDisease, updateDiseaseTreatments, addDiseaseFeedback } from '../../../services/plantBoxService'
import { searchDiseaseNames, getTreatmentRecommendations } from '../../../services/treatmentService'
import { commonDiseases, getMatchingCommonDiseases } from '../../../data/commonDiseases'
import { TreatmentRecommendationsCard } from './TreatmentRecommendationsCard'
import type { PlantDisease, ChemicalTreatment, BiologicalTreatment, CulturalTreatment } from '../../MyPlantsPage/types/plantBox.types'

interface DiseaseManagementProps {
  plantBoxId: string
  diseases: PlantDisease[]
  plantName: string
  onUpdate: () => void
  onRefreshStrategy?: () => void
}

export const DiseaseManagement: React.FC<DiseaseManagementProps> = ({
  plantBoxId,
  diseases,
  plantName,
  onUpdate,
  onRefreshStrategy,
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    symptoms: '',
    severity: 'moderate' as 'mild' | 'moderate' | 'severe',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [diseaseSuggestions, setDiseaseSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchingDisease, setSearchingDisease] = useState(false)
  const [selectedDiseaseIndex, setSelectedDiseaseIndex] = useState<number>(-1)
  const [showTreatmentRecommendations, setShowTreatmentRecommendations] = useState<number | null>(null)
  const [newlyAddedDiseaseIndex, setNewlyAddedDiseaseIndex] = useState<number | null>(null)
  const [showFeedbackForm, setShowFeedbackForm] = useState<{ [key: number]: boolean }>({})
  const [selectedStatus, setSelectedStatus] = useState<{ [key: number]: 'worse' | 'same' | 'better' | 'resolved' | null }>({})
  const [feedbackNotes, setFeedbackNotes] = useState<{ [key: number]: string }>({})
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<{ [key: number]: boolean }>({})
  const [selectedProductForView, setSelectedProductForView] = useState<ChemicalTreatment | null>(null)
  const [showProductViewModal, setShowProductViewModal] = useState(false)
  const diseaseSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load common diseases when form opens
  useEffect(() => {
    if (showAddForm) {
      // Load common diseases initially
      setDiseaseSuggestions(commonDiseases.slice(0, 20))
    }
  }, [showAddForm])

  // Show treatment recommendations when disease is added
  useEffect(() => {
    if (newlyAddedDiseaseIndex !== null && diseases.length > newlyAddedDiseaseIndex) {
      setShowTreatmentRecommendations(newlyAddedDiseaseIndex)
    }
  }, [diseases.length, newlyAddedDiseaseIndex])

  // Handle disease search - only allow typing for search, not for free input
  const handleDiseaseSearch = (value: string) => {
    // Clear previous timeout
    if (diseaseSearchTimeoutRef.current) {
      clearTimeout(diseaseSearchTimeoutRef.current)
    }

    // Only update search query, don't update formData.name until user selects
    setShowSuggestions(true)
    setSelectedDiseaseIndex(-1)

    if (!value || value.trim().length === 0) {
      // Show common diseases when empty
      setDiseaseSuggestions(commonDiseases.slice(0, 20))
      setFormData({ ...formData, name: '' }) // Clear selected disease
      return
    }

    // Get common matches first
    const commonMatches = getMatchingCommonDiseases(value)

    // Search in database with debounce
    if (value.trim().length >= 1) {
      setSearchingDisease(true)
      diseaseSearchTimeoutRef.current = setTimeout(async () => {
        try {
          const dbSuggestions = await searchDiseaseNames(value)
          // Combine: common diseases first, then database results
          const allSuggestions = [
            ...commonMatches,
            ...dbSuggestions.filter(db => !commonMatches.includes(db))
          ]
          setDiseaseSuggestions(allSuggestions.slice(0, 20))
        } catch (error) {
          // Silently fail - keep common diseases
          setDiseaseSuggestions(commonMatches)
        } finally {
          setSearchingDisease(false)
        }
      }, 300)
    } else {
      setDiseaseSuggestions(commonMatches)
    }
  }

  // Track search query separately from selected disease
  const [searchQuery, setSearchQuery] = useState('')

  // Handle selecting a disease from suggestions
  const handleSelectDisease = (diseaseName: string) => {
    setFormData({ ...formData, name: diseaseName })
    setSearchQuery(diseaseName) // Update search query to show selected disease
    setShowSuggestions(false)
    setSelectedDiseaseIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || diseaseSuggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedDiseaseIndex(prev => 
        prev < diseaseSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedDiseaseIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedDiseaseIndex >= 0) {
      e.preventDefault()
      handleSelectDisease(diseaseSuggestions[selectedDiseaseIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddDisease = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng chọn tên bệnh từ danh sách gợi ý')
      inputRef.current?.focus()
      return
    }

    // Validate that selected disease is in suggestions or common diseases
    const allValidDiseases = [...commonDiseases, ...diseaseSuggestions]
    const isValidDisease = allValidDiseases.includes(formData.name.trim())
    
    if (!isValidDisease) {
      alert('Vui lòng chọn bệnh từ danh sách gợi ý. Không được nhập tùy ý.')
      // Clear invalid input
      setFormData({ ...formData, name: '' })
      setSearchQuery('')
      inputRef.current?.focus()
      return
    }

    try {
      // Check if there are treatment recommendations available
      const recommendations = await getTreatmentRecommendations(formData.name.trim(), plantName)
      const hasChemicalTreatments = recommendations.some(r => r.type === 'chemical' && r.items && r.items.length > 0)
      
      await addDisease(plantBoxId, {
        name: formData.name.trim(),
        symptoms: formData.symptoms.trim() || undefined,
        severity: formData.severity,
      })
      
      // Clear form
      setShowAddForm(false)
      setFormData({ name: '', symptoms: '', severity: 'moderate' })
      setSearchQuery('')
      setDiseaseSuggestions([])
      setShowSuggestions(false)
      
      // New disease will be at the end of the list
      const newDiseaseIndex = diseases.length
      
      // If there are chemical treatments, show recommendations modal (bắt buộc chọn)
      // If no treatments, skip (có thể bỏ qua)
      if (hasChemicalTreatments) {
        setNewlyAddedDiseaseIndex(newDiseaseIndex)
        // Wait for diseases list to update, then show recommendations
        setTimeout(() => {
          setShowTreatmentRecommendations(newDiseaseIndex)
        }, 100)
      }
      
      // Refresh to get updated diseases list
      await onUpdate()
    } catch (error: any) {
      console.error('Error adding disease:', error)
      alert('Không thể thêm bệnh. Vui lòng thử lại.')
    }
  }

  const handleSelectTreatments = async (
    diseaseIndex: number,
    treatments: {
      chemical?: ChemicalTreatment[]
    }
  ) => {
    try {
      await updateDiseaseTreatments(plantBoxId, diseaseIndex, treatments)
      setShowTreatmentRecommendations(null)
      setNewlyAddedDiseaseIndex(null)
      await onUpdate()
      
      // Refresh care strategy after selecting treatments
      if (onRefreshStrategy) {
        console.log('🔄 [DiseaseManagement] Refreshing care strategy after selecting treatments...')
        await onRefreshStrategy()
      }
    } catch (error: any) {
      console.error('Error updating treatments:', error)
      alert('Không thể lưu lựa chọn điều trị. Vui lòng thử lại.')
    }
  }

  const handleSubmitFeedback = async (diseaseIndex: number) => {
    const status = selectedStatus[diseaseIndex]
    if (!status) return

    setIsSubmittingFeedback({ ...isSubmittingFeedback, [diseaseIndex]: true })
    try {
      await addDiseaseFeedback(plantBoxId, {
        diseaseIndex,
        status,
        notes: feedbackNotes[diseaseIndex]?.trim() || undefined,
      })
      setShowFeedbackForm({ ...showFeedbackForm, [diseaseIndex]: false })
      setSelectedStatus({ ...selectedStatus, [diseaseIndex]: null })
      setFeedbackNotes({ ...feedbackNotes, [diseaseIndex]: '' })
      await onUpdate()
      
      // Refresh care strategy after feedback
      if (onRefreshStrategy) {
        await onRefreshStrategy()
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      alert('Không thể gửi phản hồi. Vui lòng thử lại.')
    } finally {
      setIsSubmittingFeedback({ ...isSubmittingFeedback, [diseaseIndex]: false })
    }
  }

  const handleDeleteDisease = async (index: number) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bệnh "${diseases[index].name}"?`)) {
      return
    }

    setIsDeleting(index)
    try {
      await deleteDisease(plantBoxId, index)
      onUpdate()
    } catch (error: any) {
      console.error('Error deleting disease:', error)
      alert('Không thể xóa bệnh. Vui lòng thử lại.')
    } finally {
      setIsDeleting(null)
    }
  }

  if (diseases.length === 0 && !showAddForm) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">🦠 Tình trạng bệnh</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            <PlusIcon size={16} />
            <span>Thêm bệnh</span>
          </button>
        </div>
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
          <AlertCircleIcon size={32} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Chưa có bệnh nào được ghi nhận</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">🦠 Tình trạng bệnh</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          <PlusIcon size={16} />
          <span>Thêm bệnh</span>
        </button>
      </div>

      {/* Add Disease Form */}
      {showAddForm && (
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-orange-900">Thêm bệnh mới</h4>
            <button
              onClick={() => {
                setShowAddForm(false)
                setFormData({ name: '', symptoms: '', severity: 'moderate' })
                setSearchQuery('')
                setDiseaseSuggestions([])
                setShowSuggestions(false)
                if (diseaseSearchTimeoutRef.current) {
                  clearTimeout(diseaseSearchTimeoutRef.current)
                }
              }}
              className="p-1 hover:bg-orange-100 rounded"
            >
              <XIcon size={16} className="text-orange-600" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên bệnh <span className="text-red-500">*</span>
                {formData.name && (
                  <span className="ml-2 text-xs text-green-600 font-normal">✓ Đã chọn</span>
                )}
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchQuery(value)
                    handleDiseaseSearch(value)
                    // Clear selected disease if user types something different
                    if (formData.name && value !== formData.name) {
                      setFormData({ ...formData, name: '' })
                    }
                  }}
                  onFocus={() => {
                    setShowSuggestions(true)
                    // If no disease selected, show common diseases
                    if (!formData.name) {
                      setDiseaseSuggestions(commonDiseases.slice(0, 20))
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onBlur={(e) => {
                    // Only hide suggestions if clicking outside
                    // Don't hide if clicking on a suggestion
                    setTimeout(() => {
                      if (!suggestionsRef.current?.contains(document.activeElement)) {
                        setShowSuggestions(false)
                        // If no valid disease selected, clear search query
                        if (!formData.name) {
                          setSearchQuery('')
                        } else {
                          // Restore selected disease name
                          setSearchQuery(formData.name)
                        }
                      }
                    }, 200)
                  }}
                  placeholder={formData.name ? formData.name : "Gõ để tìm bệnh (chỉ chọn từ danh sách gợi ý)..."}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${
                    formData.name 
                      ? 'border-green-500 bg-green-50 focus:ring-green-500' 
                      : 'border-gray-300 focus:ring-orange-500'
                  }`}
                />
                {searchingDisease && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2Icon size={16} className="animate-spin text-gray-400" />
                  </div>
                )}
                {!searchingDisease && showSuggestions && (
                  <ChevronDownIcon 
                    size={16} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && diseaseSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {diseaseSuggestions.map((disease, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDisease(disease)}
                      onMouseEnter={() => setSelectedDiseaseIndex(idx)}
                      className={`w-full text-left px-4 py-2 hover:bg-orange-50 transition-colors ${
                        selectedDiseaseIndex === idx ? 'bg-orange-50' : ''
                      } ${
                        disease === formData.name ? 'bg-orange-100 font-semibold' : ''
                      }`}
                      onMouseDown={(e) => {
                        // Prevent blur event on input
                        e.preventDefault()
                        handleSelectDisease(disease)
                      }}
                    >
                      {disease}
                    </button>
                  ))}
                </div>
              )}
              
              {showSuggestions && diseaseSuggestions.length === 0 && !searchingDisease && searchQuery.trim().length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-red-300 rounded-lg shadow-lg p-4 text-center text-sm text-red-600">
                  <p className="font-semibold mb-1">Không tìm thấy bệnh nào phù hợp</p>
                  <p className="text-xs text-gray-600">Vui lòng chọn từ danh sách gợi ý. Không được nhập tùy ý.</p>
                </div>
              )}
              
              {!formData.name && searchQuery.trim().length > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  ⚠️ Vui lòng chọn bệnh từ danh sách gợi ý bên trên. Không được nhập tùy ý.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Triệu chứng
              </label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="Mô tả triệu chứng bạn quan sát được..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mức độ
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="mild">Nhẹ</option>
                <option value="moderate">Trung bình</option>
                <option value="severe">Nghiêm trọng</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddDisease}
                className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Thêm bệnh
              </button>
              <button
                onClick={() => {
                setShowAddForm(false)
                setFormData({ name: '', symptoms: '', severity: 'moderate' })
                setSearchQuery('')
                setDiseaseSuggestions([])
                setShowSuggestions(false)
                if (diseaseSearchTimeoutRef.current) {
                  clearTimeout(diseaseSearchTimeoutRef.current)
                }
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Treatment Recommendations for newly added disease */}
      {showTreatmentRecommendations !== null && 
       diseases.length > showTreatmentRecommendations && 
       diseases[showTreatmentRecommendations] && (
        <TreatmentRecommendationsCard
          plantBoxId={plantBoxId}
          diseaseName={diseases[showTreatmentRecommendations].name}
          plantName={plantName}
          diseaseIndex={showTreatmentRecommendations}
          onSelectTreatments={handleSelectTreatments}
          onClose={() => {
            setShowTreatmentRecommendations(null)
            setNewlyAddedDiseaseIndex(null)
          }}
        />
      )}

      {/* Diseases List with Feedback */}
      {diseases.length > 0 && (
        <div className="space-y-4">
          {diseases.map((disease, index) => {
            const latestFeedback = disease.feedback && disease.feedback.length > 0
              ? disease.feedback[disease.feedback.length - 1]
              : null
            const hasSelectedTreatments = disease.selectedTreatments?.chemical && disease.selectedTreatments.chemical.length > 0

            return (
              <div
                key={disease._id || index}
                className="border border-orange-200 rounded-lg p-4 bg-orange-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircleIcon size={18} className="text-orange-600" />
                      <h4 className="font-semibold text-orange-900">{disease.name}</h4>
                      {disease.severity && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          disease.severity === 'mild' ? 'bg-yellow-100 text-yellow-800' :
                          disease.severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {disease.severity === 'mild' ? 'Nhẹ' : disease.severity === 'moderate' ? 'Trung bình' : 'Nghiêm trọng'}
                        </span>
                      )}
                      {disease.status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          disease.status === 'active' ? 'bg-red-100 text-red-800' :
                          disease.status === 'treating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {disease.status === 'active' ? 'Đang hoạt động' : disease.status === 'treating' ? 'Đang điều trị' : 'Đã khỏi'}
                        </span>
                      )}
                    </div>
                    {disease.symptoms && (
                      <p className="text-sm text-gray-700 mb-2">{disease.symptoms}</p>
                    )}

                    {/* Selected Treatments */}
                    {hasSelectedTreatments && (
                      <div className="mb-3 p-2 bg-white rounded border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <PackageIcon size={16} className="text-green-600" />
                          <span className="text-xs font-semibold text-gray-700">Thuốc đã chọn:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {disease.selectedTreatments.chemical.map((treatment, tIdx) => (
                            <button
                              key={tIdx}
                              onClick={() => {
                                setSelectedProductForView(treatment)
                                setShowProductViewModal(true)
                              }}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors cursor-pointer"
                            >
                              {treatment.name}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowTreatmentRecommendations(index)}
                          className="mt-2 text-xs text-blue-600 hover:underline"
                        >
                          Xem/Chỉnh sửa thuốc
                        </button>
                      </div>
                    )}

                    {/* All Feedback - Show all, not just latest */}
                    {disease.feedback && disease.feedback.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquareIcon size={14} className="text-orange-600" />
                          <span className="text-xs font-semibold text-gray-700">Lịch sử phản hồi:</span>
                        </div>
                        {disease.feedback.map((feedback, fIdx) => (
                          <div key={fIdx} className="p-2 bg-white rounded border border-orange-100">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold ${
                                feedback.status === 'worse' ? 'text-red-600' :
                                feedback.status === 'better' ? 'text-green-600' :
                                feedback.status === 'resolved' ? 'text-green-700' :
                                'text-gray-600'
                              }`}>
                                {feedback.status === 'worse' ? 'Tệ hơn' :
                                 feedback.status === 'better' ? 'Đỡ hơn' :
                                 feedback.status === 'resolved' ? 'Đã khỏi' :
                                 'Không thay đổi'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(feedback.date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            {feedback.notes && (
                              <p className="text-xs text-gray-600 mt-1">{feedback.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteDisease(index)}
                    disabled={isDeleting === index}
                    className="ml-4 p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                    title="Xóa bệnh"
                  >
                    <Trash2Icon size={16} />
                  </button>
                </div>

                {/* Treatment Selection Button */}
                {!hasSelectedTreatments && (
                  <button
                    onClick={() => setShowTreatmentRecommendations(index)}
                    className="mb-3 w-full px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <PackageIcon size={14} />
                    <span>Chọn thuốc điều trị</span>
                  </button>
                )}

                {/* Feedback Form */}
                {!showFeedbackForm[index] ? (
                  <button
                    onClick={() => setShowFeedbackForm({ ...showFeedbackForm, [index]: true })}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <MessageSquareIcon size={16} />
                    <span>Phản hồi về tình trạng bệnh</span>
                  </button>
                ) : (
                  <div className="space-y-3 mt-3 pt-3 border-t border-orange-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tình trạng hiện tại:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelectedStatus({ ...selectedStatus, [index]: 'worse' })}
                          className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                            selectedStatus[index] === 'worse'
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300 hover:border-red-300'
                          }`}
                        >
                          <TrendingDownIcon size={18} className={selectedStatus[index] === 'worse' ? 'text-red-600' : 'text-gray-400'} />
                          <span className={`text-sm font-medium ${selectedStatus[index] === 'worse' ? 'text-red-700' : 'text-gray-700'}`}>
                            Tệ hơn
                          </span>
                        </button>
                        <button
                          onClick={() => setSelectedStatus({ ...selectedStatus, [index]: 'same' })}
                          className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                            selectedStatus[index] === 'same'
                              ? 'border-gray-500 bg-gray-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <MinusIcon size={18} className={selectedStatus[index] === 'same' ? 'text-gray-600' : 'text-gray-400'} />
                          <span className={`text-sm font-medium ${selectedStatus[index] === 'same' ? 'text-gray-700' : 'text-gray-700'}`}>
                            Không đổi
                          </span>
                        </button>
                        <button
                          onClick={() => setSelectedStatus({ ...selectedStatus, [index]: 'better' })}
                          className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                            selectedStatus[index] === 'better'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-green-300'
                          }`}
                        >
                          <TrendingUpIcon size={18} className={selectedStatus[index] === 'better' ? 'text-green-600' : 'text-gray-400'} />
                          <span className={`text-sm font-medium ${selectedStatus[index] === 'better' ? 'text-green-700' : 'text-gray-700'}`}>
                            Đỡ hơn
                          </span>
                        </button>
                        <button
                          onClick={() => setSelectedStatus({ ...selectedStatus, [index]: 'resolved' })}
                          className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                            selectedStatus[index] === 'resolved'
                              ? 'border-green-600 bg-green-100'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          <CheckCircleIcon size={18} className={selectedStatus[index] === 'resolved' ? 'text-green-700' : 'text-gray-400'} />
                          <span className={`text-sm font-medium ${selectedStatus[index] === 'resolved' ? 'text-green-800' : 'text-gray-700'}`}>
                            Đã khỏi
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú (tùy chọn):
                      </label>
                      <textarea
                        value={feedbackNotes[index] || ''}
                        onChange={(e) => setFeedbackNotes({ ...feedbackNotes, [index]: e.target.value })}
                        placeholder="Mô tả thêm về tình trạng..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubmitFeedback(index)}
                        disabled={!selectedStatus[index] || isSubmittingFeedback[index]}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        {isSubmittingFeedback[index] ? 'Đang gửi...' : 'Gửi phản hồi'}
                      </button>
                      <button
                        onClick={() => {
                          setShowFeedbackForm({ ...showFeedbackForm, [index]: false })
                          setSelectedStatus({ ...selectedStatus, [index]: null })
                          setFeedbackNotes({ ...feedbackNotes, [index]: '' })
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Product View Modal - Show product details when clicking on product name */}
      {showProductViewModal && selectedProductForView && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProductViewModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Thông Tin Thuốc Đã Chọn</h3>
              <button
                onClick={() => setShowProductViewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-6 mb-6">
                {selectedProductForView.imageUrl ? (
                  <img
                    src={selectedProductForView.imageUrl}
                    alt={selectedProductForView.name}
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/products/placeholder.png'
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedProductForView.name}</h4>
                  <p className="text-gray-600 mb-4">{selectedProductForView.activeIngredient}</p>
                  {selectedProductForView.manufacturer && (
                    <p className="text-sm text-gray-500">Nhà sản xuất: {selectedProductForView.manufacturer}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedProductForView.targetDiseases && selectedProductForView.targetDiseases.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span>🦠</span>
                      <span>Dùng cho bệnh:</span>
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedProductForView.targetDiseases.map((disease, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                        >
                          {disease}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProductForView.targetCrops && selectedProductForView.targetCrops.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span>🌱</span>
                      <span>Dùng cho cây:</span>
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedProductForView.targetCrops.map((crop, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                        >
                          {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProductForView.dosage && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">💊 Liều lượng:</h5>
                    <p className="text-gray-700">{selectedProductForView.dosage}</p>
                  </div>
                )}

                {selectedProductForView.usage && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">📋 Cách sử dụng:</h5>
                    <p className="text-gray-700 whitespace-pre-line">{selectedProductForView.usage}</p>
                  </div>
                )}

                {selectedProductForView.frequency && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">⏰ Tần suất:</h5>
                    <p className="text-gray-700">{selectedProductForView.frequency}</p>
                  </div>
                )}

                {selectedProductForView.isolationPeriod && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">⏳ Thời gian cách ly:</h5>
                    <p className="text-gray-700">{selectedProductForView.isolationPeriod}</p>
                  </div>
                )}

                {selectedProductForView.precautions && selectedProductForView.precautions.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">⚠️ Lưu ý:</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedProductForView.precautions.map((precaution, idx) => (
                        <li key={idx}>{precaution}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProductForView.price && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">💰 Giá tham khảo:</h5>
                    <p className="text-gray-700">{selectedProductForView.price}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

