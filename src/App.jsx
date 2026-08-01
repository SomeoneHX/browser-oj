import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from './utils/storage'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import ProblemList from './pages/ProblemList'
import ProblemDetail from './pages/ProblemDetail'
import RecordList from './pages/RecordList'
import RecordDetail from './pages/RecordDetail'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn)

  const handleLogin = () => setLoggedIn(true)
  const handleLogout = () => setLoggedIn(false)

  return (
    <BrowserRouter>
      <AppLayout loggedIn={loggedIn} onLogin={handleLogin} onLogout={handleLogout} />
    </BrowserRouter>
  )
}

function AppLayout({ loggedIn, onLogin, onLogout }) {
  const location = useLocation()
  const showNavbar = location.pathname !== '/login'

  return (
    <>
      {showNavbar && <Navbar onLogout={onLogout} />}
      <main className={showNavbar ? 'main-content' : ''}>
        <Routes>
          <Route path="/" element={<Navigate to="/problems" replace />} />
          <Route path="/login" element={loggedIn ? <Navigate to="/problems" replace /> : <Login onLogin={onLogin} />} />
          <Route path="/problems" element={<ProblemList />} />
          <Route path="/problem/:problemId" element={<ProblemDetail />} />
          <Route path="/record" element={<RecordList />} />
          <Route path="/record/:recordId" element={<RecordDetail />} />
          <Route path="*" element={<Navigate to="/problems" replace />} />
        </Routes>
      </main>
    </>
  )
}
