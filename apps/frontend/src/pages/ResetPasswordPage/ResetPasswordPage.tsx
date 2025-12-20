import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { authService } from '../../services/authService'
import { Toast } from '../../components/ui/Toast'
import { SnowEffect } from '../AuthPage/components/SnowEffect'

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
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Check system preference for dark mode
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(darkModeMediaQuery.matches)
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches)
    }
    darkModeMediaQuery.addEventListener('change', handleChange)
    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev)
  }

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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SnowEffect isDarkMode={isDarkMode} />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Đang xác thực token...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SnowEffect isDarkMode={isDarkMode} />
        
        {/* Dark mode toggle */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-yellow-300' : 'bg-white text-gray-700'}`}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </div>

        <div className={`rounded-xl shadow-lg p-8 max-w-md w-full text-center relative z-10 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Token không hợp lệ</h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SnowEffect isDarkMode={isDarkMode} />
      
      {/* Dark mode toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-yellow-300' : 'bg-white text-gray-700'}`}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </div>

      <div className={`rounded-xl shadow-lg p-8 max-w-md w-full relative z-10 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Đặt lại mật khẩu</h2>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Nhập mật khẩu mới của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
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
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số
            </p>
          </div>

          <div>
            <label htmlFor="confirm-password" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
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

