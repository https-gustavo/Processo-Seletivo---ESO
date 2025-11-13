import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api'
import { useUserStore } from '../utils/userStore'
import { formatVBucks } from '../utils/format'

export default function TopBar() {
  const [logged, setLogged] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const credits = useUserStore(s => s.credits)
  const refreshCredits = useUserStore(s => s.refreshCredits)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLogged(false); return }
    api.get('/users/me').then(() => setLogged(true)).catch(() => setLogged(false))
    // Sincroniza saldo ao montar
    refreshCredits()
  }, [refreshCredits, location.pathname])

  const logout = () => {
    localStorage.removeItem('token')
    setLogged(false)
    navigate('/login')
  }

  return (
    <header className="topbar" role="navigation" aria-label="Barra de navegação">
      <NavLink to="/" className="brand" style={{ textDecoration: 'none' }}>Loja</NavLink>
      <div className="vbucks-balance" aria-label="Saldo em V-Bucks" style={{ marginLeft: 12 }}>
        <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
        <span className="vbuck-label">VBUCK</span>
        <span className="vbucks-amount">{typeof credits === 'number' ? formatVBucks(credits) : '—'}</span>
      </div>
      <nav className="top-links" aria-label="Links principais">
        <NavLink to="/" className={({ isActive }) => `top-link ${isActive ? 'active' : ''}`}>Início</NavLink>
        <NavLink to="/cosmetics" className={({ isActive }) => `top-link ${isActive ? 'active' : ''}`}>Cosméticos</NavLink>
        <NavLink to="/users" className={({ isActive }) => `top-link ${isActive ? 'active' : ''}`}>Perfis</NavLink>
        {logged ? (
          <>
            <NavLink to="/me" className={({ isActive }) => `top-link ${isActive ? 'active' : ''}`}>Meu perfil</NavLink>
            <button className="top-link" onClick={logout} aria-label="Sair" style={{ background: 'transparent', border: '2px solid transparent' }}>Sair</button>
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => `top-link ${isActive ? 'active' : ''}`}>Entrar</NavLink>
        )}
      </nav>
    </header>
  )
}
