import { NavLink, Link } from 'react-router-dom'
import { getNickname, clearNickname } from '../utils/storage'

export default function Navbar({ onLogout }) {
  const nickname = getNickname()

  const handleLogout = () => {
    clearNickname()
    if (onLogout) onLogout()
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <NavLink to="/problems" className="navbar-brand">
            <i className="fas fa-code"></i>
            <span>Browser OJ</span>
          </NavLink>
          <div className="navbar-links">
            <NavLink to="/problems" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="fas fa-list"></i>
              题目
            </NavLink>
            <NavLink to="/record" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className="fas fa-history"></i>
              评测记录
            </NavLink>
          </div>
        </div>
        <div className="navbar-right">
          {nickname && (
            <>
              <span className="navbar-user">
                <i className="fas fa-user-circle"></i>
                {nickname}
              </span>
              <button className="btn-logout" onClick={handleLogout} title="退出">
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </>
          )}
          {!nickname && (
            <Link to="/login" className="navbar-login">
              <i className="fas fa-sign-in-alt"></i>
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
