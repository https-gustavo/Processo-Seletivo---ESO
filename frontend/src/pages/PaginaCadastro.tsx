import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [variant, setVariant] = useState<'success'|'error'|''>('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setVariant('')
    setLoading(true)
    try {
      await api.post('/auth/register', { email, password })
      setMessage('Cadastro realizado! Você recebeu 10.000 V-Bucks.')
      setVariant('success')
    } catch (err: any) {
      const code = err?.response?.data?.error
      if (code === 'email_in_use') setMessage('Este e-mail já está em uso.')
      else if (code === 'invalid_body' || code === 'invalid_email' || code === 'password_too_short') setMessage('Informe email válido e senha com 6+ caracteres.')
      else setMessage('Falha no cadastro. Tente novamente.')
      setVariant('error')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email.trim().length > 3 && password.trim().length >= 6

  return (
    <main className="login-page">
      <section className="login-hero" aria-hidden="true" />
      <section className="login-content" aria-label="Área de cadastro">
        <form onSubmit={onSubmit} className="login-card" aria-describedby="register-hint">
          <h1 className="login-title">Criar conta</h1>
          <p id="register-hint" className="login-subtitle">Cadastre-se para acessar o catálogo e suas compras.</p>

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
                autoComplete="new-password"
                required
                minLength={6}
              />
              <button type="button" className="btn small" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          <button type="submit" className="btn btn-primary" disabled={!canSubmit || loading} aria-busy={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>

          {message && (
            <div className={`form-message ${variant}`} role="alert" aria-live="polite">{message}</div>
          )}

          <div className="login-actions">
            <Link to="/login" className="link">Já tenho conta</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
