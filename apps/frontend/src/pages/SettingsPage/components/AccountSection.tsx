import React, { useState, useEffect, useRef } from 'react'
import { UserIcon, EditIcon, CameraIcon, XIcon, SaveIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react'
import type { UserProfile } from '../../ProfilePage/types'
import { getAvatarUrl } from '../../../utils/avatar'
import { 
  createVerificationOTP, 
  verifyPhone, 
  resendVerificationOTP 
} from '../../../services/phoneVerificationService'

interface AccountSectionProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
  onUploadImage: (file: File) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  profile,
  onUpdate,
  onUploadImage,
  showToast,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: profile.username,
    email: profile.email,
    phone: profile.phone || '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [sendingOTP, setSendingOTP] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Kích thước ảnh không được vượt quá 5MB', 'error')
        return
      }
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn file ảnh', 'error')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (avatarFile && onUploadImage) {
        await onUploadImage(avatarFile)
        setAvatarFile(null)
        setAvatarPreview(null)
      }
      await onUpdate({
        username: formData.username,
        phone: formData.phone || undefined,
      })
      showToast('Cập nhật thông tin thành công', 'success')
      setIsEditing(false)
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      username: profile.username,
      email: profile.email,
      phone: profile.phone || '',
    })
    setAvatarFile(null)
    setAvatarPreview(null)
    setIsEditing(false)
  }

  // Countdown timer effect
  useEffect(() => {
    if (resendCountdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
              countdownIntervalRef.current = null
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [resendCountdown])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  const startCountdown = () => {
    setResendCountdown(60) // 60 seconds
  }

  const handleRequestOTP = async () => {
    if (!formData.phone) {
      showToast('Vui lòng nhập số điện thoại trước', 'error')
      return
    }

    setSendingOTP(true)
    try {
      await createVerificationOTP(formData.phone)
      showToast('Mã OTP đã được gửi đến số điện thoại của bạn', 'success')
      setShowOTPModal(true)
      startCountdown() // Start countdown after sending OTP
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP', 'error')
    } finally {
      setSendingOTP(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Vui lòng nhập mã OTP 6 số', 'error')
      return
    }

    setVerifying(true)
    try {
      const result = await verifyPhone(otp)
      showToast('Xác thực số điện thoại thành công!', 'success')
      setShowOTPModal(false)
      setOtp('')
      setIsEditing(false)
      // Update profile with verified phone
      await onUpdate({
        phone: result.data.user.phone,
        phoneVerified: result.data.user.phoneVerified,
      })
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Mã OTP không đúng', 'error')
    } finally {
      setVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCountdown > 0) {
      showToast(`Vui lòng đợi ${resendCountdown} giây trước khi gửi lại`, 'error')
      return
    }

    setSendingOTP(true)
    try {
      await resendVerificationOTP()
      showToast('Đã gửi lại mã OTP', 'success')
      startCountdown() // Start countdown after resending
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra', 'error')
    } finally {
      setSendingOTP(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <UserIcon className="text-green-600" size={24} />
          Tài khoản
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

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={avatarPreview || getAvatarUrl(profile.avatar)}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            />
            {isEditing && (
              <label className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full cursor-pointer hover:bg-green-700 transition-colors">
                <CameraIcon size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ảnh đại diện</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG tối đa 5MB</p>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Tên người dùng
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <p className="text-gray-900 dark:text-white py-2">{profile.username}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Email
          </label>
          <p className="text-gray-900 dark:text-white py-2">{profile.email}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email không thể thay đổi</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Số điện thoại
          </label>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {formData.phone && formData.phone !== profile.phone && (
                <button
                  onClick={handleRequestOTP}
                  disabled={sendingOTP}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {sendingOTP ? 'Đang gửi...' : 'Gửi mã xác thực'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-gray-900 dark:text-white py-2">
                  {profile.phone || <span className="text-gray-400 dark:text-gray-500">Chưa có</span>}
                </p>
                {profile.phone && (
                  profile.phoneVerified ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircleIcon size={16} />
                      Đã xác thực
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-600 text-sm">
                      <AlertCircleIcon size={16} />
                      Chưa xác thực
                    </span>
                  )
                )}
              </div>
              {profile.phone && !profile.phoneVerified && (
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setFormData({ ...formData, phone: profile.phone || '' })
                  }}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Xác thực số điện thoại
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Xác thực số điện thoại
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Nhập mã OTP 6 số đã được gửi đến <strong>{formData.phone}</strong>
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowOTPModal(false)
                  setOtp('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleResendOTP}
                disabled={sendingOTP || resendCountdown > 0}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              >
                {sendingOTP 
                  ? 'Đang gửi...' 
                  : resendCountdown > 0 
                    ? `Gửi lại (${resendCountdown}s)` 
                    : 'Gửi lại'}
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={verifying || otp.length !== 6}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {verifying ? 'Đang xác thực...' : 'Xác thực'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

