import React, { useEffect, useState } from 'react'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { useNavigate } from 'react-router-dom'
import { UsersTab } from './components/UsersTab'
import { AnalysisTab } from './components/AnalysisTab'
import { CommunityTab } from './components/CommunityTab'
import { ComplaintsTab } from './components/ComplaintsTab'
type TabType = 'users' | 'analysis' | 'community' | 'complaints'
export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('users')
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated')
    if (authStatus !== 'true') {
      navigate('/auth')
      return
    }
    setIsAuthenticated(true)
    // TODO: Check if user is admin
    // For now, allow all authenticated users
  }, [navigate])
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userEmail')
    setIsAuthenticated(false)
    navigate('/auth')
  }
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
  if (!isAuthenticated) {
    return null
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={isAuthenticated} onLogout={handleLogout} />

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
