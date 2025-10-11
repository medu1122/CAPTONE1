import React, { useEffect, useState } from 'react'
import { EyeIcon, EyeOffIcon, CheckIcon, XIcon } from 'lucide-react'
import { authService } from '../../../services/authService'
interface RegisterFormProps {
  isDarkMode: boolean
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  onRegistrationSuccess: (email: string) => void
}
export const RegisterForm: React.FC<RegisterFormProps> = ({
  isDarkMode,
  showToast,
  onRegistrationSuccess,
}) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    terms?: string
  }>({})
  // Password strength criteria
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  // Update password strength whenever password changes
  useEffect(() => {
    let strength = 0
    if (hasMinLength) strength += 1
    if (hasUppercase) strength += 1
    if (hasLowercase) strength += 1
    if (hasNumber) strength += 1
    if (hasSpecialChar) strength += 1
    setPasswordStrength(strength)
  }, [
    password,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  ])
  const getStrengthLabel = () => {
    if (passwordStrength === 0) return ''
    if (passwordStrength <= 2) return 'Yếu'
    if (passwordStrength <= 4) return 'Trung bình'
    return 'Mạnh'
  }
  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-300 dark:bg-gray-600'
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength <= 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  const validateFullName = (name: string) => {
    if (!name.trim()) return 'Họ tên không được để trống'
    if (name.trim().length < 2) return 'Họ tên phải có ít nhất 2 ký tự'
    return ''
  }
  const validateEmail = (email: string) => {
    if (!email) return 'Email không được để trống'
    if (!/\S+@\S+\.\S+/.test(email)) return 'Email không hợp lệ'
    return ''
  }
  const validatePassword = (password: string) => {
    if (!password) return 'Mật khẩu không được để trống'
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự'
    if (passwordStrength < 3) return 'Mật khẩu quá yếu'
    return ''
  }
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) return 'Vui lòng xác nhận mật khẩu'
    if (confirmPassword !== password) return 'Mật khẩu không khớp'
    return ''
  }
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFullName(value)
    const error = validateFullName(value)
    setErrors((prev) => ({
      ...prev,
      fullName: error,
    }))
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
    // Also validate confirm password if it has a value
    if (confirmPassword) {
      const confirmError =
        value === confirmPassword ? '' : 'Mật khẩu không khớp'
      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }))
    }
  }
  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value
    setConfirmPassword(value)
    const error = validateConfirmPassword(value)
    setErrors((prev) => ({
      ...prev,
      confirmPassword: error,
    }))
  }
  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAcceptTerms(e.target.checked)
    setErrors((prev) => ({
      ...prev,
      terms: e.target.checked ? '' : 'Bạn phải đồng ý với điều khoản sử dụng',
    }))
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validate all fields
    const nameError = validateFullName(fullName)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const confirmError = validateConfirmPassword(confirmPassword)
    const termsError = acceptTerms
      ? ''
      : 'Bạn phải đồng ý với điều khoản sử dụng'
    if (
      nameError ||
      emailError ||
      passwordError ||
      confirmError ||
      termsError
    ) {
      setErrors({
        fullName: nameError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmError,
        terms: termsError,
      })
      return
    }
    setLoading(true)
    try {
      // Real API call
      const response = await authService.register({
        name: fullName,
        email,
        password,
      })
      
      showToast('Đăng ký thành công!', 'success')
      onRegistrationSuccess(email)
      
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Handle different types of errors
      if (error.response?.status === 400) {
        // Validation errors
        const apiErrors = error.response.data.errors
        if (apiErrors) {
          setErrors(apiErrors)
        } else {
          showToast(error.response.data.message || 'Thông tin không hợp lệ', 'error')
        }
      } else if (error.response?.status === 409) {
        showToast('Email này đã được sử dụng', 'error')
      } else if (error.response?.status === 429) {
        showToast('Quá nhiều lần thử, vui lòng đợi một chút', 'error')
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        showToast('Không thể kết nối đến server', 'error')
      } else {
        showToast('Đăng ký thất bại. Vui lòng thử lại.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }
  const isFormValid =
    !errors.fullName &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword &&
    acceptTerms &&
    fullName &&
    email &&
    password &&
    confirmPassword
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
          htmlFor="fullName"
          className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Họ tên
        </label>
        <input
          type="text"
          id="fullName"
          value={fullName}
          onChange={handleFullNameChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${inputClasses}`}
          placeholder="Nguyễn Văn A"
          required
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
        />
        {errors.fullName && (
          <p className={errorClasses} id="fullName-error">
            {errors.fullName}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="register-email"
          className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Email
        </label>
        <input
          type="email"
          id="register-email"
          value={email}
          onChange={handleEmailChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${inputClasses}`}
          placeholder="your.email@example.com"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'register-email-error' : undefined}
        />
        {errors.email && (
          <p className={errorClasses} id="register-email-error">
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="register-password"
          className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Mật khẩu
        </label>
        <div className="relative mt-1">
          <input
            type={showPassword ? 'text' : 'password'}
            id="register-password"
            value={password}
            onChange={handlePasswordChange}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${inputClasses}`}
            placeholder="••••••••"
            required
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? 'register-password-error' : undefined
            }
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
          <p className={errorClasses} id="register-password-error">
            {errors.password}
          </p>
        )}
        {/* Password strength meter */}
        {password.length > 0 && (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs font-medium">
                Độ mạnh mật khẩu: {getStrengthLabel()}
              </div>
              <div className="text-xs">{passwordStrength}/5</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div
                className={`h-1.5 rounded-full ${getStrengthColor()}`}
                style={{
                  width: `${(passwordStrength / 5) * 100}%`,
                }}
              ></div>
            </div>
            {/* Password requirements */}
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center">
                {hasMinLength ? (
                  <CheckIcon className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <XIcon className="h-3 w-3 text-gray-400 mr-1" />
                )}
                <span
                  className={
                    hasMinLength
                      ? isDarkMode
                        ? 'text-green-400'
                        : 'text-green-600'
                      : 'text-gray-500'
                  }
                >
                  Ít nhất 8 ký tự
                </span>
              </div>
              <div className="flex items-center">
                {hasUppercase ? (
                  <CheckIcon className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <XIcon className="h-3 w-3 text-gray-400 mr-1" />
                )}
                <span
                  className={
                    hasUppercase
                      ? isDarkMode
                        ? 'text-green-400'
                        : 'text-green-600'
                      : 'text-gray-500'
                  }
                >
                  Chữ hoa
                </span>
              </div>
              <div className="flex items-center">
                {hasLowercase ? (
                  <CheckIcon className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <XIcon className="h-3 w-3 text-gray-400 mr-1" />
                )}
                <span
                  className={
                    hasLowercase
                      ? isDarkMode
                        ? 'text-green-400'
                        : 'text-green-600'
                      : 'text-gray-500'
                  }
                >
                  Chữ thường
                </span>
              </div>
              <div className="flex items-center">
                {hasNumber ? (
                  <CheckIcon className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <XIcon className="h-3 w-3 text-gray-400 mr-1" />
                )}
                <span
                  className={
                    hasNumber
                      ? isDarkMode
                        ? 'text-green-400'
                        : 'text-green-600'
                      : 'text-gray-500'
                  }
                >
                  Số
                </span>
              </div>
              <div className="flex items-center">
                {hasSpecialChar ? (
                  <CheckIcon className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <XIcon className="h-3 w-3 text-gray-400 mr-1" />
                )}
                <span
                  className={
                    hasSpecialChar
                      ? isDarkMode
                        ? 'text-green-400'
                        : 'text-green-600'
                      : 'text-gray-500'
                  }
                >
                  Ký tự đặc biệt
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Xác nhận mật khẩu
        </label>
        <div className="relative mt-1">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirm-password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${inputClasses}`}
            placeholder="••••••••"
            required
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? 'confirm-password-error' : undefined
            }
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? (
              <EyeOffIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className={errorClasses} id="confirm-password-error">
            {errors.confirmPassword}
          </p>
        )}
      </div>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="terms"
            type="checkbox"
            checked={acceptTerms}
            onChange={handleTermsChange}
            className={`focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : ''}`}
            required
            aria-invalid={!!errors.terms}
            aria-describedby={errors.terms ? 'terms-error' : undefined}
          />
        </div>
        <div className="ml-3 text-sm">
          <label
            htmlFor="terms"
            className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
          >
            Tôi đồng ý với{' '}
            <a
              href="#"
              className={
                isDarkMode
                  ? 'text-green-400 hover:text-green-300'
                  : 'text-green-600 hover:text-green-500'
              }
            >
              Điều khoản sử dụng
            </a>{' '}
            và{' '}
            <a
              href="#"
              className={
                isDarkMode
                  ? 'text-green-400 hover:text-green-300'
                  : 'text-green-600 hover:text-green-500'
              }
            >
              Chính sách bảo mật
            </a>
          </label>
          {errors.terms && (
            <p className={errorClasses} id="terms-error">
              {errors.terms}
            </p>
          )}
        </div>
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
          'Tạo tài khoản'
        )}
      </button>
    </form>
  )
}

export default RegisterForm
