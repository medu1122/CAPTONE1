import React, { useState } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
interface LoginFormProps {
  isDarkMode: boolean
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}
export const LoginForm: React.FC<LoginFormProps> = ({
  isDarkMode,
  showToast,
}) => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const validateEmail = (email: string) => {
    if (!email) return 'Email không được để trống'
    if (!/\S+@\S+\.\S+/.test(email)) return 'Email không hợp lệ'
    return ''
  }
  const validatePassword = (password: string) => {
    if (!password) return 'Mật khẩu không được để trống'
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự'
    return ''
  }
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    const error = validateEmail(value)
    setErrors((prev) => ({
      ...prev,
      email: error,
    }))
  }
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    const error = validatePassword(value)
    setErrors((prev) => ({
      ...prev,
      password: error,
    }))
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validate all fields
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      })
      return
    }
    setLoading(true)
    try {
      // Use AuthContext login
      await login(email, password)
      
      showToast('Đăng nhập thành công!', 'success')
      
      // Redirect to chat page after successful login
      setTimeout(() => {
        navigate('/chat')
      }, 1000)
      
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle different types of errors
      if (error.response?.status === 400) {
        // Validation errors
        const apiErrors = error.response.data.errors
        if (apiErrors) {
          setErrors(apiErrors)
        } else {
          showToast(error.response.data.message || 'Thông tin không hợp lệ', 'error')
        }
      } else if (error.response?.status === 401) {
        showToast('Email hoặc mật khẩu không đúng', 'error')
      } else if (error.response?.status === 403) {
        // User chưa verify email
        const errorMessage = error.response.data.message
        if (errorMessage.includes('verify') || errorMessage.includes('xác thực')) {
          showToast('Vui lòng xác thực email trước khi đăng nhập', 'error')
          // Redirect to verification screen
          setTimeout(() => {
            navigate('/verify-email')
          }, 2000)
        } else {
          showToast('Tài khoản bị khóa hoặc không có quyền truy cập', 'error')
        }
      } else if (error.response?.status === 429) {
        showToast('Quá nhiều lần thử, vui lòng đợi một chút', 'error')
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        showToast('Không thể kết nối đến server', 'error')
      } else {
        showToast('Đăng nhập thất bại. Vui lòng thử lại.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }
  const isFormValid = !errors.email && !errors.password && email && password
  // Dynamic styles based on dark mode
  const inputClasses = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'
  const buttonClasses = isDarkMode
    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-800 disabled:bg-gray-700 disabled:text-gray-500'
    : 'bg-green-600 hover:bg-green-700 focus:ring-green-300 disabled:bg-gray-200 disabled:text-gray-500'
  const errorClasses = 'text-red-500 text-xs mt-1'
  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="email"
          className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${inputClasses}`}
          placeholder="your.email@example.com"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p className={errorClasses} id="email-error">
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="password"
          className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Mật khẩu
        </label>
        <div className="relative mt-1">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={handlePasswordChange}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${inputClasses}`}
            placeholder="••••••••"
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOffIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className={errorClasses} id="password-error">
            {errors.password}
          </p>
        )}
      </div>
      <div className="flex items-center justify-end">
        <a
          href="#"
          className={`text-sm font-medium ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'}`}
        >
          Quên mật khẩu?
        </a>
      </div>
      <button
        type="submit"
        disabled={!isFormValid || loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${buttonClasses}`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Đang xử lý...
          </>
        ) : (
          'Đăng nhập'
        )}
      </button>
    </form>
  )
}

export default LoginForm
