import React, { useState } from 'react'
import { XIcon, InfoIcon, AlertCircleIcon } from 'lucide-react'
import type { AnalysisResult } from '../types'
import { ComplaintModal } from '../../../components/ComplaintModal'
import { DiseaseTooltip } from './DiseaseTooltip'

interface TreatmentPanelProps {
  result: AnalysisResult
}

export const TreatmentPanel: React.FC<TreatmentPanelProps> = ({ result }) => {
  const [selectedDisease, setSelectedDisease] = useState<string | null>(
    result.diseases[0]?.name || null,
  )
  const [selectedProduct, setSelectedProduct] = useState<any>(null) // Product for modal
  const [showModal, setShowModal] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)

  const selectedTreatment = selectedDisease ? result.treatments[selectedDisease] : null
  
  // Extract treatment arrays (selectedTreatment is an array of {type, title, items})
  const chemicalTreatments = selectedTreatment?.find((t: any) => t.type === 'chemical')?.items || []
  const biologicalMethods = selectedTreatment?.find((t: any) => t.type === 'biological')?.items || []
  const culturalPractices = selectedTreatment?.find((t: any) => t.type === 'cultural')?.items || []

  if (!result.diseases || result.diseases.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>💊</span>
          Gợi ý Điều trị & Khắc phục
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Không phát hiện bệnh. Cây đang khỏe mạnh!
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>💊</span>
        Gợi ý Điều trị & Khắc phục
      </h2>

      {/* Disease Selection Tabs */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 mb-3 font-semibold">
          🦠 Những bệnh có thể mắc phải (sắp xếp từ cao → thấp):
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2">
        {result.diseases.map((disease) => {
          // Get icon based on disease type
          const getIcon = (name: string) => {
            const n = name.toLowerCase()
            if (n.includes('nấm') || n.includes('fungi') || n.includes('mold')) return '🦠'
            if (n.includes('động vật') || n.includes('côn trùng') || n.includes('insect') || n.includes('animalia')) return '🐛'
            if (n.includes('thiếu') || n.includes('deficiency') || n.includes('nutrient')) return '🌱'
            if (n.includes('vi khuẩn') || n.includes('bacteria')) return '🦠'
            if (n.includes('virus')) return '🔴'
            return '⚠️'
          }
          
          return (
            <DiseaseTooltip
              key={disease.name}
              diseaseName={disease.name}
              plantName={result.plant?.commonName}
              enabled={true} // Always enabled in TreatmentPanel since analysis is complete
            >
              <button
                onClick={() => setSelectedDisease(disease.name)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 group ${
                  selectedDisease === disease.name
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{getIcon(disease.name)}</span>
                <span>
                  <span className="font-semibold">Bệnh: </span>
                  {disease.name}
                </span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  selectedDisease === disease.name 
                    ? 'bg-white text-green-700' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {Math.round(disease.confidence * 100)}%
                </span>
                <InfoIcon 
                  className={`ml-1 opacity-0 group-hover:opacity-60 transition-opacity ${
                    selectedDisease === disease.name ? 'text-white' : 'text-gray-500'
                  }`} 
                  size={14} 
                />
              </button>
            </DiseaseTooltip>
          )
        })}
        </div>
      </div>

      {/* Treatment Sections */}
      {selectedTreatment && (chemicalTreatments.length > 0 || biologicalMethods.length > 0 || culturalPractices.length > 0) ? (
        <div className="space-y-6">
          {/* 📦 1. THUỐC HÓA HỌC */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📦</span>
              <span>Thuốc Hóa Học Có Thể Sử Dụng</span>
              {chemicalTreatments.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {chemicalTreatments.length}
                </span>
              )}
            </h3>
            {chemicalTreatments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {chemicalTreatments.map((product: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white"
                    onClick={() => {
                      setSelectedProduct(product)
                      setShowModal(true)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/products/placeholder.png'
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center border border-gray-200 dark:border-gray-700">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{product.activeIngredient}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <InfoIcon size={14} />
                          <span>Click để xem chi tiết</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                <p className="text-gray-600 dark:text-gray-300">Chưa tìm được thuốc phù hợp</p>
              </div>
            )}
          </div>

          {/* 🌿 2. PHƯƠNG PHÁP SINH HỌC */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🌿</span>
              <span>Phương Pháp Sinh Học Phù Hợp</span>
              {biologicalMethods.length > 0 && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  {biologicalMethods.length}
                </span>
              )}
            </h3>
            {biologicalMethods.length > 0 ? (
              <div className="space-y-3">
                {biologicalMethods.map((method: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-green-200 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">{method.name}</h4>
                    {method.description && (
                      <p className="text-sm text-gray-700 mb-2">{method.description}</p>
                    )}
                    {method.materials && (
                      <p className="text-xs text-gray-600 mb-1">
                        <strong>Nguyên liệu:</strong> {method.materials}
                      </p>
                    )}
                    {method.timeframe && (
                      <p className="text-xs text-gray-600 mb-1">
                        <strong>Thời gian:</strong> {method.timeframe}
                      </p>
                    )}
                    {method.effectiveness && (
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        <strong>Hiệu quả:</strong> {method.effectiveness}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                <p className="text-gray-600 dark:text-gray-300">Chưa tìm được phương pháp sinh học phù hợp</p>
              </div>
            )}
          </div>

          {/* 🌾 3. BIỆN PHÁP CANH TÁC */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🌾</span>
              <span>Biện Pháp Canh Tác Phù Hợp</span>
              {culturalPractices.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                  {culturalPractices.length}
                </span>
              )}
            </h3>
            {culturalPractices.length > 0 ? (
              <div className="space-y-3">
                {culturalPractices.map((practice: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-amber-200 rounded-lg p-4 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">{practice.name}</h4>
                    {practice.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-200">{practice.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                <p className="text-gray-600 dark:text-gray-300">Chưa tìm được biện pháp canh tác phù hợp</p>
              </div>
            )}
          </div>
        </div>
      ) : selectedTreatment ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Chưa có thông tin điều trị cho bệnh này
        </div>
      ) : null}

      {/* Product Detail Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Chi Tiết Sản Phẩm</h3>
              <button
                onClick={() => setShowModal(false)}
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
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/products/placeholder.png'
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h4>
                  <p className="text-gray-600 mb-4">{selectedProduct.activeIngredient}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nhà sản xuất: {selectedProduct.manufacturer}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">🌱 Dùng cho cây:</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.targetCrops?.map((crop: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">🦠 Dùng cho bệnh:</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.targetDiseases?.map((disease: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedProduct.dosage && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">💊 Liều lượng:</h5>
                    <p className="text-gray-700 dark:text-gray-200">{selectedProduct.dosage}</p>
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
                    <p className="text-gray-700 dark:text-gray-200">{selectedProduct.frequency}</p>
                  </div>
                )}

                {selectedProduct.isolationPeriod && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">⏳ Thời gian cách ly:</h5>
                    <p className="text-gray-700 dark:text-gray-200">{selectedProduct.isolationPeriod}</p>
                  </div>
                )}

                {selectedProduct.precautions && selectedProduct.precautions.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">⚠️ Lưu ý:</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-200">
                      {selectedProduct.precautions.map((precaution: string, idx: number) => (
                        <li key={idx}>{precaution}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProduct.price && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">💰 Giá tham khảo:</h5>
                    <p className="text-gray-700 dark:text-gray-200">{selectedProduct.price}</p>
                  </div>
                )}

                {selectedProduct.source && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nguồn: {selectedProduct.source}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Button */}
      {result.analysisId && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowComplaintModal(true)}
            className="w-full px-4 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
          >
            <AlertCircleIcon size={18} />
            <span>Báo cáo vấn đề với kết quả phân tích</span>
          </button>
        </div>
      )}

      {/* Complaint Modal */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        type="analysis"
        relatedId={result.analysisId}
        relatedType="analysis"
        onSuccess={() => {
          alert('Cảm ơn bạn đã gửi khiếu nại. Chúng tôi sẽ xem xét và phản hồi sớm nhất!')
        }}
      />
    </div>
  )
}

