import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { authService } from '../../services/authService'
import { Toast } from '../../components/ui/Toast'

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
      validateToken(tokenParam)
    } else {
      setValidating(false)
      setTokenValid(false)
      showToast('Token không hợp lệ', 'error')
    }
  }, [searchParams])

  const validateToken = async (resetToken: string) => {
    try {
      await authService.passwordReset.validateToken(resetToken)
      setTokenValid(true)
    } catch (error: any) {
      setTokenValid(false)
      showToast(error.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn', 'error')
    } finally {
      setValidating(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const validatePassword = (password: string) => {
    if (!password) return 'Mật khẩu không được để trống'
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự'
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất một chữ thường, một chữ hoa và một số'
    }
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      showToast(passwordError, 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu mới và xác nhận mật khẩu không khớp', 'error')
      return
    }

    setLoading(true)
    try {
      await authService.passwordReset.resetPassword(token, newPassword)
      showToast('Đặt lại mật khẩu thành công!', 'success')
      setTimeout(() => {
        navigate('/auth')
      }, 2000)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xác thực token...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Token không hợp lệ</h2>
          <p className="text-gray-600 mb-6">
            Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.
          </p>
          <button
            onClick={() => navigate('/auth?view=forgot-password')}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Yêu cầu liên kết mới
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu</h2>
          <p className="text-gray-600">Nhập mật khẩu mới của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                key={showPassword ? 'eye-off-reset' : 'eye-on-reset'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowPassword(!showPassword)
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-20 pointer-events-auto"
                style={{ pointerEvents: 'auto' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5 text-gray-400 block" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 block" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số
            </p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                key={showConfirmPassword ? 'eye-off-confirm-reset' : 'eye-on-confirm-reset'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowConfirmPassword(!showConfirmPassword)
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-20 pointer-events-auto"
                style={{ pointerEvents: 'auto' }}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5 text-gray-400 block" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 block" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default ResetPasswordPage

