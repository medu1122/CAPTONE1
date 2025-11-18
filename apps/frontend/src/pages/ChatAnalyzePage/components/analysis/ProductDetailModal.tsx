import React from 'react'
import { X, FileText, FlaskConical, Clock, AlertTriangle, PackageIcon } from 'lucide-react'
import type { AdditionalInfo } from '../../types/analyze.types'

interface ProductDetailModalProps {
  isOpen: boolean
  onClose: () => void
  product: AdditionalInfo | null
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  if (!isOpen || !product) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{product.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Đóng"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Image */}
            {product.imageUrl && (
              <div className="flex justify-center">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-48 h-48 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.png'
                  }}
                />
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{product.summary}</p>
            </div>

            {/* Details */}
            {product.details && (
              <div className="space-y-6">
                {/* Usage */}
                {product.details.usage && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={20} className="text-green-600" />
                      <h3 className="font-medium text-gray-900">Cách sử dụng</h3>
                    </div>
                    <div className="pl-7">
                      <p className="text-gray-700 whitespace-pre-line">
                        {product.details.usage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dosage */}
                {product.details.dosage && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FlaskConical size={20} className="text-blue-600" />
                      <h3 className="font-medium text-gray-900">Liều lượng</h3>
                    </div>
                    <div className="pl-7">
                      <p className="text-gray-700 font-medium">{product.details.dosage}</p>
                    </div>
                  </div>
                )}

                {/* Frequency */}
                {product.details.frequency && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={20} className="text-purple-600" />
                      <h3 className="font-medium text-gray-900">Tần suất</h3>
                    </div>
                    <div className="pl-7">
                      <p className="text-gray-700">{product.details.frequency}</p>
                    </div>
                  </div>
                )}

                {/* Precautions */}
                {product.details.precautions && product.details.precautions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={20} className="text-amber-600" />
                      <h3 className="font-medium text-gray-900">Lưu ý quan trọng</h3>
                    </div>
                    <div className="pl-7">
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        {product.details.precautions.map((precaution, index) => (
                          <li key={index}>{precaution}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Isolation Period */}
                {product.details.isolation && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900 mb-1">Thời gian cách ly</p>
                        <p className="text-amber-800 text-sm">{product.details.isolation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Source */}
                {product.details.source && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <PackageIcon size={20} className="text-gray-600" />
                      <h3 className="font-medium text-gray-900">Nguồn tham khảo</h3>
                    </div>
                    <div className="pl-7">
                      <p className="text-gray-600 text-sm">{product.details.source}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

