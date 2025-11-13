// Página pública de usuários — lista perfis paginados e acesso a “Ver perfil”.
// Comentários autorais do processo seletivo (por Gustavo Menezes).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

type User = { id: string; email: string; credits: number; createdAt: string }

export default function UsuariosPage() {
  const [items, setItems] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const load = async (pg: number) => {
    setLoading(true)
    try {
      const r = await api.get('/users', { params: { page: pg, pageSize: 20 } })
      setItems(r.data.items || [])
      setTotalPages(Math.max(1, Number(r.data?.totalPages || 1)))
    } catch {
      setItems([])
    } finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  return (
    <section className="users-list" aria-label="Perfis de usuários">
      <h1 className="page-title">Perfis de Usuários</h1>
      {loading ? (
        <div className="loading" role="status" aria-live="polite">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="empty" role="status" aria-live="polite">Nenhum usuário encontrado.</div>
      ) : (
        <ul className="users-ul" id="users-list" aria-label="Lista de usuários">
          {items.map(u => (
            <li className="user-item" key={u.id}>
              <div className="user-item-content">
                <div className="user-main">
                  <span className="user-email">{u.email}</span>
                  <span className="user-meta">Cadastrado em {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="user-actions">
                  <div className="user-credits" aria-label="Créditos em V-Bucks">
                    <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
                    <span className="vbuck-label">VBUCK</span>
                    <span className="vbucks-amount">{u.credits}</span>
                  </div>
                  <Link to={`/users/${u.id}`} className="btn btn-outline">Ver perfil</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="pager" aria-label="Paginação" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 16 }}>
        <button className="btn btn-outline" disabled={loading || page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</button>
        <span className="pager-info">Página {page} de {totalPages}</span>
        <button className="btn btn-outline" disabled={loading || page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Próxima</button>
      </div>
    </section>
  )
}
