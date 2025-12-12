import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, LockIcon, CheckCircleIcon, MailIcon } from 'lucide-react'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { Toast } from '../../components/ui/Toast'
import { profileService } from '../../services/profileService'
import { authService } from '../../services/authService'
import { passwordChangeOTPService } from '../../services/passwordChangeOTPService'

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'verify' | 'otp' | 'change'>('verify')
  const [verifyPassword, setVerifyPassword] = useState('')
  const [verifiedPassword, setVerifiedPassword] = useState('')
  const [showVerifyPassword, setShowVerifyPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null)
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Bước 1: Xác minh mật khẩu hiện tại
  const handleVerifyPassword = async () => {
    if (!verifyPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại', 'error')
      return
    }

    setLoading(true)
    try {
      const profile = await profileService.getProfile()
      await authService.login({
        email: profile.email,
        password: verifyPassword,
      })
      
      setVerifiedPassword(verifyPassword)
      setStep('otp')
      setVerifyPassword('')
      showToast('Xác minh mật khẩu thành công', 'success')
      
      // Tự động gửi OTP
      await handleGenerateOTP()
    } catch (error: any) {
      console.error('Password verification error:', error)
      if (error.response?.status === 401) {
        showToast('Mật khẩu hiện tại không đúng', 'error')
      } else {
        showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // Bước 2: Gửi OTP
  const handleGenerateOTP = async () => {
    setLoading(true)
    try {
      const result = await passwordChangeOTPService.generateOTP()
      setOtpSent(true)
      setOtpExpiresAt(new Date(result.expiresAt))
      showToast('Mã OTP đã được gửi đến email của bạn', 'success')
    } catch (error: any) {
      console.error('Generate OTP error:', error)
      showToast(error.message || 'Không thể gửi mã OTP, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Bước 2: Xác thực OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Vui lòng nhập mã OTP 6 số', 'error')
      return
    }

    setLoading(true)
    try {
      const result = await passwordChangeOTPService.verifyOTP(otp)
      setVerificationToken(result.verificationToken)
      setStep('change')
      setOtp('')
      showToast('Xác thực OTP thành công', 'success')
    } catch (error: any) {
      console.error('Verify OTP error:', error)
      showToast(error.message || 'Mã OTP không đúng hoặc đã hết hạn', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Bước 3: Đổi mật khẩu
  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Mật khẩu mới và xác nhận mật khẩu không khớp', 'error')
      return
    }

    if (passwordData.newPassword.length < 8) {
      showToast('Mật khẩu mới phải có ít nhất 8 ký tự', 'error')
      return
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      showToast('Mật khẩu phải chứa chữ hoa, chữ thường và số', 'error')
      return
    }

    if (!verificationToken) {
      showToast('Phiên xác thực đã hết hạn, vui lòng thử lại', 'error')
      return
    }

    setLoading(true)
    try {
      await profileService.changePassword(verifiedPassword, passwordData.newPassword, verificationToken)
      showToast('Đổi mật khẩu thành công', 'success')
      
      setTimeout(() => {
        navigate('/settings')
      }, 2000)
    } catch (error: any) {
      console.error('Change password error:', error)
      showToast(error.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Format OTP input (chỉ cho phép số, tối đa 6 ký tự)
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon size={20} />
            <span>Quay lại cài đặt</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <LockIcon className="text-green-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Đổi mật khẩu</h1>
          </div>
          <p className="text-gray-600">
            Đảm bảo tài khoản của bạn an toàn bằng cách thay đổi mật khẩu thường xuyên.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'verify' 
                  ? 'bg-green-600 text-white' 
                  : step === 'otp' || step === 'change'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step !== 'verify' ? (
                  <CheckCircleIcon size={20} />
                ) : (
                  <span className="text-sm font-semibold">1</span>
                )}
              </div>
              <span className={`font-medium ${
                step === 'verify' ? 'text-gray-900' : 'text-gray-500'
              }`}>
                Xác minh mật khẩu
              </span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              <div className={`h-full transition-all ${
                step === 'otp' || step === 'change' ? 'bg-green-600 w-full' : 'bg-gray-200 w-0'
              }`} />
            </div>
            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'otp' 
                  ? 'bg-green-600 text-white' 
                  : step === 'change'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step === 'change' ? (
                  <CheckCircleIcon size={20} />
                ) : (
                  <span className="text-sm font-semibold">2</span>
                )}
              </div>
              <span className={`font-medium ${
                step === 'otp' ? 'text-gray-900' : 'text-gray-500'
              }`}>
                Xác thực OTP
              </span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              <div className={`h-full transition-all ${
                step === 'change' ? 'bg-green-600 w-full' : 'bg-gray-200 w-0'
              }`} />
            </div>
            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'change' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <span className="text-sm font-semibold">3</span>
              </div>
              <span className={`font-medium ${
                step === 'change' ? 'text-gray-900' : 'text-gray-500'
              }`}>
                Mật khẩu mới
              </span>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {step === 'verify' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Xác minh mật khẩu hiện tại
                </h2>
                <p className="text-gray-600 text-sm">
                  Vui lòng nhập mật khẩu hiện tại của bạn để tiếp tục.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showVerifyPassword ? 'text' : 'password'}
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoComplete="current-password"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleVerifyPassword()
                      }
                    }}
                  />
                  <button
                    type="button"
                    key={showVerifyPassword ? 'eye-off-verify' : 'eye-on-verify'}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowVerifyPassword(!showVerifyPassword)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20 flex items-center justify-center w-6 h-6 pointer-events-auto"
                    aria-label={showVerifyPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {showVerifyPassword ? (
                      <EyeOffIcon size={18} className="block" />
                    ) : (
                      <EyeIcon size={18} className="block" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/settings')}
                  className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleVerifyPassword}
                  disabled={loading || !verifyPassword}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xác minh...' : 'Tiếp tục'}
                </button>
              </div>
            </div>
          ) : step === 'otp' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Xác thực qua email
                </h2>
                <p className="text-gray-600 text-sm">
                  Chúng tôi đã gửi mã OTP 6 số đến email của bạn. Vui lòng kiểm tra hộp thư và nhập mã để tiếp tục.
                </p>
              </div>

              {otpSent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <MailIcon className="text-green-600 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-medium text-green-900">Mã OTP đã được gửi</p>
                    <p className="text-xs text-green-700 mt-1">
                      Mã OTP có hiệu lực trong 10 phút
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="Nhập mã OTP 6 số"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Nhập mã 6 số đã được gửi đến email của bạn
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStep('verify')
                    setOtp('')
                    setOtpSent(false)
                    setVerifiedPassword('')
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Quay lại
                </button>
                {!otpSent && (
                  <button
                    onClick={handleGenerateOTP}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                  </button>
                )}
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xác thực...' : 'Xác thực'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Nhập mật khẩu mới
                </h2>
                <p className="text-gray-600 text-sm">
                  Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    key={showPasswords.new ? 'eye-off-new' : 'eye-on-new'}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20 flex items-center justify-center w-6 h-6 pointer-events-auto"
                    aria-label={showPasswords.new ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {showPasswords.new ? (
                      <EyeOffIcon size={18} className="block" />
                    ) : (
                      <EyeIcon size={18} className="block" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    key={showPasswords.confirm ? 'eye-off-confirm' : 'eye-on-confirm'}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20 flex items-center justify-center w-6 h-6 pointer-events-auto"
                    aria-label={showPasswords.confirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {showPasswords.confirm ? (
                      <EyeOffIcon size={18} className="block" />
                    ) : (
                      <EyeIcon size={18} className="block" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStep('otp')
                    setPasswordData({ newPassword: '', confirmPassword: '' })
                    setVerificationToken('')
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default ChangePasswordPage
