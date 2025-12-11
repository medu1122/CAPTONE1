import React, { useState, useEffect } from 'react'
import { XIcon, InfoIcon, CheckIcon, Loader2Icon } from 'lucide-react'
import { getTreatmentRecommendations } from '../../../services/treatmentService'
import type { ChemicalTreatment, BiologicalTreatment, CulturalTreatment } from '../../MyPlantsPage/types/plantBox.types'

interface TreatmentRecommendationsCardProps {
  plantBoxId: string
  diseaseName: string
  plantName: string
  diseaseIndex: number
  onSelectTreatments: (diseaseIndex: number, treatments: {
    chemical?: ChemicalTreatment[]
  }) => void
  onClose: () => void
}

export const TreatmentRecommendationsCard: React.FC<TreatmentRecommendationsCardProps> = ({
  plantBoxId,
  diseaseName,
  plantName,
  diseaseIndex,
  onSelectTreatments,
  onClose,
}) => {
  const [loading, setLoading] = useState(true)
  const [treatments, setTreatments] = useState<{
    chemical: ChemicalTreatment[]
    biological: BiologicalTreatment[]
    cultural: CulturalTreatment[]
  }>({
    chemical: [],
    biological: [],
    cultural: [],
  })
  const [selectedTreatments, setSelectedTreatments] = useState<{
    chemical: ChemicalTreatment[]
  }>({
    chemical: [],
  })
  const [selectedProduct, setSelectedProduct] = useState<ChemicalTreatment | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  useEffect(() => {
    loadRecommendations()
  }, [diseaseName, plantName])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const recommendations = await getTreatmentRecommendations(diseaseName, plantName)
      
      const chemical: ChemicalTreatment[] = []
      const biological: BiologicalTreatment[] = []
      const cultural: CulturalTreatment[] = []

      recommendations.forEach((rec) => {
        if (rec.type === 'chemical') {
          rec.items.forEach((item: any) => {
            chemical.push({
              name: item.name,
              activeIngredient: item.activeIngredient,
              manufacturer: item.manufacturer,
              dosage: item.dosage,
              usage: item.usage,
              frequency: item.frequency,
              isolationPeriod: item.isolationPeriod,
              precautions: item.precautions,
              imageUrl: item.imageUrl,
              price: item.price,
              targetDiseases: item.targetDiseases || [],
              targetCrops: item.targetCrops || [],
            })
          })
        } else if (rec.type === 'biological') {
          rec.items.forEach((item: any) => {
            biological.push({
              name: item.name,
              materials: item.materials,
              steps: item.steps,
              timeframe: item.timeframe,
              effectiveness: item.effectiveness,
            })
          })
        } else if (rec.type === 'cultural') {
          rec.items.forEach((item: any) => {
            cultural.push({
              name: item.name,
              action: item.action,
              description: item.description,
              priority: item.priority,
            })
          })
        }
      })

      setTreatments({ chemical, biological, cultural })
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleChemical = (product: ChemicalTreatment) => {
    setSelectedTreatments((prev) => {
      const isSelected = prev.chemical.some((p) => p.name === product.name)
      return {
        ...prev,
        chemical: isSelected
          ? prev.chemical.filter((p) => p.name !== product.name)
          : [...prev.chemical, product],
      }
    })
  }

  const handleSave = () => {
    // Only save chemical treatments (user selection)
    // Biological and cultural will be auto-suggested by bot
    onSelectTreatments(diseaseIndex, {
      chemical: selectedTreatments.chemical,
    })
    onClose()
  }

  if (loading) {
    return (
      <div className="border border-blue-200 rounded-lg p-6 bg-blue-50 mb-4">
        <div className="flex items-center justify-center py-8">
          <Loader2Icon className="animate-spin text-blue-600 mr-3" size={24} />
          <span className="text-gray-700">Đang tải gợi ý điều trị...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-blue-200 rounded-lg p-6 bg-blue-50 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-blue-900 mb-1">
            💊 Chọn thuốc điều trị cho bệnh: {diseaseName}
          </h4>
          <p className="text-sm text-gray-600">
            Chọn thuốc hóa học bạn muốn sử dụng. Phương pháp sinh học và canh tác sẽ được bot tự động gợi ý.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-blue-100 rounded"
        >
          <XIcon size={16} className="text-blue-600" />
        </button>
      </div>

      {treatments.chemical.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Không tìm thấy thuốc điều trị cho bệnh này
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chemical Treatments */}
          {treatments.chemical.length > 0 && (
            <div>
              <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📦</span>
                <span>Thuốc Hóa Học ({treatments.chemical.length})</span>
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {treatments.chemical.map((product, idx) => {
                  const isSelected = selectedTreatments.chemical.some((p) => p.name === product.name)
                  return (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-100'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                      onClick={() => toggleChemical(product)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <CheckIcon size={14} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h6 className="font-semibold text-gray-900 mb-1">{product.name}</h6>
                          <p className="text-xs text-gray-600 mb-2">{product.activeIngredient}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProduct(product)
                                setShowProductModal(true)
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <InfoIcon size={12} />
                              <span>Chi tiết</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-2 pt-4 border-t border-blue-200">
            <button
              onClick={handleSave}
              disabled={selectedTreatments.chemical.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lưu lựa chọn thuốc ({selectedTreatments.chemical.length})
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProductModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Chi Tiết Sản Phẩm</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-6 mb-6">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
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
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h4>
                  <p className="text-gray-600 mb-4">{selectedProduct.activeIngredient}</p>
                  {selectedProduct.manufacturer && (
                    <p className="text-sm text-gray-500">Nhà sản xuất: {selectedProduct.manufacturer}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Target Diseases and Crops */}
                {(selectedProduct.targetDiseases && selectedProduct.targetDiseases.length > 0) || 
                 (selectedProduct.targetCrops && selectedProduct.targetCrops.length > 0) ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    {selectedProduct.targetDiseases && selectedProduct.targetDiseases.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <span>🦠</span>
                          <span>Dùng cho bệnh:</span>
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.targetDiseases.map((disease, idx) => (
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
                    
                    {selectedProduct.targetCrops && selectedProduct.targetCrops.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <span>🌱</span>
                          <span>Dùng cho cây:</span>
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.targetCrops.map((crop, idx) => (
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
                  </div>
                ) : null}

                {selectedProduct.dosage && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">💊 Liều lượng:</h5>
                    <p className="text-gray-700">{selectedProduct.dosage}</p>
                  </div>
                )}

                {selectedProduct.usage && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">📋 Cách sử dụng:</h5>
                    <p className="text-gray-700 whitespace-pre-line">{selectedProduct.usage}</p>
                  </div>
                )}

                {selectedProduct.frequency && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">⏰ Tần suất:</h5>
                    <p className="text-gray-700">{selectedProduct.frequency}</p>
                  </div>
                )}

                {selectedProduct.isolationPeriod && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">⏳ Thời gian cách ly:</h5>
                    <p className="text-gray-700">{selectedProduct.isolationPeriod}</p>
                  </div>
                )}

                {selectedProduct.precautions && selectedProduct.precautions.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">⚠️ Lưu ý:</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedProduct.precautions.map((precaution, idx) => (
                        <li key={idx}>{precaution}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProduct.price && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">💰 Giá tham khảo:</h5>
                    <p className="text-gray-700">{selectedProduct.price}</p>
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

