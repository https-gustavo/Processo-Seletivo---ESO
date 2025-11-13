import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      const r = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', r.data.token)
      if (remember) localStorage.setItem('remember', '1')
      setMessage('Login realizado')
      navigate('/home')
    } catch (err: any) {
      const code = err?.response?.data?.error
      if (code === 'invalid_credentials') setMessage('Credenciais inválidas')
      else if (code === 'invalid_body') setMessage('Informe email e senha válidos')
      else setMessage('Falha no login')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email.trim().length > 3 && password.trim().length >= 6

  return (
    <main className="login-page">
      <section className="login-hero" aria-hidden="true" />
      <section className="login-content" aria-label="Área de autenticação">
        <form onSubmit={onSubmit} className="login-card" aria-describedby="login-hint">
          <h1 className="login-title">Bem-vindo de volta</h1>
          <p id="login-hint" className="login-subtitle">Entre para acessar seu catálogo e compras.</p>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                required
                minLength={6}
              />
              <button type="button" className="btn small" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          <label className="inline-check">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            Manter conectado
          </label>

          <button type="submit" className="btn btn-primary" disabled={!canSubmit || loading} aria-busy={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {message && (
            <div className="form-message" role="alert" aria-live="polite">{message}</div>
          )}

          <div className="login-actions">
            <Link to="/register" className="link">Criar conta</Link>
            <span className="muted">•</span>
            <a href="#" className="link" onClick={e => e.preventDefault()}>Esqueci minha senha</a>
          </div>
        </form>
      </section>
    </main>
  )
}
