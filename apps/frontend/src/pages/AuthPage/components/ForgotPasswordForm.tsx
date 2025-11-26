import React, { useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { authService } from '../../../services/authService'

interface ForgotPasswordFormProps {
  isDarkMode: boolean
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  onBack: () => void
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  isDarkMode,
  showToast,
  onBack,
}) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const validateEmail = (email: string) => {
    if (!email) return 'Email không được để trống'
    if (!/\S+@\S+\.\S+/.test(email)) return 'Email không hợp lệ'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailError = validateEmail(email)
    if (emailError) {
      showToast(emailError, 'error')
      return
    }

    setLoading(true)
    try {
      await authService.passwordReset.requestReset(email)
      setEmailSent(true)
      showToast('Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.', 'success')
    } catch (error: any) {
      console.error('Password reset request error:', error)
      // Backend returns 200 even if email doesn't exist (security)
      if (error.response?.status === 200) {
        setEmailSent(true)
        showToast('Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.', 'info')
      } else {
        showToast(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'

  const buttonClasses = isDarkMode
    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-800 disabled:bg-gray-700 disabled:text-gray-500'
    : 'bg-green-600 hover:bg-green-700 focus:ring-green-300 disabled:bg-gray-200 disabled:text-gray-500'

  if (emailSent) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className={`mt-4 text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Email đã được gửi
          </h3>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong>{email}</strong>.
            Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn.
          </p>
        </div>
        <button
          onClick={onBack}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${buttonClasses}`}
        >
          <ArrowLeftIcon size={16} />
          Quay lại đăng nhập
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-2 text-sm font-medium mb-4 ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'}`}
        >
          <ArrowLeftIcon size={16} />
          Quay lại
        </button>
        <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Quên mật khẩu?
        </h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Nhập email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
        </p>
      </div>
      <div>
        <label
          htmlFor="reset-email"
          className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Email
        </label>
        <input
          type="email"
          id="reset-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${inputClasses}`}
          placeholder="your.email@example.com"
          required
        />
      </div>
      <button
        type="submit"
        disabled={!email || loading}
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
            Đang gửi...
          </>
        ) : (
          'Gửi liên kết đặt lại mật khẩu'
        )}
      </button>
    </form>
  )
}

export default ForgotPasswordForm

