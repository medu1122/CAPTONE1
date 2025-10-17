import React, { useState } from 'react'
import { MailIcon, CheckCircleIcon } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
interface VerificationScreenProps {
  email: string
  isDarkMode: boolean
  onResendEmail: () => void
  onBackToLogin: () => void
}
export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  email,
  isDarkMode,
  onResendEmail,
  onBackToLogin,
}) => {
  const { resendVerificationEmail } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const handleResendEmail = async () => {
    try {
      setIsResending(true)
      setResendMessage('')
      await resendVerificationEmail(email)
      setResendMessage('Email xác thực đã được gửi lại thành công!')
      onResendEmail()
    } catch (error: any) {
      console.error('Resend email error:', error)
      if (error.response?.status === 429) {
        setResendMessage('Vui lòng đợi một chút trước khi gửi lại')
      } else {
        setResendMessage('Không thể gửi email. Vui lòng thử lại sau')
      }
    } finally {
      setIsResending(false)
    }
  }

  const buttonClasses = isDarkMode
    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-800 disabled:bg-gray-700'
    : 'bg-green-600 hover:bg-green-700 focus:ring-green-300 disabled:bg-gray-400'
  const secondaryButtonClasses = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-white'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
  return (
    <div className="p-6 text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
        <MailIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
      </div>
      <h3
        className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      >
        Xác thực email của bạn
      </h3>
      <div className="mt-2">
        <p
          className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          Chúng tôi đã gửi một email xác thực đến
        </p>
        <p
          className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
        >
          {email}
        </p>
        <p
          className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          Vui lòng kiểm tra hộp thư đến và nhấp vào liên kết xác thực để hoàn
          tất quá trình đăng ký.
        </p>
      </div>
      <div
        className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-green-50'}`}
      >
        <div className="flex items-center">
          <CheckCircleIcon
            className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'} mr-2`}
          />
          <p
            className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Lưu ý: Email xác thực có hiệu lực trong 24 giờ
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handleResendEmail}
          disabled={isResending}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${buttonClasses}`}
        >
          {isResending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
        </button>
        
        {resendMessage && (
          <div className={`text-sm ${resendMessage.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>
            {resendMessage}
          </div>
        )}
        <button
          type="button"
          onClick={onBackToLogin}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none transition-colors ${secondaryButtonClasses}`}
        >
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  )
}

export default VerificationScreen
