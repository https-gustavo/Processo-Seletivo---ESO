import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import CartaoCosmetico from '../components/CartaoCosmetico'

export default function PerfilPublicoPage() {
  const { id } = useParams()
  const [user, setUser] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const u = await api.get(`/users`)
        const found = (u.data.items || []).find((it:any) => it.id === id)
        setUser(found || null)
        const inv = await api.get(`/users/${id}`)
        setItems(inv.data.items || [])
      } catch {
        setItems([])
      } finally { setLoading(false) }
    }
    load()
  }, [id])

  return (
    <section className="public-profile" aria-label="Perfil público">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="page-title">Perfil do Usuário</h1>
        <Link to="/users" className="btn btn-outline">Voltar</Link>
      </div>
      {user && (
        <div className="profile-summary" style={{ marginBottom: 12 }}>
          <strong>{user.email}</strong>
        </div>
      )}
      {loading ? (
        <div className="loading" role="status" aria-live="polite">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="empty" role="status" aria-live="polite">Este usuário não possui itens ativos.</div>
      ) : (
        <div className="grid" aria-label="Itens ativos do usuário">
          {items.map((c:any) => (
            <CartaoCosmetico key={`user-${String(id)}-${c.id}`} c={{ ...c, owned: true }} />
          ))}
        </div>
      )}
    </section>
  )
}

