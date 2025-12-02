import React, { useEffect, useState } from 'react'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { useNavigate } from 'react-router-dom'
import { UsersTab } from './components/UsersTab'
import { AnalysisTab } from './components/AnalysisTab'
import { CommunityTab } from './components/CommunityTab'
import { ComplaintsTab } from './components/ComplaintsTab'
import { authService } from '../../services/authService'

type TabType = 'users' | 'analysis' | 'community' | 'complaints'

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('users')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          navigate('/auth')
          return
        }

        // Get user profile to check admin role
        const profileResponse = await authService.getProfile()
        const userRole = profileResponse.data?.role

        if (userRole !== 'admin') {
          alert('Bạn không có quyền truy cập trang này')
          navigate('/')
          return
        }

        setIsAdmin(true)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error checking auth:', error)
        navigate('/auth')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [navigate])
  const tabs = [
    {
      id: 'users' as TabType,
      label: 'Quản lý Người dùng',
      icon: '👥',
    },
    {
      id: 'analysis' as TabType,
      label: 'Thống kê Phân tích',
      icon: '📊',
    },
    {
      id: 'community' as TabType,
      label: 'Thống kê Cộng đồng',
      icon: '🌐',
    },
    {
      id: 'complaints' as TabType,
      label: 'Khiếu nại & Báo cáo',
      icon: '📋',
    },
  ]
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Quản lý hệ thống và người dùng</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'text-green-600 border-green-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'analysis' && <AnalysisTab />}
          {activeTab === 'community' && <CommunityTab />}
          {activeTab === 'complaints' && <ComplaintsTab />}
        </div>
      </main>
    </div>
  )
}
