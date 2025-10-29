import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import { ChatAnalyzePage } from './pages/ChatAnalyzePage/ChatAnalyzePage'
import { AuthPage } from './pages/AuthPage'
import { EmailVerificationPage } from './pages/EmailVerificationPage'
import { LogoutPage } from './pages/LogoutPage'
import { AuthProvider } from './contexts/AuthContext'
import { ChatAnalyzeProvider } from './contexts/ChatAnalyzeContext'
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
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatAnalyzeProvider>
                  <ChatAnalyzePage />
                </ChatAnalyzeProvider>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ChatAnalyzePage" 
            element={
              <ProtectedRoute>
                <ChatAnalyzeProvider>
                  <ChatAnalyzePage />
                </ChatAnalyzeProvider>
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
