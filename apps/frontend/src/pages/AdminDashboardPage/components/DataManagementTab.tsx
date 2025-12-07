import React, { useState, useEffect } from 'react'
import { StatCard } from './StatCard'
import { adminService } from '../../../services/adminService'
import type { Product, BiologicalMethod, CulturalPractice, DataStats } from '../../../services/adminService'
import {
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  CheckIcon,
  AlertCircleIcon,
} from 'lucide-react'

type DataType = 'products' | 'biological' | 'cultural'

export const DataManagementTab: React.FC = () => {
  const [activeType, setActiveType] = useState<DataType>('products')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DataStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [biologicalMethods, setBiologicalMethods] = useState<BiologicalMethod[]>([])
  const [culturalPractices, setCulturalPractices] = useState<CulturalPractice[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | BiologicalMethod | CulturalPractice | null>(null)
  const [formData, setFormData] = useState<any>({})

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDataStats()
        setStats(data)
      } catch (error) {
        console.error('Error fetching data stats:', error)
      }
    }
    fetchStats()
  }, [])

  // Fetch data based on active type
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params: any = {
          page: pagination.page,
          limit: pagination.limit,
        }
        if (searchQuery) params.search = searchQuery

        if (activeType === 'products') {
          const response = await adminService.getProducts(params)
          setProducts(response.products)
          setPagination(response.pagination)
        } else if (activeType === 'biological') {
          const response = await adminService.getBiologicalMethods(params)
          setBiologicalMethods(response.methods)
          setPagination(response.pagination)
        } else if (activeType === 'cultural') {
          const response = await adminService.getCulturalPractices(params)
          setCulturalPractices(response.practices)
          setPagination(response.pagination)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeType, pagination.page, searchQuery])

  const handleCreate = () => {
    setEditingItem(null)
    setFormData({})
    setShowModal(true)
  }

  const handleEdit = (item: Product | BiologicalMethod | CulturalPractice) => {
    setEditingItem(item)
    setFormData({ ...item })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mục này?')) return

    try {
      if (activeType === 'products') {
        await adminService.deleteProduct(id)
        setProducts(products.filter((p) => p._id !== id))
      } else if (activeType === 'biological') {
        await adminService.deleteBiologicalMethod(id)
        setBiologicalMethods(biologicalMethods.filter((m) => m._id !== id))
      } else if (activeType === 'cultural') {
        await adminService.deleteCulturalPractice(id)
        setCulturalPractices(culturalPractices.filter((p) => p._id !== id))
      }
      // Refresh stats
      const data = await adminService.getDataStats()
      setStats(data)
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Có lỗi xảy ra khi xóa mục')
    }
  }

  const handleSubmit = async () => {
    try {
      if (activeType === 'products') {
        if (editingItem) {
          await adminService.updateProduct(editingItem._id, formData)
          setProducts(products.map((p) => (p._id === editingItem._id ? { ...p, ...formData } : p)))
        } else {
          const newProduct = await adminService.createProduct(formData)
          setProducts([newProduct, ...products])
        }
      } else if (activeType === 'biological') {
        if (editingItem) {
          await adminService.updateBiologicalMethod(editingItem._id, formData)
          setBiologicalMethods(
            biologicalMethods.map((m) => (m._id === editingItem._id ? { ...m, ...formData } : m))
          )
        } else {
          const newMethod = await adminService.createBiologicalMethod(formData)
          setBiologicalMethods([newMethod, ...biologicalMethods])
        }
      } else if (activeType === 'cultural') {
        if (editingItem) {
          await adminService.updateCulturalPractice(editingItem._id, formData)
          setCulturalPractices(
            culturalPractices.map((p) => (p._id === editingItem._id ? { ...p, ...formData } : p))
          )
        } else {
          const newPractice = await adminService.createCulturalPractice(formData)
          setCulturalPractices([newPractice, ...culturalPractices])
        }
      }

      // Refresh stats
      const data = await adminService.getDataStats()
      setStats(data)

      setShowModal(false)
      setEditingItem(null)
      setFormData({})
    } catch (error: any) {
      console.error('Error saving item:', error)
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu mục')
    }
  }

  const statCards = stats
    ? [
        {
          title: 'Tổng số thuốc',
          value: stats.products.total,
          icon: 'pill',
          color: 'blue' as const,
          subtext: `${stats.products.verified} đã xác thực`,
        },
        {
          title: 'Phương pháp sinh học',
          value: stats.biologicalMethods.total,
          icon: 'leaf',
          color: 'green' as const,
          subtext: `${stats.biologicalMethods.verified} đã xác thực`,
        },
        {
          title: 'Canh tác',
          value: stats.culturalPractices.total,
          icon: 'sprout',
          color: 'orange' as const,
          subtext: `${stats.culturalPractices.verified} đã xác thực`,
        },
        {
          title: 'Tổng cộng',
          value: stats.total,
          icon: 'database',
          color: 'purple' as const,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} data={stat} />
        ))}
      </div>

      {/* Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => {
                setActiveType('products')
                setPagination({ ...pagination, page: 1 })
                setSearchQuery('')
              }}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeType === 'products'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              💊 Thuốc hóa học
            </button>
            <button
              onClick={() => {
                setActiveType('biological')
                setPagination({ ...pagination, page: 1 })
                setSearchQuery('')
              }}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeType === 'biological'
                  ? 'text-green-600 border-green-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              🌱 Phương pháp sinh học
            </button>
            <button
              onClick={() => {
                setActiveType('cultural')
                setPagination({ ...pagination, page: 1 })
                setSearchQuery('')
              }}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeType === 'cultural'
                  ? 'text-orange-600 border-orange-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              🌾 Canh tác
            </button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <SearchIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <PlusIcon size={20} />
              <span>Thêm mới</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <>
            {activeType === 'products' && (
              <ProductsTable
                products={products}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            {activeType === 'biological' && (
              <BiologicalMethodsTable
                methods={biologicalMethods}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            {activeType === 'cultural' && (
              <CulturalPracticesTable
                practices={culturalPractices}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Trang {pagination.page} / {pagination.totalPages} ({pagination.total} mục)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <DataModal
          type={activeType}
          item={editingItem}
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            setShowModal(false)
            setEditingItem(null)
            setFormData({})
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// Products Table Component
const ProductsTable: React.FC<{
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}> = ({ products, onEdit, onDelete }) => {
  if (products.length === 0) {
    return <div className="p-8 text-center text-gray-500">Chưa có dữ liệu</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên thuốc</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoạt chất</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà sản xuất</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bệnh</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cây trồng</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{product.activeIngredient}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{product.manufacturer}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {product.targetDiseases.slice(0, 2).join(', ')}
                {product.targetDiseases.length > 2 && '...'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {product.targetCrops.slice(0, 2).join(', ')}
                {product.targetCrops.length > 2 && '...'}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    product.verified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {product.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <EditIcon size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(product._id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Biological Methods Table Component
const BiologicalMethodsTable: React.FC<{
  methods: BiologicalMethod[]
  onEdit: (method: BiologicalMethod) => void
  onDelete: (id: string) => void
}> = ({ methods, onEdit, onDelete }) => {
  if (methods.length === 0) {
    return <div className="p-8 text-center text-gray-500">Chưa có dữ liệu</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên phương pháp</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bệnh</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nguyên liệu</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {methods.map((method) => (
            <tr key={method._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{method.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {method.targetDiseases.slice(0, 2).join(', ')}
                {method.targetDiseases.length > 2 && '...'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 line-clamp-2 max-w-xs">
                {method.materials}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{method.timeframe}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    method.verified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {method.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(method)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <EditIcon size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(method._id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Cultural Practices Table Component
const CulturalPracticesTable: React.FC<{
  practices: CulturalPractice[]
  onEdit: (practice: CulturalPractice) => void
  onDelete: (id: string) => void
}> = ({ practices, onEdit, onDelete }) => {
  if (practices.length === 0) {
    return <div className="p-8 text-center text-gray-500">Chưa có dữ liệu</div>
  }

  const categoryLabels: Record<string, string> = {
    soil: 'Đất',
    water: 'Nước',
    fertilizer: 'Phân bón',
    light: 'Ánh sáng',
    spacing: 'Khoảng cách',
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Áp dụng cho</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ưu tiên</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {practices.map((practice) => (
            <tr key={practice._id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  {categoryLabels[practice.category]}
                </span>
              </td>
              <td className="px-6 py-4 font-medium text-gray-900">{practice.action}</td>
              <td className="px-6 py-4 text-sm text-gray-600 line-clamp-2 max-w-xs">
                {practice.description}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {practice.applicableTo.slice(0, 2).join(', ')}
                {practice.applicableTo.length > 2 && '...'}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    practice.priority === 'High'
                      ? 'bg-red-100 text-red-700'
                      : practice.priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {practice.priority === 'High' ? 'Cao' : practice.priority === 'Medium' ? 'Trung bình' : 'Thấp'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    practice.verified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {practice.verified ? 'Đã xác thực' : 'Chưa xác thực'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(practice)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <EditIcon size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(practice._id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Modal Component for Create/Edit
const DataModal: React.FC<{
  type: DataType
  item: Product | BiologicalMethod | CulturalPractice | null
  formData: any
  setFormData: (data: any) => void
  onClose: () => void
  onSubmit: () => void
}> = ({ type, item, formData, setFormData, onClose, onSubmit }) => {
  const isEditing = !!item

  if (type === 'products') {
    return (
      <ProductModal
        product={item as Product | null}
        formData={formData}
        setFormData={setFormData}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
  } else if (type === 'biological') {
    return (
      <BiologicalMethodModal
        method={item as BiologicalMethod | null}
        formData={formData}
        setFormData={setFormData}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
  } else {
    return (
      <CulturalPracticeModal
        practice={item as CulturalPractice | null}
        formData={formData}
        setFormData={setFormData}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
  }
}

// Product Modal
const ProductModal: React.FC<{
  product: Product | null
  formData: any
  setFormData: (data: any) => void
  onClose: () => void
  onSubmit: () => void
}> = ({ product, formData, setFormData, onClose, onSubmit }) => {
  const handleArrayChange = (field: string, value: string) => {
    const items = value.split(',').map((item) => item.trim()).filter(Boolean)
    setFormData({ ...formData, [field]: items })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">
            {product ? 'Chỉnh sửa thuốc' : 'Thêm thuốc mới'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XIcon size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên thuốc *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hoạt chất *</label>
            <input
              type="text"
              value={formData.activeIngredient || ''}
              onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhà sản xuất *</label>
            <input
              type="text"
              value={formData.manufacturer || ''}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bệnh (phân cách bằng dấu phẩy) *
            </label>
            <input
              type="text"
              value={(formData.targetDiseases || []).join(', ')}
              onChange={(e) => handleArrayChange('targetDiseases', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ví dụ: Bệnh đốm lá, Bệnh thối rễ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cây trồng (phân cách bằng dấu phẩy) *
            </label>
            <input
              type="text"
              value={(formData.targetCrops || []).join(', ')}
              onChange={(e) => handleArrayChange('targetCrops', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ví dụ: Lúa, Ngô"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Liều lượng *</label>
            <textarea
              value={formData.dosage || ''}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cách sử dụng *</label>
            <textarea
              value={formData.usage || ''}
              onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá</label>
              <input
                type="text"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL hình ảnh</label>
              <input
                type="url"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn *</label>
            <input
              type="text"
              value={formData.source || ''}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verified"
              checked={formData.verified || false}
              onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="verified" className="text-sm font-medium text-gray-700">
              Đã xác thực
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {product ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Biological Method Modal
const BiologicalMethodModal: React.FC<{
  method: BiologicalMethod | null
  formData: any
  setFormData: (data: any) => void
  onClose: () => void
  onSubmit: () => void
}> = ({ method, formData, setFormData, onClose, onSubmit }) => {
  const handleArrayChange = (field: string, value: string) => {
    const items = value.split(',').map((item) => item.trim()).filter(Boolean)
    setFormData({ ...formData, [field]: items })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">
            {method ? 'Chỉnh sửa phương pháp sinh học' : 'Thêm phương pháp sinh học mới'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XIcon size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên phương pháp *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bệnh (phân cách bằng dấu phẩy) *
            </label>
            <input
              type="text"
              value={(formData.targetDiseases || []).join(', ')}
              onChange={(e) => handleArrayChange('targetDiseases', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ví dụ: Bệnh đốm lá, Bệnh thối rễ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nguyên liệu *</label>
            <textarea
              value={formData.materials || ''}
              onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Các bước thực hiện *</label>
            <textarea
              value={formData.steps || ''}
              onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian *</label>
            <input
              type="text"
              value={formData.timeframe || ''}
              onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ví dụ: 7-14 ngày"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hiệu quả *</label>
            <textarea
              value={formData.effectiveness || ''}
              onChange={(e) => setFormData({ ...formData, effectiveness: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn *</label>
            <input
              type="text"
              value={formData.source || ''}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verified"
              checked={formData.verified || false}
              onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="verified" className="text-sm font-medium text-gray-700">
              Đã xác thực
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {method ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Cultural Practice Modal
const CulturalPracticeModal: React.FC<{
  practice: CulturalPractice | null
  formData: any
  setFormData: (data: any) => void
  onClose: () => void
  onSubmit: () => void
}> = ({ practice, formData, setFormData, onClose, onSubmit }) => {
  const handleArrayChange = (field: string, value: string) => {
    const items = value.split(',').map((item) => item.trim()).filter(Boolean)
    setFormData({ ...formData, [field]: items })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">
            {practice ? 'Chỉnh sửa canh tác' : 'Thêm canh tác mới'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XIcon size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại *</label>
            <select
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Chọn loại</option>
              <option value="soil">Đất</option>
              <option value="water">Nước</option>
              <option value="fertilizer">Phân bón</option>
              <option value="light">Ánh sáng</option>
              <option value="spacing">Khoảng cách</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hành động *</label>
            <input
              type="text"
              value={formData.action || ''}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ưu tiên *</label>
            <select
              value={formData.priority || 'Medium'}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="High">Cao</option>
              <option value="Medium">Trung bình</option>
              <option value="Low">Thấp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Áp dụng cho (phân cách bằng dấu phẩy) *
            </label>
            <input
              type="text"
              value={(formData.applicableTo || []).join(', ')}
              onChange={(e) => handleArrayChange('applicableTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ví dụ: Lúa, Ngô, Rau"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn *</label>
            <input
              type="text"
              value={formData.source || ''}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verified"
              checked={formData.verified || false}
              onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="verified" className="text-sm font-medium text-gray-700">
              Đã xác thực
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {practice ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  )
}

