import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import { PlantAnalysisPage } from './pages/PlantAnalysisPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { CommunityPage } from './pages/CommunityPage'
import { AuthPage } from './pages/AuthPage'
import { EmailVerificationPage } from './pages/EmailVerificationPage'
import { LogoutPage } from './pages/LogoutPage'
import { ProfilePage } from './pages/ProfilePage/ProfilePage'
import { ResetPasswordPage } from './pages/ResetPasswordPage/ResetPasswordPage'
import ChangePasswordPage from './pages/ChangePasswordPage/ChangePasswordPage'
import { MyPlantsPage } from './pages/MyPlantsPage/MyPlantsPage'
import { SettingsPage } from './pages/SettingsPage'
import { PlantDetailPage } from './pages/PlantDetailPage/PlantDetailPage'
import { PublicProfilePage } from './pages/PublicProfilePage'
import { VietnamMapPage } from './pages/VietnamMapPage/VietnamMapPage'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import VerifiedRoute from './components/VerifiedRoute'
import AdminRoute from './components/AdminRoute'
import { AdminDashboardPage } from './pages/AdminDashboardPage/AdminDashboardPage'
import { TaskCompletedPage } from './pages/TaskCompletedPage/TaskCompletedPage'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/task-completed" element={<TaskCompletedPage />} />
          {/* Public Profile Page - View other users' profiles */}
          <Route path="/users/:userId" element={<PublicProfilePage />} />
          {/* Plant Analysis Page - Image analysis only - Requires verification */}
          <Route 
            path="/analyze" 
            element={
              <VerifiedRoute>
                <PlantAnalysisPage />
              </VerifiedRoute>
            } 
          />
          
          {/* Knowledge Page - Q&A Chatbot - Requires verification */}
          <Route 
            path="/knowledge" 
            element={
              <VerifiedRoute>
                <KnowledgePage />
              </VerifiedRoute>
            } 
          />
          
          {/* Redirect old chat routes to new pages */}
          <Route path="/chat" element={<Navigate to="/analyze" replace />} />
          <Route path="/ChatAnalyzePage" element={<Navigate to="/analyze" replace />} />
          
          {/* Vietnam Map Page - Public access */}
          <Route path="/map" element={<VietnamMapPage />} />
          
          {/* Community Page - Only requires login, no verification needed */}
          <Route 
            path="/community" 
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Profile Page - Requires verification */}
          <Route 
            path="/profile" 
            element={
              <VerifiedRoute>
                <ProfilePage />
              </VerifiedRoute>
            } 
          />
          
          {/* Settings Page - Requires verification */}
          <Route 
            path="/settings" 
            element={
              <VerifiedRoute>
                <SettingsPage />
              </VerifiedRoute>
            } 
          />
          
          {/* Change Password Page - Requires verification */}
          <Route 
            path="/change-password" 
            element={
              <VerifiedRoute>
                <ChangePasswordPage />
              </VerifiedRoute>
            } 
          />
          
          {/* My Plants Pages - Requires verification */}
          <Route 
            path="/my-plants" 
            element={
              <VerifiedRoute>
                <MyPlantsPage />
              </VerifiedRoute>
            } 
          />
          <Route 
            path="/my-plants/:id" 
            element={
              <VerifiedRoute>
                <PlantDetailPage />
              </VerifiedRoute>
            } 
          />
          
          {/* Admin Dashboard - Requires admin role */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } 
          />
          
          <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
        </Routes>
      </div>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
