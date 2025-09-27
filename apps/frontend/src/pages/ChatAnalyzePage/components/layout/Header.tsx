import React, { useState } from 'react'
import { UserIcon, Menu, X } from 'lucide-react'

export const Header: React.FC = () => {
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
      <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
        <a href="#" className="text-gray-600 hover:text-green-600">
          Cộng đồng
        </a>
        <a href="#" className="text-gray-600 hover:text-green-600">
          Thị trường
        </a>
        <a href="#" className="text-gray-600 hover:text-green-600">
          Kiến thức
        </a>
      </nav>

      {/* Desktop Auth buttons */}
      <div className="hidden md:flex items-center gap-3">
        <a href="#" className="text-gray-700 hover:text-green-600">
          Đăng nhập
        </a>
        <a
          href="#"
          className="bg-green-600 text-white px-4 py-1.5 rounded-full hover:bg-green-700 flex items-center gap-1"
        >
          <span>Đăng ký</span>
          <UserIcon size={16} />
        </a>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-md z-50">
          <div className="flex flex-col p-4">
            <nav className="flex flex-col space-y-4 mb-4">
              <a href="#" className="text-gray-600 hover:text-green-600 py-2">
                Cộng đồng
              </a>
              <a href="#" className="text-gray-600 hover:text-green-600 py-2">
                Thị trường
              </a>
              <a href="#" className="text-gray-600 hover:text-green-600 py-2">
                Kiến thức
              </a>
            </nav>
            <div className="flex flex-col space-y-3">
              <a href="#" className="text-gray-700 hover:text-green-600 py-2">
                Đăng nhập
              </a>
              <a
                href="#"
                className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 flex items-center justify-center gap-1"
              >
                <span>Đăng ký</span>
                <UserIcon size={16} />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}