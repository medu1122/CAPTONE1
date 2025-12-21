import React, { useState, useEffect } from 'react'
import { MapPinIcon, EditIcon, SaveIcon, XIcon } from 'lucide-react'
import type { UserProfile } from '../types'
import { vietnamProvinces } from '../../../data/vietnamProvinces'
import { getDistrictsByProvince, hasDistrictsData } from '../../../data/vietnamDistricts'
interface AddressSectionProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}
export const AddressSection: React.FC<AddressSectionProps> = ({
  profile,
  onUpdate,
  showToast,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    street: profile.address?.street || '',
    province: profile.address?.province || '',
    district: profile.address?.district || '',
  })
  
  // Track selected province code for dropdown
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('')
  const [availableDistricts, setAvailableDistricts] = useState<any[]>([])
  
  // Initialize province code from province name when editing starts
  useEffect(() => {
    if (isEditing && formData.province) {
      const matchedProvince = vietnamProvinces.find(p => p.name === formData.province)
      if (matchedProvince) {
        setSelectedProvinceCode(matchedProvince.code)
        const districts = getDistrictsByProvince(matchedProvince.code)
        setAvailableDistricts(districts)
      }
    }
  }, [isEditing, formData.province])
  
  // Load districts when province changes
  const handleProvinceChange = (provinceCode: string) => {
    setSelectedProvinceCode(provinceCode)
    const province = vietnamProvinces.find(p => p.code === provinceCode)
    
    if (province) {
      setFormData({
        ...formData,
        province: province.name,
        district: '', // Reset district when province changes
      })
      
      const districts = getDistrictsByProvince(provinceCode)
      setAvailableDistricts(districts)
    }
  }
  
  const handleDistrictChange = (districtName: string) => {
    setFormData({
      ...formData,
      district: districtName,
    })
  }
  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdate({
        address: {
          street: formData.street,
          province: formData.province,
          district: formData.district,
        },
      })
      showToast('Cập nhật địa chỉ thành công', 'success')
      setSelectedProvinceCode('')
      setAvailableDistricts([])
      setIsEditing(false)
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }
  const handleCancel = () => {
    setFormData({
      street: profile.address?.street || '',
      province: profile.address?.province || '',
      district: profile.address?.district || '',
    })
    setSelectedProvinceCode('')
    setAvailableDistricts([])
    setIsEditing(false)
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <MapPinIcon className="text-green-600" size={24} />
          Địa chỉ
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <EditIcon size={16} />
            Chỉnh sửa
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XIcon size={16} />
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <SaveIcon size={16} />
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        )}
      </div>
      <div className="space-y-4 max-w-2xl">
        {/* Street Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Địa chỉ cụ thể
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.street}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  street: e.target.value,
                })
              }
              placeholder="Số nhà, tên đường..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900 py-2">
              {profile.address?.street || (
                <span className="text-gray-400">Chưa có thông tin</span>
              )}
            </p>
          )}
        </div>
        {/* Province */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tỉnh/Thành phố
          </label>
          {isEditing ? (
            <select
              value={selectedProvinceCode}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="">-- Chọn tỉnh/thành phố --</option>
              {vietnamProvinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-900 py-2">
              {profile.address?.province || (
                <span className="text-gray-400">Chưa có thông tin</span>
              )}
            </p>
          )}
        </div>
        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quận/Huyện
          </label>
          {isEditing ? (
            <>
              {selectedProvinceCode && hasDistrictsData(selectedProvinceCode) ? (
                <select
                  value={formData.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  disabled={!selectedProvinceCode}
                >
                  <option value="">-- Chọn quận/huyện --</option>
                  {availableDistricts.map((district) => (
                    <option key={district.code} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        district: e.target.value,
                      })
                    }
                    placeholder="Nhập quận/huyện"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {selectedProvinceCode && (
                    <p className="mt-1 text-xs text-gray-500">
                      Chưa có dữ liệu quận/huyện cho tỉnh này, vui lòng nhập thủ công
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-900 py-2">
              {profile.address?.district || (
                <span className="text-gray-400">Chưa có thông tin</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
