import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserIcon, Menu, X } from 'lucide-react'
import { useAuth } from '../../../../contexts/AuthContext'
import { UserMenu } from '../../../../components/UserMenu'

export const Header: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <header className="bg-white border-b py-3 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img
          src="/src/assets/icons/iconHeader_GreenGrow.png"
          alt="GreenGrow Logo"
          className="h-6 w-auto"
        />
        <span className="font-medium text-green-600 text-lg">GreenGrow</span>
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden flex items-center justify-center p-2"
        onClick={toggleMobileMenu}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
        <Link 
          to="/analyze" 
          className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors group"
        >
          <span className="text-xl">🔬</span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Phân Tích</span>
            <span className="text-xs text-gray-500 group-hover:text-green-500">Nhận diện & bệnh</span>
          </div>
        </Link>
        <Link 
          to="/knowledge" 
          className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors group"
        >
          <span className="text-xl">📚</span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Kiến Thức</span>
            <span className="text-xs text-gray-500 group-hover:text-green-500">Hỏi đáp AI</span>
          </div>
        </Link>
        <Link 
          to="/community" 
          className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors group"
        >
          <span className="text-xl">👥</span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Cộng Đồng</span>
            <span className="text-xs text-gray-500 group-hover:text-green-500">Chia sẻ kinh nghiệm</span>
          </div>
        </Link>
        <Link 
          to="/my-plants" 
          className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors group"
        >
          <span className="text-xl">🌿</span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Vườn Của Tôi</span>
            <span className="text-xs text-gray-500 group-hover:text-green-500">Quản lý cây trồng</span>
          </div>
        </Link>
      </nav>

      {/* Desktop Auth buttons */}
      <div className="hidden md:flex items-center gap-3">
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <>
            <Link to="/auth" className="text-gray-700 hover:text-green-600">
              Đăng nhập
            </Link>
            <Link
              to="/auth"
              className="bg-green-600 text-white px-4 py-1.5 rounded-full hover:bg-green-700 flex items-center gap-1"
            >
              <span>Đăng ký</span>
              <UserIcon size={16} />
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-md z-50">
          <div className="flex flex-col p-4">
            <nav className="flex flex-col space-y-3 mb-4">
              <Link 
                to="/analyze" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-2xl">🔬</span>
                <div>
                  <div className="font-medium text-gray-900">Phân Tích</div>
                  <div className="text-xs text-gray-500">Nhận diện cây & phát hiện bệnh</div>
                </div>
              </Link>
              <Link 
                to="/knowledge" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-2xl">📚</span>
                <div>
                  <div className="font-medium text-gray-900">Kiến Thức</div>
                  <div className="text-xs text-gray-500">Hỏi đáp với AI</div>
                </div>
              </Link>
              <Link 
                to="/community" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-medium text-gray-900">Cộng Đồng</div>
                  <div className="text-xs text-gray-500">Chia sẻ kinh nghiệm</div>
                </div>
              </Link>
              <Link 
                to="/my-plants" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-2xl">🌿</span>
                <div>
                  <div className="font-medium text-gray-900">Vườn Của Tôi</div>
                  <div className="text-xs text-gray-500">Quản lý cây trồng</div>
                </div>
              </Link>
            </nav>
            <div className="flex flex-col space-y-3">
              {isAuthenticated ? (
                <div className="py-2" onClick={() => setMobileMenuOpen(false)}>
                  <UserMenu />
                </div>
              ) : (
                <>
                  <Link to="/auth" className="text-gray-700 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                    Đăng nhập
                  </Link>
                  <Link
                    to="/auth"
                    className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 flex items-center justify-center gap-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Đăng ký</span>
                    <UserIcon size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}