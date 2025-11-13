import { useEffect, useState } from 'react'
import { api } from '../api'
import { formatVBucks } from '../utils/format'
import { useUserStore } from '../utils/userStore'

export default function MyPurchasesPage() {
  const [items, setItems] = useState<any[]>([])
  const credits = useUserStore(s => s.credits)
  const refreshCredits = useUserStore(s => s.refreshCredits)
  const [message, setMessage] = useState<string>('')
  const [devolvendoId, setDevolvendoId] = useState<string>('')

  useEffect(() => {
    api.get('/purchases/me').then(r => setItems(r.data.items)).catch(()=>setItems([]))
    refreshCredits()
  }, [refreshCredits])

  const total = items.reduce((acc, p) => acc + (p.price || 0), 0)
  const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString() : '-'

  const devolver = async (cosmeticId: string) => {
    try {
      setMessage('')
      setDevolvendoId(cosmeticId)
      const r = await api.post('/purchases/return', { cosmeticId })
      const returnedAt = r.data?.returnedAt || new Date().toISOString()
      setItems(prev => prev.map(it => it.cosmeticId === cosmeticId ? { ...it, returnedAt } : it))
      setMessage('Item devolvido e créditos reembolsados!')
      // Atualiza saldo visível
      await refreshCredits()
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

  return (
    <section className="purchases-section" aria-label="Minhas compras">
      <h1 className="page-title">Minhas compras</h1>

      <div className="grid" aria-label="Resumo de V-Bucks">
        <div className="card nuclear-panel">
          <div className="card-body">
            <div className="card-title">Saldo atual</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
        <span className="vbuck-label">VBUCK</span> <span className="vbucks-amount">{typeof credits === 'number' ? formatVBucks(credits) : '—'}</span>
            </div>
          </div>
        </div>
        <div className="card nuclear-panel">
          <div className="card-body">
            <div className="card-title">Total gasto</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
        <span className="vbuck-label">VBUCK</span> <span className="vbucks-amount">{formatVBucks(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty" role="status" aria-live="polite">Você ainda não comprou nada.</div>
      ) : (
        <div className="grid" id="purchases-grid" aria-label="Compras realizadas">
          {items.map(p => (
            <div className="card nuclear-panel" key={p.id}>
              <div className="card-body">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.cosmeticName || 'Item comprado'}
                    className="purchase-thumb"
                    style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '1 / 1' }}
                  />
                ) : null}
                <div className="card-title">{p.cosmeticName}</div>
                <div className="price-line">
        <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
        <span className="vbuck-label">VBUCK</span> <span className="vbucks-amount">{formatVBucks(p.price)}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Data:</strong> {formatDate(p.createdAt)}
                </div>
              <div style={{ marginTop: 4 }}>
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
      )}
      {message && (
        <div className="feedback" role="status" aria-live="polite" style={{ marginTop: 16 }}>
          {message}
        </div>
      )}
    </section>
  )
}
