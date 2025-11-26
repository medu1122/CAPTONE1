import React, { useState, useEffect, useRef } from 'react'
import { XIcon, Loader2Icon, NavigationIcon, PlusIcon, TrashIcon, AlertCircleIcon, XCircleIcon } from 'lucide-react'
import type { CreatePlantBoxData, PlantDisease } from '../types/plantBox.types'
import { geolocationService } from '../../../services/geolocationService'
import { vietnamProvinces, getProvinceByCoordinates } from '../../../data/vietnamProvinces'
import { searchDiseaseNames } from '../../../services/treatmentService'
import { getMatchingCommonDiseases } from '../../../data/commonDiseases'
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
    name: '', // Will auto-generate
    type: 'active',
    plantName: '',
    scientificName: '', // Will auto-fill from knowledge base
    plantedDate: '',
    plannedDate: '',
    location: {
      name: '',
      area: undefined, // Will map from growingType
      soilType: [], // Array of soil types
      sunlight: 'full', // Will map from growingType or ask
    },
    quantity: 1,
    growthStage: undefined, // Will auto-calculate from date
    specialRequirements: '',
  })
  const [growingType, setGrowingType] = useState<'pot' | 'garden' | 'field' | ''>('') // New: Kiểu trồng
  const [sunlightHours, setSunlightHours] = useState<'<3h' | '3-6h' | '>6h' | ''>('') // New: Giờ nắng
  const [plantedDuration, setPlantedDuration] = useState<{ value: number; unit: 'month' | 'year' }>({ value: 0, unit: 'month' }) // New: Đã trồng được bao lâu
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [detailAddress, setDetailAddress] = useState<string>('')
  const [hasHealthIssue, setHasHealthIssue] = useState<boolean>(false)
  const [diseases, setDiseases] = useState<PlantDisease[]>([])
  const [diseaseSuggestions, setDiseaseSuggestions] = useState<{ [key: number]: string[] }>({})
  const [searchingDisease, setSearchingDisease] = useState<{ [key: number]: boolean }>({})
  const diseaseSearchTimeoutRef = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({})

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

  // Auto-detect location when modal opens
  useEffect(() => {
    if (isOpen && !formData.location.coordinates && !selectedProvince) {
      handleGetCurrentLocation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Update location name when province changes
  useEffect(() => {
    if (selectedProvince) {
      const province = vietnamProvinces.find((p) => p.code === selectedProvince)
      if (province) {
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            name: province.name,
          },
        }))
      }
    }
  }, [selectedProvince])

  // Auto-generate name from plantName + location
  useEffect(() => {
    if (formData.plantName && formData.location.name) {
      const locationName = formData.location.name.split(',').pop()?.trim() || formData.location.name
      setFormData((prev) => ({
        ...prev,
        name: `${prev.plantName} - ${locationName}`,
      }))
    }
  }, [formData.plantName, formData.location.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.plantName.trim()) {
      alert('Vui lòng nhập tên cây')
      setActiveTab('basic')
      return
    }
    
    if (!formData.location.name || formData.location.name.trim() === '') {
      alert('Vui lòng chọn tỉnh/thành phố hoặc lấy vị trí hiện tại')
      setActiveTab('basic')
      return
    }
    
    if (!growingType) {
      alert('Vui lòng chọn kiểu trồng')
      setActiveTab('location')
      return
    }
    
    if (formData.type === 'active') {
      if (!plantedDuration.value || plantedDuration.value <= 0) {
        alert('Vui lòng nhập thời gian đã trồng (phải lớn hơn 0)')
        setActiveTab('basic')
        return
      }
      if (plantedDuration.unit === 'year' && plantedDuration.value > 10) {
        alert('Thời gian trồng không được quá 10 năm')
        setActiveTab('basic')
        return
      }
      if (plantedDuration.unit === 'month' && plantedDuration.value > 120) {
        alert('Thời gian trồng không được quá 120 tháng (10 năm)')
        setActiveTab('basic')
        return
      }
    }
    
    if (formData.type === 'planned' && !formData.plannedDate) {
      alert('Vui lòng chọn ngày dự định')
      setActiveTab('basic')
      return
    }
    
    setIsSubmitting(true)
    try {
      // Auto-generate name if not set
      const finalName = formData.name.trim() || 
        `${formData.plantName} - ${formData.location.name.split(',').pop()?.trim() || formData.location.name}`
      
      // Auto-calculate growthStage from plantedDate if active
      let autoGrowthStage = formData.growthStage
      if (formData.type === 'active' && formData.plantedDate && !formData.growthStage) {
        const plantedDate = formData.plantedDate
        if (plantedDate) {
          const daysSince = Math.floor((new Date().getTime() - new Date(plantedDate).getTime()) / (1000 * 60 * 60 * 24))
          if (daysSince < 7) autoGrowthStage = 'seed'
          else if (daysSince < 30) autoGrowthStage = 'seedling'
          else if (daysSince < 60) autoGrowthStage = 'vegetative'
          else if (daysSince < 90) autoGrowthStage = 'flowering'
          else if (daysSince < 120) autoGrowthStage = 'fruiting'
          else autoGrowthStage = 'fruiting' // Keep as fruiting instead of harvest (harvest is not in enum)
        }
      }
      
      // Include diseases in form data
      const submitData = {
        ...formData,
        name: finalName,
        growthStage: autoGrowthStage,
        currentDiseases: hasHealthIssue && diseases.length > 0 ? diseases : undefined,
      }
      await onSubmit(submitData)
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
          soilType: [],
          sunlight: 'full',
        },
        quantity: 1,
        growthStage: 'seed',
        specialRequirements: '',
      })
      setSelectedProvince('')
      setDetailAddress('')
      setLocationError(null)
      setHasHealthIssue(false)
      setDiseases([])
      setGrowingType('')
      setSunlightHours('')
      setPlantedDuration({ value: 0, unit: 'month' })
    } catch (error: any) {
      console.error('Error creating box:', error)
      console.error('Error details:', error?.response?.data)
      
      // Show detailed validation errors
      let errorMessage = 'Không thể tạo plant box. Vui lòng thử lại.'
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errors = error.response.data.errors
        console.error('📋 [CreateBoxModal] Validation errors details:', errors)
        errorMessage = `Lỗi validation:\n\n${errors.map((e: any) => `• ${e.field}: ${e.message}`).join('\n')}`
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      
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
                  Tên cây <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.plantName}
                  onChange={(e) => {
                    const plantName = e.target.value
                    setFormData({
                      ...formData,
                      plantName,
                      // Auto-generate name from plant name + location (if available)
                      name: plantName && formData.location.name 
                        ? `${plantName} - ${formData.location.name.split(',')[formData.location.name.split(',').length - 1]?.trim() || ''}`
                        : plantName || '',
                    })
                    // TODO: Auto-fill scientificName from knowledge base
                  }}
                  placeholder="Nhập tên cây (ví dụ: Cà chua, Rau muống...)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Tên box sẽ tự động tạo từ tên cây + vị trí
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bạn trồng ở đâu? <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">-- Chọn tỉnh/thành phố --</option>
                    {vietnamProvinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
                    title="Lấy vị trí hiện tại"
                  >
                    {isGettingLocation ? (
                      <Loader2Icon size={16} className="animate-spin" />
                    ) : (
                      <NavigationIcon size={16} />
                    )}
                  </button>
                </div>
                {locationError && (
                  <p className="text-sm text-red-600 mt-1">{locationError}</p>
                )}
              </div>

              {formData.type === 'active' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đã trồng được bao lâu? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max={plantedDuration.unit === 'year' ? 10 : 120}
                      step="0.5"
                      value={plantedDuration.value || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setPlantedDuration({ ...plantedDuration, value })
                        // Calculate plantedDate backwards
                        if (value > 0) {
                          const today = new Date()
                          const monthsAgo = plantedDuration.unit === 'year' ? value * 12 : value
                          const plantedDate = new Date(today)
                          plantedDate.setMonth(plantedDate.getMonth() - monthsAgo)
                          setFormData({
                            ...formData,
                            plantedDate: plantedDate.toISOString().split('T')[0],
                          })
                        }
                      }}
                      placeholder="0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <select
                      value={plantedDuration.unit}
                      onChange={(e) => {
                        const unit = e.target.value as 'month' | 'year'
                        setPlantedDuration({ ...plantedDuration, unit })
                        // Recalculate if value exists
                        if (plantedDuration.value > 0) {
                          const today = new Date()
                          const monthsAgo = unit === 'year' ? plantedDuration.value * 12 : plantedDuration.value
                          const plantedDate = new Date(today)
                          plantedDate.setMonth(plantedDate.getMonth() - monthsAgo)
                          setFormData({
                            ...formData,
                            plantedDate: plantedDate.toISOString().split('T')[0],
                          })
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="month">Tháng</option>
                      <option value="year">Năm</option>
                    </select>
                  </div>
                  {plantedDuration.value > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Ngày trồng ước tính: {formData.plantedDate ? new Date(formData.plantedDate).toLocaleDateString('vi-VN') : ''}
                    </p>
                  )}
                  {plantedDuration.value > (plantedDuration.unit === 'year' ? 10 : 120) && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Giá trị quá lớn, vui lòng nhập lại
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày dự định trồng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.plannedDate || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plannedDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    min={new Date().toISOString().split('T')[0]} // Cannot be in the past
                  />
                </div>
              )}

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
            </>
          )}

          {activeTab === 'location' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kiểu trồng <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setGrowingType('pot')
                      // Auto-map: chậu = diện tích nhỏ, nắng nhiều
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          area: 1, // Default for pot
                          sunlight: 'full',
                        },
                      })
                      setSunlightHours('>6h')
                    }}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      growingType === 'pot'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🪴</div>
                    <div className="font-semibold text-sm">Trồng chậu</div>
                    <div className="text-xs text-gray-600 mt-1">Ban công, sân thượng</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGrowingType('garden')
                      // Auto-map: vườn nhỏ = diện tích trung bình
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          area: 10, // Default for small garden
                          sunlight: 'partial',
                        },
                      })
                      setSunlightHours('3-6h')
                    }}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      growingType === 'garden'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🏡</div>
                    <div className="font-semibold text-sm">Vườn nhà nhỏ</div>
                    <div className="text-xs text-gray-600 mt-1">Sân sau, vườn nhỏ</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGrowingType('field')
                      // Auto-map: ruộng = diện tích lớn
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          area: 100, // Default for field
                          sunlight: 'full',
                        },
                      })
                      setSunlightHours('>6h')
                    }}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      growingType === 'field'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🌾</div>
                    <div className="font-semibold text-sm">Ruộng/Nông trại</div>
                    <div className="text-xs text-gray-600 mt-1">Canh tác lớn</div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Hệ thống sẽ tự động ước lượng diện tích và ánh sáng dựa trên kiểu trồng
                </p>
              </div>

              {growingType && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mỗi ngày cây nhận nắng trực tiếp khoảng bao nhiêu giờ?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['<3h', '3-6h', '>6h'] as const).map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => {
                            setSunlightHours(hours)
                            // Map to sunlight enum
                            const sunlightMap: Record<string, 'full' | 'partial' | 'shade'> = {
                              '<3h': 'shade',
                              '3-6h': 'partial',
                              '>6h': 'full',
                            }
                            setFormData({
                              ...formData,
                              location: {
                                ...formData.location,
                                sunlight: sunlightMap[hours],
                              },
                            })
                          }}
                          className={`p-3 border-2 rounded-lg text-center transition-all ${
                            sunlightHours === hours
                              ? 'border-green-600 bg-green-50 font-semibold'
                              : 'border-gray-300 hover:border-green-300'
                          }`}
                        >
                          {hours}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại đất (có thể chọn nhiều)
                    </label>
                    
                    {/* Selected soil types as tags */}
                    {formData.location.soilType && formData.location.soilType.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.location.soilType.map((soil, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {soil}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  location: {
                                    ...formData.location,
                                    soilType: formData.location.soilType?.filter((_, i) => i !== index) || [],
                                  },
                                })
                              }}
                              className="hover:text-red-600"
                            >
                              <XCircleIcon size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Soil type options */}
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {[
                        { value: 'Đất phù sa', icon: '🌾' },
                        { value: 'Đất pha cát', icon: '🏖️' },
                        { value: 'Đất thịt', icon: '🌱' },
                        { value: 'Đất sét', icon: '🟤' },
                        { value: 'Đất đỏ bazan', icon: '🔴' },
                        { value: 'Đất phèn', icon: '🟡' },
                        { value: 'Đất mặn', icon: '🧂' },
                        { value: 'Đất cát', icon: '🏜️' },
                        { value: 'Đất thịt nhẹ', icon: '🌿' },
                        { value: 'Đất thịt nặng', icon: '🌳' },
                        { value: 'Đất đen', icon: '⚫' },
                        { value: 'Đất xám', icon: '⚪' },
                      ].map((soil) => {
                        const isSelected = formData.location.soilType?.includes(soil.value) || false
                        return (
                          <label
                            key={soil.value}
                            className={`flex items-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-green-600 bg-green-50'
                                : 'border-gray-200 hover:border-green-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentSoils = formData.location.soilType || []
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    location: {
                                      ...formData.location,
                                      soilType: [...currentSoils, soil.value],
                                    },
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    location: {
                                      ...formData.location,
                                      soilType: currentSoils.filter((s) => s !== soil.value),
                                    },
                                  })
                                }
                              }}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm">{soil.icon} {soil.value}</span>
                          </label>
                        )
                      })}
                    </div>

                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            location: {
                              ...formData.location,
                              soilType: [],
                            },
                          })
                        }}
                        className="text-xs text-gray-600 hover:text-red-600"
                      >
                        ❓ Không biết / Xóa tất cả
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Có thể chọn nhiều loại đất. Nếu không biết, hệ thống sẽ dùng default theo vùng và loại cây
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'options' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng (tùy chọn)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="1"
                  />
                  <span className="text-gray-600">cây</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Giai đoạn sẽ tự động tính từ ngày trồng
                </p>
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

              {/* Health Issues Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircleIcon size={20} className="text-orange-600" />
                  <label className="block text-sm font-medium text-gray-700">
                    Tình trạng sức khỏe cây
                  </label>
                </div>

                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHealthIssue}
                      onChange={(e) => {
                        setHasHealthIssue(e.target.checked)
                        if (!e.target.checked) {
                          setDiseases([])
                        }
                      }}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">
                      Cây đang có vấn đề về sức khỏe / bệnh
                    </span>
                  </label>
                </div>

                {hasHealthIssue && (
                  <div className="space-y-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                    {diseases.map((disease, index) => (
                      <div key={index} className="bg-white border border-orange-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900">
                            Bệnh #{index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setDiseases(diseases.filter((_, i) => i !== index))
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="relative">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Tên bệnh / Triệu chứng
                            </label>
                            <input
                              type="text"
                              value={disease.name}
                              onChange={(e) => {
                                const value = e.target.value
                                const updated = [...diseases]
                                updated[index] = { ...updated[index], name: value }
                                setDiseases(updated)
                                
                                // Show common diseases immediately (no debounce)
                                const commonMatches = getMatchingCommonDiseases(value)
                                
                                // Show common diseases immediately
                                setDiseaseSuggestions({ ...diseaseSuggestions, [index]: commonMatches })
                                
                                // Debounced search for database suggestions (only if query length >= 1)
                                if (diseaseSearchTimeoutRef.current[index]) {
                                  clearTimeout(diseaseSearchTimeoutRef.current[index])
                                }
                                
                                if (value.trim().length >= 1) {
                                  setSearchingDisease({ ...searchingDisease, [index]: true })
                                  diseaseSearchTimeoutRef.current[index] = setTimeout(async () => {
                                    try {
                                      const dbSuggestions = await searchDiseaseNames(value)
                                      // Combine: common diseases first, then database results
                                      // Remove duplicates
                                      const allSuggestions = [
                                        ...commonMatches,
                                        ...dbSuggestions.filter(db => !commonMatches.includes(db))
                                      ]
                                      setDiseaseSuggestions({ ...diseaseSuggestions, [index]: allSuggestions.slice(0, 20) })
                                    } catch (error) {
                                      // Silently fail - keep common diseases
                                      setDiseaseSuggestions({ ...diseaseSuggestions, [index]: commonMatches })
                                    } finally {
                                      setSearchingDisease({ ...searchingDisease, [index]: false })
                                    }
                                  }, 300) // Slightly longer debounce to reduce API calls
                                }
                              }}
                              onFocus={() => {
                                // Show common diseases when input is focused
                                const commonMatches = getMatchingCommonDiseases(disease.name || '')
                                setDiseaseSuggestions({ ...diseaseSuggestions, [index]: commonMatches })
                                
                                // Also fetch from database if there's a value (debounced)
                                if (disease.name && disease.name.trim().length > 0) {
                                  if (diseaseSearchTimeoutRef.current[index]) {
                                    clearTimeout(diseaseSearchTimeoutRef.current[index])
                                  }
                                  
                                  setSearchingDisease({ ...searchingDisease, [index]: true })
                                  diseaseSearchTimeoutRef.current[index] = setTimeout(async () => {
                                    try {
                                      const dbSuggestions = await searchDiseaseNames(disease.name)
                                      const allSuggestions = [
                                        ...commonMatches,
                                        ...dbSuggestions.filter(db => !commonMatches.includes(db))
                                      ]
                                      setDiseaseSuggestions({ ...diseaseSuggestions, [index]: allSuggestions.slice(0, 20) })
                                    } catch (error) {
                                      // Silently fail
                                      setDiseaseSuggestions({ ...diseaseSuggestions, [index]: commonMatches })
                                    } finally {
                                      setSearchingDisease({ ...searchingDisease, [index]: false })
                                    }
                                  }, 300)
                                }
                              }}
                              onBlur={() => {
                                // Hide suggestions after a short delay (to allow click)
                                setTimeout(() => {
                                  setDiseaseSuggestions({ ...diseaseSuggestions, [index]: [] })
                                }, 200)
                              }}
                              placeholder="Ví dụ: Đốm lá, Thối rễ, Sâu bệnh... (hỗ trợ không dấu)"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            
                            {/* Suggestions dropdown */}
                            {diseaseSuggestions[index] && diseaseSuggestions[index].length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {diseaseSuggestions[index].map((suggestion, sugIndex) => {
                                  // Highlight matching part
                                  const query = disease.name.toLowerCase()
                                  const suggestionLower = suggestion.toLowerCase()
                                  const matchIndex = suggestionLower.indexOf(query)
                                  
                                  // Check if it's a common disease
                                  const isCommon = getMatchingCommonDiseases('').includes(suggestion)
                                  
                                  return (
                                    <button
                                      key={sugIndex}
                                      type="button"
                                      onClick={() => {
                                        const updated = [...diseases]
                                        updated[index] = { ...updated[index], name: suggestion }
                                        setDiseases(updated)
                                        setDiseaseSuggestions({ ...diseaseSuggestions, [index]: [] })
                                      }}
                                      className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                                        isCommon ? 'bg-orange-50/30' : ''
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>
                                          {matchIndex >= 0 && query.length > 0 ? (
                                            <>
                                              {suggestion.substring(0, matchIndex)}
                                              <span className="font-semibold text-orange-600">
                                                {suggestion.substring(matchIndex, matchIndex + query.length)}
                                              </span>
                                              {suggestion.substring(matchIndex + query.length)}
                                            </>
                                          ) : (
                                            suggestion
                                          )}
                                        </span>
                                        {isCommon && (
                                          <span className="text-xs text-orange-600 font-medium ml-2">⭐</span>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                            
                            {searchingDisease[index] && (
                              <div className="absolute right-3 top-8">
                                <Loader2Icon size={16} className="animate-spin text-orange-600" />
                              </div>
                            )}
                            
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Mô tả chi tiết (tùy chọn)
                            </label>
                            <textarea
                              value={disease.symptoms || ''}
                              onChange={(e) => {
                                const updated = [...diseases]
                                updated[index] = { ...updated[index], symptoms: e.target.value }
                                setDiseases(updated)
                              }}
                              placeholder="Mô tả triệu chứng bạn quan sát được..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Mức độ nghiêm trọng
                            </label>
                            <select
                              value={disease.severity || 'moderate'}
                              onChange={(e) => {
                                const updated = [...diseases]
                                updated[index] = { ...updated[index], severity: e.target.value as 'mild' | 'moderate' | 'severe' }
                                setDiseases(updated)
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="mild">Nhẹ - Chỉ ảnh hưởng một phần nhỏ</option>
                              <option value="moderate">Trung bình - Ảnh hưởng đáng kể</option>
                              <option value="severe">Nghiêm trọng - Cần điều trị ngay</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setDiseases([...diseases, { name: '', severity: 'moderate', status: 'active' }])
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                    >
                      <PlusIcon size={16} />
                      <span>Thêm bệnh khác</span>
                    </button>

                    <p className="text-xs text-gray-600 mt-2">
                      💡 Hệ thống sẽ tự động đề xuất phương pháp điều trị dựa trên bệnh bạn mô tả
                    </p>
                  </div>
                )}
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
