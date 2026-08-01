import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn } from './utils/storage'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import ProblemList from './pages/ProblemList'
import ProblemDetail from './pages/ProblemDetail'
import RecordList from './pages/RecordList'
import RecordDetail from './pages/RecordDetail'

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn)

  const handleLogin = () => setLoggedIn(true)
  const handleLogout = () => setLoggedIn(false)

  return (
    <BrowserRouter>
      {loggedIn && <Navbar onLogout={handleLogout} />}
      <main className={loggedIn ? 'main-content' : ''}>
        <Routes>
          <Route path="/" element={loggedIn ? <Navigate to="/problems" replace /> : <Login onLogin={handleLogin} />} />
          <Route path="/problems" element={<ProtectedRoute><ProblemList /></ProtectedRoute>} />
          <Route path="/problem/:problemId" element={<ProtectedRoute><ProblemDetail /></ProtectedRoute>} />
          <Route path="/record" element={<ProtectedRoute><RecordList /></ProtectedRoute>} />
          <Route path="/record/:recordId" element={<ProtectedRoute><RecordDetail /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
