import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <main className="register-page">
      <section className="register-content" aria-label="Área de cadastro">
        <form onSubmit={onSubmit} className="register-card" aria-describedby="register-hint">
          <h1 className="register-title">Criar conta</h1>
          <p id="register-hint" className="register-subtitle">Cadastre-se para acessar o catálogo e suas compras.</p>

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
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={!canSubmit || loading} aria-busy={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>

          {message && (
            <div className={`form-message ${variant}`} role="alert" aria-live="polite">{message}</div>
          )}

          <div className="register-actions">
            <Link to="/login" className="link">Já tenho conta</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
