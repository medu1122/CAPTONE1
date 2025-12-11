import React, { useState, useEffect } from 'react'
import { XIcon, Loader2Icon, CheckCircle2Icon, AlertCircleIcon, ClockIcon, LightbulbIcon, PackageIcon, ShieldCheckIcon, SproutIcon, BugIcon } from 'lucide-react'
import { analyzeTask } from '../../../services/plantBoxService'
import type { CareAction, PlantBox } from '../../MyPlantsPage/types/plantBox.types'

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  plantBoxId: string
  action: CareAction
  dayIndex: number
  actionIndex: number
  plantBox?: PlantBox | null
}

interface TaskAnalysis {
  analyzedAt: string
  detailedSteps: string[]
  materials: string[]
  precautions: string[]
  tips: string
  estimatedDuration: string
  dosageCalculation?: {
    baseDosage: string
    totalQuantity: string
    totalWater: string
    soilAdjustment: string
    finalDosage: string
    purchaseAmount: string
  }
  productDetails?: Array<{
    name: string
    targetDiseases: string[]
    targetCrops: string[]
  }>
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  plantBoxId,
  action,
  dayIndex,
  actionIndex,
  plantBox,
}) => {
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get product info from analysis.productDetails or selectedTreatments or action.products
  const getProductInfo = (productName: string) => {
    // Priority 1: Use productDetails from analysis (from backend)
    if (analysis?.productDetails) {
      const product = analysis.productDetails.find(
        p => p.name === productName || productName.includes(p.name) || p.name.includes(productName)
      )
      if (product) {
        return product
      }
    }
    
    // Priority 2: Search in selectedTreatments
    if (plantBox && plantBox.currentDiseases) {
      for (const disease of plantBox.currentDiseases) {
        if (disease.selectedTreatments?.chemical) {
          const product = disease.selectedTreatments.chemical.find(
            p => p.name === productName || productName.includes(p.name) || p.name.includes(productName)
          )
          if (product) {
            return {
              name: product.name,
              targetDiseases: [disease.name], // Use disease name from plantBox
              targetCrops: [plantBox.plantName], // Use plant name from plantBox
            }
          }
        }
      }
    }
    
    return null
  }
  
  // Get all products info from action
  const productsInfo = action.products
    ? action.products.map(p => {
        const productName = typeof p === 'string' ? p : p.name
        return getProductInfo(productName) || { name: productName, targetDiseases: [], targetCrops: [] }
      })
    : []

  useEffect(() => {
    if (isOpen && plantBoxId && dayIndex !== undefined && dayIndex !== null && actionIndex !== undefined && actionIndex !== null) {
      loadAnalysis()
    } else {
      setAnalysis(null)
      setError(null)
    }
  }, [isOpen, plantBoxId, dayIndex, actionIndex])

  const loadAnalysis = async () => {
    if (dayIndex === undefined || dayIndex === null || actionIndex === undefined || actionIndex === null) {
      setError('Thông tin task không hợp lệ')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      console.log('📡 [TaskDetailModal] Calling analyzeTask with:', { plantBoxId, dayIndex, actionIndex })
      const response = await analyzeTask(plantBoxId, dayIndex, actionIndex)
      if (response.success && response.data) {
        setAnalysis(response.data)
      } else {
        setError('Không thể phân tích công việc')
      }
    } catch (err: any) {
      console.error('Error analyzing task:', err)
      setError(err.message || 'Đã xảy ra lỗi khi phân tích công việc')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              📋 Hướng dẫn chi tiết
            </h2>
            <p className="text-sm text-gray-600">
              {action.time} - {action.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2Icon className="animate-spin text-green-600 mb-4" size={48} />
              <p className="text-gray-600">Đang phân tích công việc...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircleIcon className="text-red-500 mb-4" size={48} />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadAnalysis}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Dosage Calculation (if available) */}
              {analysis.dosageCalculation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <PackageIcon size={20} />
                    Tính toán liều lượng
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-blue-800">Liều lượng cơ bản:</span>
                      <p className="text-blue-700">{analysis.dosageCalculation.baseDosage}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">Tổng lượng thuốc/phân:</span>
                      <p className="text-blue-700">{analysis.dosageCalculation.totalQuantity}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">Tổng lượng nước:</span>
                      <p className="text-blue-700">{analysis.dosageCalculation.totalWater}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">Điều chỉnh theo đất:</span>
                      <p className="text-blue-700">{analysis.dosageCalculation.soilAdjustment}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">Liều lượng cuối cùng:</span>
                      <p className="text-blue-700 font-medium">{analysis.dosageCalculation.finalDosage}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">Lượng cần mua:</span>
                      <p className="text-blue-700 font-medium">{analysis.dosageCalculation.purchaseAmount}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Steps */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2Icon size={20} className="text-green-600" />
                  Các bước thực hiện
                </h3>
                <ol className="space-y-2">
                  {analysis.detailedSteps.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Materials */}
              {analysis.materials && analysis.materials.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <PackageIcon size={20} className="text-blue-600" />
                    Vật liệu cần thiết
                  </h3>
                  <ul className="space-y-2">
                    {analysis.materials.map((material, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{material}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Precautions */}
              {analysis.precautions && analysis.precautions.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ShieldCheckIcon size={20} className="text-orange-600" />
                    Lưu ý quan trọng
                  </h3>
                  <ul className="space-y-2">
                    {analysis.precautions.map((precaution, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <AlertCircleIcon size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>{precaution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {analysis.tips && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                    <LightbulbIcon size={20} />
                    Mẹo từ chuyên gia
                  </h3>
                  <p className="text-yellow-800">{analysis.tips}</p>
                </div>
              )}

              {/* Estimated Duration */}
              {analysis.estimatedDuration && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                  <ClockIcon size={20} className="text-gray-600" />
                  <div>
                    <span className="font-semibold text-gray-900">Thời gian ước tính: </span>
                    <span className="text-gray-700">{analysis.estimatedDuration}</span>
                  </div>
                </div>
              )}

              {/* Product Information - Target Diseases and Crops */}
              {action.products && action.products.length > 0 && productsInfo.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <PackageIcon size={20} />
                    Thông tin thuốc/sản phẩm
                  </h3>
                  <div className="space-y-4">
                    {productsInfo.map((productInfo, idx) => {
                      const productName = typeof action.products![idx] === 'string' 
                        ? action.products![idx] 
                        : action.products![idx].name
                      
                      return (
                        <div key={idx} className="bg-white border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">{productName}</h4>
                          
                          {productInfo.targetDiseases && productInfo.targetDiseases.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <BugIcon size={16} className="text-red-600" />
                                <span className="text-sm font-semibold text-gray-700">Dùng cho bệnh:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {productInfo.targetDiseases.map((disease, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                                  >
                                    {disease}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {productInfo.targetCrops && productInfo.targetCrops.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <SproutIcon size={16} className="text-green-600" />
                                <span className="text-sm font-semibold text-gray-700">Dùng cho cây:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {productInfo.targetCrops.map((crop, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                                  >
                                    {crop}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  )
}

