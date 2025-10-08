import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import { ChatAnalyzePage } from './pages/ChatAnalyzePage/ChatAnalyzePage'
import { AuthPage } from './pages/AuthPage'
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/chat" element={<ChatAnalyzePage />} />
        <Route path="/ChatAnalyzePage" element={<ChatAnalyzePage />} />
        <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
      </Routes>
    </div>
  )
}

export default App
