import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoginForm from './LoginFrom'
import RegisterForm from './RegisterFrom'
import VerificationScreen from './VerificationScreen'
import ForgotPasswordForm from './ForgotPasswordForm'
import iconHeader from '../../../assets/icons/iconHeader_GreenGrow.png'
interface AuthCardProps {
  isDarkMode: boolean
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}
type AuthTab = 'login' | 'register'
type AuthView = AuthTab | 'verification' | 'forgot-password'
export const AuthCard: React.FC<AuthCardProps> = ({
  isDarkMode,
  showToast,
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [view, setView] = useState<AuthView>('login')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const viewParam = searchParams.get('view')
    if (viewParam === 'forgot-password') {
      setView('forgot-password')
    }
  }, [searchParams])
  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab)
    setView(tab)
  }
  const handleRegistrationSuccess = (userEmail: string) => {
    setEmail(userEmail)
    setView('verification')
  }
  const handleResendEmail = () => {
    // Mock implementation - would connect to real API
    showToast('Email xác thực đã được gửi lại', 'success')
  }
  const cardClasses = isDarkMode
    ? 'bg-gray-800 shadow-lg border border-gray-700'
    : 'bg-white shadow-lg border border-gray-100'
  const tabClasses = (tab: AuthTab) => {
    const isActive = activeTab === tab
    const baseClasses =
      'py-3 font-medium text-center transition-colors duration-200 flex-1'
    if (isDarkMode) {
      return `${baseClasses} ${isActive ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-300'}`
    }
    return `${baseClasses} ${isActive ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`
  }
  return (
    <div
      className={`w-full max-w-md rounded-xl ${cardClasses} relative overflow-visible`}
    >
      {/* Logo */}
      <div className="flex justify-center py-8 overflow-visible relative z-50">
        <div className="relative w-12 h-12 bg-green-500 rounded-full flex items-center justify-center overflow-visible">
          {/* Mũ Santa */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-[9999]" style={{ pointerEvents: 'none' }}>
            <svg
              width="55"
              height="44"
              viewBox="0 0 40 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="animate-bounce drop-shadow-lg"
              style={{ animationDuration: '2s' }}
            >
              {/* Phần đỏ của mũ */}
              <path
                d="M20 2 L8 16 L32 16 Z"
                fill="#DC2626"
                stroke="#1F2937"
                strokeWidth="1.5"
              />
              {/* Viền trắng dưới mũ */}
              <ellipse cx="20" cy="16" rx="14" ry="3" fill="white" stroke="#1F2937" strokeWidth="1" />
              {/* Quả bông trắng trên đỉnh mũ */}
              <circle cx="20" cy="2" r="3" fill="white" stroke="#1F2937" strokeWidth="1" />
            </svg>
          </div>
          <img 
            src={iconHeader} 
            alt="GreenGrow Icon" 
            className="w-8 h-8"
          />
        </div>
        <div className="ml-2 flex flex-col justify-center">
          <h1
            className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          >
            GreenGrow
          </h1>
          <p
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Cộng đồng nông nghiệp
          </p>
        </div>
      </div>
      {view === 'verification' ? (
        <div className="overflow-hidden">
          <VerificationScreen
            email={email}
            isDarkMode={isDarkMode}
            onResendEmail={handleResendEmail}
            onBackToLogin={() => setView('login')}
          />
        </div>
      ) : view === 'forgot-password' ? (
        <div className="p-6 overflow-hidden">
          <ForgotPasswordForm
            isDarkMode={isDarkMode}
            showToast={showToast}
            onBack={() => {
              setView('login')
              setSearchParams({})
            }}
          />
        </div>
      ) : (
        <div className="overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={tabClasses('login')}
              onClick={() => handleTabChange('login')}
            >
              Đăng nhập
            </button>
            <button
              className={tabClasses('register')}
              onClick={() => handleTabChange('register')}
            >
              Đăng ký
            </button>
          </div>
          {/* Form Content */}
          <div className="p-6">
            {activeTab === 'login' ? (
              <LoginForm isDarkMode={isDarkMode} showToast={showToast} />
            ) : (
              <RegisterForm
                isDarkMode={isDarkMode}
                showToast={showToast}
                onRegistrationSuccess={handleRegistrationSuccess}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
