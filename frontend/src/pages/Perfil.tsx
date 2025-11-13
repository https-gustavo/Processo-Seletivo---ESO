import { useEffect, useState } from 'react'
import { api } from '../api'
import { formatVBucks } from '../utils/format'

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<'historico'|'senha'>('historico')
  const [owned, setOwned] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwStatus, setPwStatus] = useState<{ ok?: boolean; error?: string }>({})
  const [message, setMessage] = useState('')
  const [devolvendoId, setDevolvendoId] = useState<string>('')

  const load = async () => {
    try {
      setLoading(true)
      const u = await api.get('/users/me')
      setUser(u.data)
      const inv = await api.get(`/users/${u.data.id}`)
      setOwned(inv.data.items || [])
      const hist = await api.get('/purchases/me')
      setPurchases(hist.data.items || [])
    } catch {
      // Falha silenciosa: mantemos a tela utilizável
    } finally { setLoading(false) }
  }

  const devolver = async (cosmeticId: string) => {
    try {
      setMessage('')
      setDevolvendoId(cosmeticId)
      await api.post('/purchases/return', { cosmeticId })
      setMessage('Item devolvido e créditos reembolsados!')
      // Recarrega perfil e histórico para refletir saldo e status
      await load()
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 404) {
        setMessage('Item não encontrado ou já devolvido.')
      } else if (status === 400) {
        setMessage('Requisição inválida para devolução.')
      } else if (status === 401) {
        setMessage('Sessão expirada. Entre novamente e tente devolver.')
      } else {
        setMessage('Falha ao devolver. Tente novamente.')
      }
    } finally { setDevolvendoId('') }
  }

  // Carrega perfil e histórico assim que a página monta
  useEffect(() => { load() }, [])

  return (
    <section className="profile-container">
      <h1 className="page-title">Meu Perfil</h1>
      {user && (
        <div className="profile-hero">
          <div className="profile-hero-left">
            <div className="profile-avatar" aria-hidden="true" />
            <div className="profile-summary">
              <strong className="profile-email">{user.email}</strong>
              <div className="profile-credits">
                <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
                <span className="vbuck-label">VBUCK</span>
                <span className="vbucks-amount">{user.credits}</span>
              </div>
            </div>
          </div>
          <div className="profile-hero-right">
            <div className="segmented" role="tablist">
              <button className={`segmented-btn ${tab==='historico'?'active':''}`} onClick={()=>setTab('historico')} role="tab" aria-selected={tab==='historico'}>Histórico</button>
              <button className={`segmented-btn ${tab==='senha'?'active':''}`} onClick={()=>setTab('senha')} role="tab" aria-selected={tab==='senha'}>Alterar senha</button>
            </div>
          </div>
        </div>
      )}
      {tab==='historico' ? (
        <div className="profile-grid history">
          {(purchases||[]).map((p:any) => (
            <div className="profile-card" key={p.id}>
              {p.imageUrl ? (
                <div className="profile-thumb"><img src={p.imageUrl} alt={p.cosmeticName || 'Item comprado'} /></div>
              ) : null}
              <div className="profile-card-body">
                <div className="profile-card-title">{p.cosmeticName}</div>
                <div className="price-line">
                  <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
                  <span className="vbuck-label">VBUCK</span>
                  <span className="vbucks-amount">{formatVBucks(p.price)}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Status:</strong> {p.returnedAt ? 'Devolvido' : 'Comprado'}
                </div>
                {!p.returnedAt && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      className="btn btn-danger"
                      onClick={() => devolver(p.cosmeticId)}
                      disabled={devolvendoId === p.cosmeticId}
                      aria-label={`Devolver ${p.cosmeticName}`}
                    >
                      {devolvendoId === p.cosmeticId ? 'Devolvendo...' : 'Devolver'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form
          className="card nuclear-panel"
          onSubmit={async (e) => {
            e.preventDefault()
            setPwStatus({})
            if (newPassword !== confirmPassword) {
              setPwStatus({ error: 'password_mismatch' })
              return
            }
            // Valida e troca a senha do usuário, tratando códigos conhecidos
            try {
              const r = await api.post('/me/change-password', { currentPassword, newPassword })
              if (r.data?.ok) {
                setPwStatus({ ok: true })
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
              } else {
                setPwStatus({ error: 'unknown_error' })
              }
            } catch (err: any) {
              const code = err?.response?.data?.error || 'unknown_error'
              setPwStatus({ error: code })
            }
          }}
          style={{ maxWidth: 480, margin: '0 auto' }}
        >
          <div className="card-body">
            <div className="card-title" style={{ textAlign: 'center' }}>Alterar senha</div>
            <label className="label">Senha atual</label>
            <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} required minLength={6} />
            <label className="label" style={{ marginTop: 12 }}>Nova senha</label>
            <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required minLength={6} />
            <label className="label" style={{ marginTop: 12 }}>Confirmar nova senha</label>
            <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required minLength={6} />
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button type="submit" className="btn primary">Salvar</button>
            </div>
            {pwStatus.error && (
              <div className="error" role="alert" style={{ marginTop: 10 }}>
                {pwStatus.error === 'invalid_current_password' ? 'Senha atual inválida.'
                  : pwStatus.error === 'password_mismatch' ? 'As senhas não conferem.'
                  : pwStatus.error === 'password_too_short' ? 'A nova senha é muito curta.'
                  : 'Erro ao alterar senha.'}
              </div>
            )}
            {pwStatus.ok && (
              <div className="success" role="status" style={{ marginTop: 10 }}>Senha alterada com sucesso.</div>
            )}
          </div>
        </form>
      )}
      {message && (
        <div className="feedback" role="status" aria-live="polite" style={{ marginTop: 16 }}>
          {message}
        </div>
      )}
    </section>
  )
}
