import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { formatVBucks } from '../utils/format'
import { motion } from 'framer-motion'
import { useUserStore } from '../utils/userStore'
import CartaoCosmetico from '../components/CartaoCosmetico'

export default function CosmeticDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [message, setMessage] = useState<string>('')
  const [toast, setToast] = useState<{ type: 'success'|'error'|null, text: string }>({ type: null, text: '' })
  const credits = useUserStore(s => s.credits)
  const refreshCredits = useUserStore(s => s.refreshCredits)
  const deductCredits = useUserStore(s => s.deductCredits)
  const [gallery, setGallery] = useState<string[]>([])
  const [currentImg, setCurrentImg] = useState<string | null>(null)
  useEffect(() => {
    api.get(`/cosmetics/${id}`).then(r => {
      setItem(r.data)
      if (r.data?.bundleId) {
        api.get('/cosmetics', { params: { page: 1, pageSize: 12, bundleId: r.data.bundleId } }).then(rr => {
          const items = (rr.data.items || []).filter((x:any) => x.id !== r.data.id)
          setRelated(items)
        }).catch(() => setRelated([]))
      } else {
        setRelated([])
      }
      if (r.data?.imageUrl) {
        setGallery([r.data.imageUrl])
        setCurrentImg(r.data.imageUrl)
      } else {
        setGallery([])
        setCurrentImg(null)
      }
    }).catch(() => setItem(null))
  }, [id])

  useEffect(() => {
    if (!id) return
    api.get(`/cosmetics/${id}/images`).then(rr => {
      const arr = (rr.data?.gallery || []).filter((u:string) => typeof u === 'string')
      if (arr.length) {
        // Mescla imagens extras com a principal, evitando duplicados
        const base = new Set([...(gallery || []), ...arr])
        const merged = Array.from(base)
        setGallery(merged)
        if (!currentImg && merged.length) setCurrentImg(merged[0])
      }
    }).catch(() => { /* silencioso */ })
  }, [id])

  // Sincroniza saldo de V-Bucks ao montar
  useEffect(() => { refreshCredits() }, [refreshCredits])
  // Fluxo de compra: tenta comprar, mostra feedback e atualiza saldo/posse
  const doPurchase = async () => {
    setMessage('')
    try {
      const charge = Number(item?.salePrice ?? item?.price ?? 0) || 0
      await api.post('/purchases', { cosmeticId: id })
      setMessage('Compra realizada com sucesso!')
      setToast({ type: 'success', text: 'Woo-hoo! Item adicionado com sucesso!' })
      setTimeout(() => setToast({ type: null, text: '' }), 2800)
      deductCredits(charge)
      refreshCredits()
      const r = await api.get(`/cosmetics/${id}`)
      setItem(r.data)
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 409) {
      setMessage('Você já possui este item.')
      setToast({ type: 'error', text: 'D’oh! Você já tem este item.' })
      setTimeout(() => setToast({ type: null, text: '' }), 2800)
      setItem((prev:any) => ({ ...(prev||{}), owned: true }))
    } else if (status === 402) {
      setMessage('Saldo insuficiente de v-bucks.')
      setToast({ type: 'error', text: 'D’oh! Saldo insuficiente de v-bucks.' })
      setTimeout(() => setToast({ type: null, text: '' }), 2800)
    } else {
        setMessage('Falha na compra.')
        setToast({ type: 'error', text: 'D’oh! Algo deu errado. Tente novamente.' })
        setTimeout(() => setToast({ type: null, text: '' }), 2800)
      }
    }
  }
  if (!item) return <div className="page-loading" role="status" aria-live="polite">Carregando...</div>
  return (
    <main className="product-main">
      <header className="product-header" role="banner">
        <button className="btn btn-ghost" onClick={() => navigate(-1)} aria-label="Voltar">← Voltar</button>
      </header>
      <div className="product-center">
        <section className="detail-hero" aria-label="Detalhes do cosmético">
          <motion.div
            className="detail-hero-media"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02 }}
          >
            <div className="rarity-badge">{(item.rarity || 'N/A').toUpperCase()}</div>
          {currentImg ? (
            <img src={currentImg} alt={item.name} />
          ) : (
            <div className="placeholder" />
          )}
        </motion.div>
          <motion.div
            className="detail-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="detail-title">{item.name}</h1>
            <div className="detail-meta">
              <span className="chip chip-type">{(item.type || 'Item').toUpperCase()}</span>
              <span className={`chip chip-rarity rarity-${(item.rarity||'').toLowerCase()}`}>{(item.rarity || 'N/A').toUpperCase()}</span>
              {item.isNew && <span className="chip chip-new">NOVO</span>}
              {item.onSale && <span className="chip chip-sale">À VENDA</span>}
              {item.owned && <span className="chip chip-owned">ADQUIRIDO</span>}
            </div>
            <div className="detail-grid">
              <div>
                <strong>Preço</strong>
                <div className="price-pill" style={{ marginTop: 6 }}>
                  {typeof (item.salePrice ?? item.price) === 'number' ? (
                    <span className={item.salePrice && item.price && item.salePrice < item.price ? 'now sale' : 'now'}>
        <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
        <span className="vbuck-label">VBUCK</span>
        <span className="vbucks-amount">{formatVBucks((item.salePrice ?? item.price) as number)}</span>
                    </span>
                  ) : (
                    'N/D'
                  )}
                </div>
              </div>
              <div>
                <button className="btn btn-outline" onClick={doPurchase} disabled={item.owned} aria-label={item.owned ? 'Adquirido' : 'Comprar Agora'}>
                  {item.owned ? (
                    <>Adquirido</>
                  ) : (
                    <>
                      <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
                      Comprar Agora
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="info-list" style={{ marginTop: 12 }}>
              <p><strong>Tipo:</strong> {(item.type || '—').toUpperCase()}</p>
              <p><strong>Raridade:</strong> {(item.rarity || '—').toUpperCase()}</p>
              <p><strong>Adicionado:</strong> {item.addedDate ? new Date(item.addedDate).toLocaleDateString() : '—'}</p>
              <p><strong>Bundle:</strong> {item.bundleId ? `Inclui ${related.length + 1} itens` : '—'}</p>
              {typeof item.onSale === 'boolean' && (
                <p><strong>Promoção:</strong> {item.onSale ? 'Sim' : 'Não'}</p>
              )}
            </div>
          </motion.div>
        </section>

        {related.length > 0 && (
          <section className="related-section" aria-label="Itens relacionados">
            <div className="section-header">
              <h2>Itens relacionados</h2>
              <Link to={`/cosmetics?type=${(item.type||'').toLowerCase()}`}>Ver mais</Link>
            </div>
            <div className="grid related-grid">
              {related.map((c:any) => (
                <CartaoCosmetico key={`rel-${c.id}`} c={c} />
              ))}
            </div>
          </section>
        )}

        <motion.div
          className={`success-toast ${toast.type || ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: toast.type ? 1 : 0, y: toast.type ? 0 : 10 }}
          transition={{ duration: 0.25 }}
          aria-live="polite"
          onAnimationComplete={() => { if (!toast.type) setToast({ type: null, text: '' }) }}
        >
          {toast.text}
        </motion.div>
      </div>
    </main>
  )
}
