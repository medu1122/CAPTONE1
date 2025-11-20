import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import { PlantAnalysisPage } from './pages/PlantAnalysisPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { CommunityPage } from './pages/CommunityPage'
import { AuthPage } from './pages/AuthPage'
import { EmailVerificationPage } from './pages/EmailVerificationPage'
import { LogoutPage } from './pages/LogoutPage'
import { ProfilePage } from './pages/ProfilePage/ProfilePage'
import { MyPlantsPage } from './pages/MyPlantsPage/MyPlantsPage'
import { PlantDetailPage } from './pages/PlantDetailPage/PlantDetailPage'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
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
          {/* Plant Analysis Page - Image analysis only */}
          <Route path="/analyze" element={<PlantAnalysisPage />} />
          
          {/* Knowledge Page - Q&A Chatbot */}
          <Route path="/knowledge" element={<KnowledgePage />} />
          
          {/* Redirect old chat routes to new pages */}
          <Route path="/chat" element={<Navigate to="/analyze" replace />} />
          <Route path="/ChatAnalyzePage" element={<Navigate to="/analyze" replace />} />
          <Route 
            path="/community" 
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-plants" 
            element={
              <ProtectedRoute>
                <MyPlantsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-plants/:id" 
            element={
              <ProtectedRoute>
                <PlantDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
