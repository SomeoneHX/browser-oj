import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setNickname } from '../utils/storage'

export default function Login({ onLogin }) {
  const [name, setName] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setNickname(trimmed)
    if (onLogin) onLogin()
    navigate('/problems', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <i className="fas fa-code login-icon"></i>
          <h1>Browser OJ</h1>
          <p className="login-subtitle">在线评测系统</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <i className="fas fa-user"></i>
            <input
              type="text"
              placeholder="输入昵称开始"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-login" disabled={!name.trim()}>
            <i className="fas fa-paper-plane"></i>
            进入
          </button>
        </form>
      </div>
    </div>
  )
}
