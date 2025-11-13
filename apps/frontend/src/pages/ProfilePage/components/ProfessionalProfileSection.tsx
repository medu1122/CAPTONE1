import React, { useState } from 'react'
import { BriefcaseIcon, SaveIcon, XIcon } from 'lucide-react'
import type { UserProfile } from '../types'
interface ProfessionalProfileSectionProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}
export const ProfessionalProfileSection: React.FC<
  ProfessionalProfileSectionProps
> = ({ profile, onUpdate, showToast }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(profile.professionalProfile)
  const [newCrop, setNewCrop] = useState('')
  const [newCertificate, setNewCertificate] = useState('')
  const [newPreference, setNewPreference] = useState('')
  const farmSizeOptions = [
    {
      value: 'small',
      label: 'Nhỏ (<1 ha)',
    },
    {
      value: 'medium',
      label: 'Trung bình (1-5 ha)',
    },
    {
      value: 'large',
      label: 'Lớn (5-10 ha)',
    },
    {
      value: 'very-large',
      label: 'Rất lớn (>10 ha)',
    },
  ]
  const farmTypeOptions = [
    {
      value: 'organic',
      label: 'Hữu cơ',
    },
    {
      value: 'conventional',
      label: 'Thông thường',
    },
    {
      value: 'hydroponic',
      label: 'Thủy canh',
    },
    {
      value: 'other',
      label: 'Khác',
    },
  ]
  const experienceOptions = [
    {
      value: 'less-1',
      label: 'Dưới 1 năm',
    },
    {
      value: '1-3',
      label: '1-3 năm',
    },
    {
      value: '3-5',
      label: '3-5 năm',
    },
    {
      value: '5-10',
      label: '5-10 năm',
    },
    {
      value: 'more-10',
      label: 'Trên 10 năm',
    },
  ]
  const budgetOptions = [
    {
      value: 'low',
      label: 'Thấp (<1 triệu/tháng)',
    },
    {
      value: 'medium',
      label: 'Trung bình (1-5 triệu/tháng)',
    },
    {
      value: 'high',
      label: 'Cao (5-10 triệu/tháng)',
    },
    {
      value: 'very-high',
      label: 'Rất cao (>10 triệu/tháng)',
    },
  ]
  const frequencyOptions = [
    {
      value: 'daily',
      label: 'Hàng ngày',
    },
    {
      value: 'weekly',
      label: 'Hàng tuần',
    },
    {
      value: 'monthly',
      label: 'Hàng tháng',
    },
    {
      value: 'seasonal',
      label: 'Theo mùa',
    },
  ]
  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdate({
        professionalProfile: formData,
      })
      showToast('Cập nhật hồ sơ nghề nghiệp thành công', 'success')
      setIsEditing(false)
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }
  const handleCancel = () => {
    setFormData(profile.professionalProfile)
    setIsEditing(false)
  }
  const addCrop = () => {
    if (
      newCrop.trim() &&
      !formData.farmerInfo?.crops?.includes(newCrop.trim())
    ) {
      setFormData({
        ...formData,
        farmerInfo: {
          ...formData.farmerInfo,
          crops: [...(formData.farmerInfo?.crops || []), newCrop.trim()],
        },
      })
      setNewCrop('')
    }
  }
  const removeCrop = (crop: string) => {
    setFormData({
      ...formData,
      farmerInfo: {
        ...formData.farmerInfo,
        crops: formData.farmerInfo?.crops?.filter((c: string) => c !== crop) || [],
      },
    })
  }
  const addCertificate = () => {
    if (
      newCertificate.trim() &&
      !formData.farmerInfo?.certificates?.includes(newCertificate.trim())
    ) {
      setFormData({
        ...formData,
        farmerInfo: {
          ...formData.farmerInfo,
          certificates: [
            ...(formData.farmerInfo?.certificates || []),
            newCertificate.trim(),
          ],
        },
      })
      setNewCertificate('')
    }
  }
  const removeCertificate = (cert: string) => {
    setFormData({
      ...formData,
      farmerInfo: {
        ...formData.farmerInfo,
        certificates:
          formData.farmerInfo?.certificates?.filter((c: string) => c !== cert) || [],
      },
    })
  }
  const addPreference = () => {
    if (
      newPreference.trim() &&
      !formData.buyerInfo?.preferences?.includes(newPreference.trim())
    ) {
      setFormData({
        ...formData,
        buyerInfo: {
          ...formData.buyerInfo,
          preferences: [
            ...(formData.buyerInfo?.preferences || []),
            newPreference.trim(),
          ],
        },
      })
      setNewPreference('')
    }
  }
  const removePreference = (pref: string) => {
    setFormData({
      ...formData,
      buyerInfo: {
        ...formData.buyerInfo,
        preferences:
          formData.buyerInfo?.preferences?.filter((p: string) => p !== pref) || [],
      },
    })
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <BriefcaseIcon className="text-green-600" size={24} />
          Hồ sơ nghề nghiệp
        </h2>
        {isEditing && (
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
      {/* Role Checkboxes */}
      <div className="mb-6 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isFarmer}
            onChange={(e) => {
              setIsEditing(true)
              setFormData({
                ...formData,
                isFarmer: e.target.checked,
              })
            }}
            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          />
          <span className="text-gray-700 font-medium">Tôi là nông dân</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isBuyer}
            onChange={(e) => {
              setIsEditing(true)
              setFormData({
                ...formData,
                isBuyer: e.target.checked,
              })
            }}
            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          />
          <span className="text-gray-700 font-medium">Tôi là người mua</span>
        </label>
      </div>
      {/* Farmer Section */}
      {formData.isFarmer && (
        <div className="bg-green-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Thông tin nông dân
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Farm Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên nông trại
              </label>
              <input
                type="text"
                value={formData.farmerInfo?.farmName || ''}
                onChange={(e) => {
                  setIsEditing(true)
                  setFormData({
                    ...formData,
                    farmerInfo: {
                      ...formData.farmerInfo,
                      farmName: e.target.value,
                    },
                  })
                }}
                placeholder="Nhập tên nông trại"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              />
            </div>
            {/* Farm Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quy mô
              </label>
              <select
                value={formData.farmerInfo?.farmSize || ''}
                onChange={(e) => {
                  setIsEditing(true)
                  setFormData({
                    ...formData,
                    farmerInfo: {
                      ...formData.farmerInfo,
                      farmSize: e.target.value as any,
                    },
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                <option value="">Chọn quy mô</option>
                {farmSizeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Farm Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại hình
              </label>
              <select
                value={formData.farmerInfo?.farmType || ''}
                onChange={(e) => {
                  setIsEditing(true)
                  setFormData({
                    ...formData,
                    farmerInfo: {
                      ...formData.farmerInfo,
                      farmType: e.target.value as any,
                    },
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                <option value="">Chọn loại hình</option>
                {farmTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Crops */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cây trồng
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCrop()}
                  placeholder="Thêm cây trồng"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
                <button
                  onClick={addCrop}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Thêm
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.farmerInfo?.crops?.map((crop: string) => (
                  <span
                    key={crop}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {crop}
                    <button onClick={() => removeCrop(crop)}>
                      <XIcon size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            {/* Experience */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kinh nghiệm
              </label>
              <select
                value={formData.farmerInfo?.experience || ''}
                onChange={(e) => {
                  setIsEditing(true)
                  setFormData({
                    ...formData,
                    farmerInfo: {
                      ...formData.farmerInfo,
                      experience: e.target.value as any,
                    },
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                <option value="">Chọn kinh nghiệm</option>
                {experienceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Certificates */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chứng chỉ
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCertificate}
                  onChange={(e) => setNewCertificate(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCertificate()}
                  placeholder="Thêm chứng chỉ (VD: VietGAP, GlobalGAP...)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
                <button
                  onClick={addCertificate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Thêm
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.farmerInfo?.certificates?.map((cert: string) => (
                  <span
                    key={cert}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {cert}
                    <button onClick={() => removeCertificate(cert)}>
                      <XIcon size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Buyer Section */}
      {formData.isBuyer && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Thông tin người mua
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preferences */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sở thích mua hàng
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPreference}
                  onChange={(e) => setNewPreference(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPreference()}
                  placeholder="Thêm sở thích"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
                <button
                  onClick={addPreference}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Thêm
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.buyerInfo?.preferences?.map((pref: string) => (
                  <span
                    key={pref}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {pref}
                    <button onClick={() => removePreference(pref)}>
                      <XIcon size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngân sách
              </label>
              <select
                value={formData.buyerInfo?.budget || ''}
                onChange={(e) => {
                  setIsEditing(true)
                  setFormData({
                    ...formData,
                    buyerInfo: {
                      ...formData.buyerInfo,
                      budget: e.target.value as any,
                    },
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                <option value="">Chọn ngân sách</option>
                {budgetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Purchase Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tần suất mua hàng
              </label>
              <select
                value={formData.buyerInfo?.purchaseFrequency || ''}
                onChange={(e) => {
                  setIsEditing(true)
                  setFormData({
                    ...formData,
                    buyerInfo: {
                      ...formData.buyerInfo,
                      purchaseFrequency: e.target.value as any,
                    },
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                <option value="">Chọn tần suất</option>
                {frequencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {!formData.isFarmer && !formData.isBuyer && (
        <div className="text-center py-12 text-gray-500">
          <p>Vui lòng chọn vai trò của bạn ở trên để tiếp tục</p>
        </div>
      )}
    </div>
  )
}
