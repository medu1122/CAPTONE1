import React, { useState } from 'react'
import LoginForm from './LoginFrom'
import RegisterForm from './RegisterFrom'
import VerificationScreen from './VerificationScreen'
interface AuthCardProps {
  isDarkMode: boolean
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}
type AuthTab = 'login' | 'register'
type AuthView = AuthTab | 'verification'
export const AuthCard: React.FC<AuthCardProps> = ({
  isDarkMode,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [view, setView] = useState<AuthView>('login')
  const [email, setEmail] = useState('')
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
      className={`w-full max-w-md rounded-xl overflow-hidden ${cardClasses}`}
    >
      {/* Logo */}
      <div className="flex justify-center py-6">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7"
          >
            <path d="M6.8 22c-1.3 0-1.7-.1-2.2-.5-.5-.3-.8-.8-1.1-1.8L2 14.3c-.3-1.3 0-1.7.3-2.2.4-.5 1-.8 2.1-1.1L12.4 9c1.3-.3 1.7 0 2.2.3.5.4.8 1 1.1 2.1l1.6 5.4c.3 1.3 0 1.7-.3 2.2-.4.5-1 .8-2.1 1.1L6.8 22z" />
            <path d="M2 14.3l10.4-2" />
            <path d="M15.7 11.3L20 8.1c1.3-.8 1.9-.7 2.5-.3.7.4 1 1.1 1 2.5V16c0 1.4-.3 2.1-1 2.5-.7.4-1.2.5-2.5-.3L15.7 15" />
          </svg>
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
        <VerificationScreen
          email={email}
          isDarkMode={isDarkMode}
          onResendEmail={handleResendEmail}
          onBackToLogin={() => setView('login')}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
