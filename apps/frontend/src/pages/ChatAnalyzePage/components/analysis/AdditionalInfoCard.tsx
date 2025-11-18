import React, { useState } from 'react'
import { Eye, BookOpen, HelpCircle, Package, AlertCircle } from 'lucide-react'
import type { AdditionalInfo } from '../../types/analyze.types'
import { ProductDetailModal } from './ProductDetailModal'

interface AdditionalInfoCardProps {
  items: AdditionalInfo[]
}

export const AdditionalInfoCard: React.FC<AdditionalInfoCardProps> = ({ items }) => {
  const [selectedProduct, setSelectedProduct] = useState<AdditionalInfo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleItemClick = (item: AdditionalInfo) => {
    setSelectedProduct(item)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedProduct(null), 300) // Delay to allow modal animation
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">📚 Thông tin Bổ sung</h2>
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <AlertCircle size={32} className="text-gray-400 mb-2" />
          <p className="text-gray-500 text-center">
            Chưa có thông tin bổ sung
          </p>
        </div>
      </div>
    )
  }

  // Get icon by type
  const getIcon = (type: string) => {
    switch (type) {
      case 'product':
        return Package
      case 'guide':
        return BookOpen
      case 'faq':
        return HelpCircle
      default:
        return BookOpen
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">📚 Thông tin Bổ sung</h2>

        <div className="space-y-3">
          {items.map((item, index) => {
            const Icon = getIcon(item.type)

            return (
              <div
                key={index}
                onClick={() => handleItemClick(item)}
                className="
                  flex items-center gap-4 p-4 border border-gray-200 rounded-lg
                  hover:bg-gray-50 hover:border-green-300 cursor-pointer
                  transition-all duration-200
                  group
                "
              >
                {/* Image or Icon */}
                <div className="flex-shrink-0">
                  {item.imageUrl ? (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gray-200">
                              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                              </svg>
                            </div>
                          `
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon size={28} className="text-green-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.summary}</p>
                </div>

                {/* View Details Button */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-1 text-green-600 text-sm font-medium group-hover:gap-2 transition-all">
                    <Eye size={16} />
                    <span className="hidden sm:inline">Xem chi tiết</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </>
  )
}

