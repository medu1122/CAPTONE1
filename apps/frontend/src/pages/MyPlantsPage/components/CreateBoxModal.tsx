import React, { useState, useEffect } from 'react'
import { XIcon, MapPinIcon, Loader2Icon, NavigationIcon } from 'lucide-react'
import type { CreatePlantBoxData } from '../types/plantBox.types'
import { geolocationService } from '../../../services/geolocationService'
import { vietnamProvinces, getProvinceByCoordinates } from '../../../data/vietnamProvinces'
interface CreateBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreatePlantBoxData) => Promise<void>
}
export const CreateBoxModal: React.FC<CreateBoxModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'options'>(
    'basic',
  )
  const [formData, setFormData] = useState<CreatePlantBoxData>({
    name: '',
    type: 'active',
    plantName: '',
    scientificName: '',
    plantedDate: '',
    plannedDate: '',
    location: {
      name: '',
      area: undefined,
      soilType: '',
      sunlight: 'full',
    },
    quantity: 1,
    growthStage: 'seed',
    specialRequirements: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [detailAddress, setDetailAddress] = useState<string>('')

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true)
    setLocationError(null)

    try {
      const position = await geolocationService.getCurrentPosition()
      const locationName = await geolocationService.getLocationName(
        position.lat,
        position.lon
      )

      // Try to find matching province
      const province = getProvinceByCoordinates(position.lat, position.lon)
      
      setFormData((prev) => {
        const currentDetailAddress = detailAddress || prev.location.name.split(',')[0]?.trim() || ''
        
        if (province) {
          setSelectedProvince(province.code)
          return {
            ...prev,
            location: {
              ...prev.location,
              name: currentDetailAddress 
                ? `${currentDetailAddress}, ${province.name}`
                : province.name,
              coordinates: {
                lat: position.lat,
                lng: position.lon,
              },
            },
          }
        } else {
          // If no province found, use location name from API
          return {
            ...prev,
            location: {
              ...prev.location,
              name: currentDetailAddress 
                ? `${currentDetailAddress}, ${locationName}`
                : locationName,
              coordinates: {
                lat: position.lat,
                lng: position.lon,
              },
            },
          }
        }
      })
    } catch (error: any) {
      console.error('Error getting location:', error)
      setLocationError(
        error.type === 'PERMISSION_DENIED'
          ? 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng chọn tỉnh thành thủ công.'
          : 'Không thể lấy vị trí hiện tại. Vui lòng chọn tỉnh thành thủ công.'
      )
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleProvinceChange = (provinceCode: string) => {
    setSelectedProvince(provinceCode)
    const province = vietnamProvinces.find((p) => p.code === provinceCode)
    if (province) {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          name: detailAddress 
            ? `${detailAddress}, ${province.name}`
            : province.name,
          coordinates: {
            lat: province.coordinates.lat,
            lng: province.coordinates.lng,
          },
        },
      }))
    }
  }

  // Auto-detect location when location tab is opened
  useEffect(() => {
    if (isOpen && activeTab === 'location' && !formData.location.coordinates && !selectedProvince) {
      handleGetCurrentLocation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab])

  // Update location name when detail address or province changes
  useEffect(() => {
    if (selectedProvince) {
      const province = vietnamProvinces.find((p) => p.code === selectedProvince)
      if (province) {
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            name: detailAddress 
              ? `${detailAddress}, ${province.name}`
              : province.name,
          },
        }))
      }
    }
  }, [detailAddress, selectedProvince])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.location.name || formData.location.name.trim() === '') {
      alert('Vui lòng chọn tỉnh/thành phố hoặc lấy vị trí hiện tại')
      setActiveTab('location')
      return
    }
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên box')
      setActiveTab('basic')
      return
    }
    
    if (!formData.plantName.trim()) {
      alert('Vui lòng nhập tên cây')
      setActiveTab('basic')
      return
    }
    
    if (formData.type === 'active' && !formData.plantedDate) {
      alert('Vui lòng chọn ngày trồng')
      setActiveTab('basic')
      return
    }
    
    if (formData.type === 'planned' && !formData.plannedDate) {
      alert('Vui lòng chọn ngày dự định')
      setActiveTab('basic')
      return
    }
    
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
      // Reset form
      setFormData({
        name: '',
        type: 'active',
        plantName: '',
        scientificName: '',
        plantedDate: '',
        plannedDate: '',
        location: {
          name: '',
          area: undefined,
          soilType: undefined,
          sunlight: 'full',
        },
        quantity: 1,
        growthStage: 'seed',
        specialRequirements: '',
      })
      setSelectedProvince('')
      setDetailAddress('')
      setLocationError(null)
    } catch (error: any) {
      console.error('Error creating box:', error)
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.errors?.[0]?.message ||
                          error?.message ||
                          'Không thể tạo plant box. Vui lòng thử lại.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Tạo Plant Box mới</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            {
              id: 'basic',
              label: 'Thông tin cơ bản',
            },
            {
              id: 'location',
              label: 'Vị trí',
            },
            {
              id: 'options',
              label: 'Tùy chọn',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${activeTab === tab.id ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === 'basic' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên box <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Cà chua vườn sau"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="active"
                      checked={formData.type === 'active'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as 'active' | 'planned',
                        })
                      }
                      className="mr-2"
                    />
                    <span>Đang trồng</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="planned"
                      checked={formData.type === 'planned'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as 'active' | 'planned',
                        })
                      }
                      className="mr-2"
                    />
                    <span>Dự định trồng</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên cây <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.plantName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      plantName: e.target.value,
                    })
                  }
                  placeholder="Cà chua"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên khoa học (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formData.scientificName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scientificName: e.target.value,
                    })
                  }
                  placeholder="Solanum lycopersicum"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'active' ? 'Ngày trồng' : 'Ngày dự định'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={
                    formData.type === 'active'
                      ? formData.plantedDate
                      : formData.plannedDate
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [formData.type === 'active'
                        ? 'plantedDate'
                        : 'plannedDate']: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </>
          )}

          {activeTab === 'location' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỉnh/Thành phố <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">-- Chọn tỉnh/thành phố --</option>
                  {vietnamProvinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2Icon size={16} className="animate-spin" />
                      <span>Đang lấy vị trí...</span>
                    </>
                  ) : (
                    <>
                      <NavigationIcon size={16} />
                      <span>Lấy vị trí hiện tại</span>
                    </>
                  )}
                </button>
                {locationError && (
                  <p className="text-sm text-red-600 flex-1">{locationError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ chi tiết (tùy chọn)
                </label>
                <input
                  type="text"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="Ví dụ: Vườn sau nhà, Phường 1, Quận 1..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Địa chỉ chi tiết sẽ được thêm vào trước tên tỉnh/thành phố
                </p>
              </div>

              {formData.location.coordinates && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <MapPinIcon size={14} className="inline mr-1" />
                    Tọa độ: {formData.location.coordinates.lat.toFixed(6)},{' '}
                    {formData.location.coordinates.lng.toFixed(6)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diện tích (m²)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.location.area || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        area: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      },
                    })
                  }
                  placeholder="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại đất
                </label>
                <select
                  value={formData.location.soilType || 'unknown'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        soilType: e.target.value === 'unknown' ? undefined : e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="unknown">❓ Không biết / Chưa xác định</option>
                  <option value="Đất phù sa">🌾 Đất phù sa</option>
                  <option value="Đất pha cát">🏖️ Đất pha cát</option>
                  <option value="Đất thịt">🌱 Đất thịt</option>
                  <option value="Đất sét">🟤 Đất sét</option>
                  <option value="Đất đỏ bazan">🔴 Đất đỏ bazan</option>
                  <option value="Đất phèn">🟡 Đất phèn</option>
                  <option value="Đất mặn">🧂 Đất mặn</option>
                  <option value="Đất cát">🏜️ Đất cát</option>
                  <option value="Đất thịt nhẹ">🌿 Đất thịt nhẹ</option>
                  <option value="Đất thịt nặng">🌳 Đất thịt nặng</option>
                  <option value="Đất đen">⚫ Đất đen</option>
                  <option value="Đất xám">⚪ Đất xám</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Chọn loại đất phù hợp. Nếu không chắc, chọn "Không biết" - hệ thống sẽ tự động phân tích
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ánh sáng
                </label>
                <select
                  value={formData.location.sunlight || 'full'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        sunlight: e.target.value as
                          | 'full'
                          | 'partial'
                          | 'shade',
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="full">☀️ Đầy đủ (Full sun)</option>
                  <option value="partial">⛅ Một phần (Partial sun)</option>
                  <option value="shade">🌥️ Bóng râm (Shade)</option>
                </select>
              </div>

            </>
          )}

          {activeTab === 'options' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value),
                      })
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-600">cây</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giai đoạn
                </label>
                <select
                  value={formData.growthStage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      growthStage: e.target
                        .value as CreatePlantBoxData['growthStage'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="seed">Hạt giống</option>
                  <option value="seedling">Cây con</option>
                  <option value="vegetative">Sinh trưởng</option>
                  <option value="flowering">Ra hoa</option>
                  <option value="fruiting">Kết trái</option>
                  <option value="harvest">Thu hoạch</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú / Yêu cầu đặc biệt
                </label>
                <textarea
                  value={formData.specialRequirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialRequirements: e.target.value,
                    })
                  }
                  placeholder="Cần tưới nước đều đặn, tránh úng nước..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo Box'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
