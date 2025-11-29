import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { CheckCircleIcon, XCircleIcon, MailIcon, ArrowLeftIcon } from 'lucide-react'
import { emailVerificationService } from '../../services/emailVerificationService'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/authService'
import { Toast } from '../../components/ui/Toast'

type VerificationStatus = 'loading' | 'success' | 'error' | 'pending'

export const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser, user } = useAuth()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  // Get token and uid from URL parameters
  const token = searchParams.get('token')
  const uid = searchParams.get('uid')

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Check if user is already verified and redirect
  useEffect(() => {
    // Nếu user đã verified, redirect ngay về trang chính
    if (user?.isVerified) {
      const from = (location.state as any)?.from?.pathname || '/home'
      navigate(from, { replace: true })
      return
    }
  }, [user, navigate, location])

  // Auto-verify if token and uid are present
  useEffect(() => {
    // Nếu user đã verified, không cần verify nữa
    if (user?.isVerified) {
      return
    }

    if (token && uid) {
      handleEmailVerification(token, uid)
    } else {
      setStatus('pending')
      setMessage('Không tìm thấy thông tin xác thực trong URL')
      // Tự động lấy email từ user đã đăng nhập
      if (user?.email) {
        setEmail(user.email)
      }
    }
  }, [token, uid, user])

  const handleEmailVerification = async (token: string, uid: string) => {
    try {
      setStatus('loading')
      const response = await emailVerificationService.verifyEmail(token, uid)
      
      // Chỉ set success và redirect nếu verification thực sự thành công
      if (response && response.data && response.data.user) {
        setStatus('success')
        setMessage('Email đã được xác thực thành công!')
        setEmail(response.data.user.email)
        
        showToast('Email đã được xác thực thành công!', 'success')
        
        // Refresh user data to update isVerified status
        try {
          await refreshUser()
        } catch (error) {
          console.error('Failed to refresh user:', error)
        }
        
        // Chỉ redirect khi thành công, sau 2 giây
        const from = (location.state as any)?.from?.pathname || '/home'
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 2000)
      } else {
        // Nếu response không hợp lệ, coi như thất bại
        throw new Error('Invalid response from server')
      }
      
    } catch (error: any) {
      console.error('Email verification error:', error)
      
      // Nếu token đã được sử dụng (400), kiểm tra xem user đã verified chưa
      // Nếu đã verified, coi như thành công và redirect luôn (không hiển thị lỗi)
      if (error.response?.status === 400) {
        try {
          // Lấy user profile trực tiếp để check isVerified
          const profileResponse = await authService.getProfile()
          const currentUser = profileResponse.data
          
          // Nếu user đã verified, coi như thành công và redirect luôn
          if (currentUser?.isVerified) {
            // Refresh user state
            await refreshUser()
            
            // Set success nhưng không hiển thị message, redirect ngay
            setStatus('success')
            setMessage('Email đã được xác thực!')
            setEmail(currentUser.email)
            
            // Redirect ngay lập tức, không cần đợi
            const from = (location.state as any)?.from?.pathname || '/home'
            navigate(from, { replace: true })
            return
          }
        } catch (profileError) {
          console.error('Failed to get user profile:', profileError)
          // Nếu không lấy được profile, tiếp tục hiển thị lỗi
        }
        
        // Nếu user chưa verified hoặc không lấy được profile, hiển thị lỗi
        setStatus('error')
        setMessage('Token xác thực không hợp lệ hoặc đã hết hạn')
        showToast('Xác thực email thất bại', 'error')
        
        // Lấy email từ user nếu có để hiển thị form gửi lại
        if (user?.email) {
          setEmail(user.email)
        }
      } else if (error.response?.status === 404) {
        setStatus('error')
        setMessage('Không tìm thấy thông tin xác thực')
        showToast('Xác thực email thất bại', 'error')
        
        if (user?.email) {
          setEmail(user.email)
        }
      } else {
        setStatus('error')
        setMessage('Có lỗi xảy ra khi xác thực email. Vui lòng thử lại.')
        showToast('Xác thực email thất bại', 'error')
        
        if (user?.email) {
          setEmail(user.email)
        }
      }
    }
  }

  const handleResendEmail = async () => {
    if (!email) {
      showToast('Vui lòng nhập email để gửi lại', 'error')
      return
    }

    try {
      setIsResending(true)
      await emailVerificationService.resendVerificationEmail(email)
      showToast('Email xác thực đã được gửi lại', 'success')
    } catch (error: any) {
      console.error('Resend email error:', error)
      
      if (error.response?.status === 429) {
        showToast('Vui lòng đợi một chút trước khi gửi lại', 'error')
      } else {
        showToast('Không thể gửi email. Vui lòng thử lại sau', 'error')
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/auth')
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
        )
      case 'success':
        return <CheckCircleIcon className="h-16 w-16 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-16 w-16 text-red-500" />
      case 'pending':
        return <MailIcon className="h-16 w-16 text-blue-500" />
      default:
        return <MailIcon className="h-16 w-16 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'pending':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Xác thực Email
          </h1>
          <p className={`text-sm ${getStatusColor()}`}>
            {message || 'Đang xử lý xác thực email...'}
          </p>
        </div>

        {/* Content based on status */}
        {status === 'success' && (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                🎉 Tài khoản của bạn đã được xác thực thành công!
              </p>
              {email && (
                <p className="text-green-700 text-xs mt-1">
                  Email: {email}
                </p>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát...
            </p>
            <button
              onClick={handleBackToLogin}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                ❌ Không thể xác thực email
              </p>
            </div>
            
            {/* Resend email form */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email để gửi lại xác thực:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={isResending || !email}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isResending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
              </button>
              
              <button
                onClick={handleBackToLogin}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm mb-2">
                📧 Vui lòng kiểm tra email và nhấp vào liên kết xác thực
              </p>
              <p className="text-blue-700 text-xs">
                Click để nhận link xác thực trong mail
              </p>
              {email && (
                <p className="text-blue-600 text-xs mt-2 font-medium">
                  Email: {email}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={isResending || !email}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isResending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
              </button>
              
              <button
                onClick={handleBackToLogin}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Đang xác thực email của bạn...
            </p>
          </div>
        )}

        {/* Back button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBackToLogin}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Quay lại trang chủ
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default EmailVerificationPage
