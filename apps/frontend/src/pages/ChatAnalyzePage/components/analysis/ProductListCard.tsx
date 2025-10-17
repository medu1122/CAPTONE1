import React from 'react'
import { ShoppingBagIcon, ExternalLinkIcon } from 'lucide-react'
import type { Product } from '../../types/analyze.types'
interface ProductListCardProps {
  products: Product[]
}
export const ProductListCard: React.FC<ProductListCardProps> = ({
  products,
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">Gợi ý sản phẩm & chăm sóc</h2>
        <p className="text-gray-500">Chưa có gợi ý. Hãy gửi mô tả hoặc ảnh.</p>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">Gợi ý sản phẩm & chăm sóc</h2>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex gap-4 border rounded-xl p-3">
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.note}</p>
              <div className="flex items-center justify-between">
                <span className="text-green-600 font-medium">
                  {product.price}
                </span>
                <button className="text-green-600 text-sm flex items-center gap-1 hover:underline">
                  <span>Xem chi tiết</span>
                  <ExternalLinkIcon size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
