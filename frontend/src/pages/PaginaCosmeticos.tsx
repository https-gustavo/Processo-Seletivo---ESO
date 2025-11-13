import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api'
import CartaoCosmetico from '../components/CartaoCosmetico'
import BarraFiltros from '../components/BarraFiltros'

type Cosmetic = {
  id: string
  name: string
  type: string
  rarity: string
  imageUrl?: string
  isNew?: boolean
  onSale?: boolean
  owned?: boolean
  price?: number
  salePrice?: number
}

export default function CosmeticsPage() {
  const [items, setItems] = useState<Cosmetic[]>([])
  const [query, setQuery] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const cacheRef = useRef<Map<string, Cosmetic[]>>(new Map())
  const location = useLocation()

  // Sincroniza filtros com a URL (ex.: /cosmetics?type=emote&rarity=rare)
  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const preset: any = {}
    if (sp.get('name')) preset.name = sp.get('name')
    if (sp.get('type')) preset.type = sp.get('type')
    if (sp.get('rarity')) preset.rarity = sp.get('rarity')
    if (sp.get('isNew')) preset.isNew = true
    if (sp.get('onSale')) preset.onSale = true
    if (sp.get('onPromotion')) preset.onPromotion = true
    const pg = Number(sp.get('page') || '1')
    if (Object.keys(preset).length > 0) {
      setQuery(prev => ({ ...prev, ...preset }))
      if (typeof preset.name === 'string') setSearch(preset.name)
    }
    setPage(Number.isFinite(pg) && pg > 0 ? pg : 1)
  }, [location.search])

  // Determina o preço usado para ordenação, considerando promoções
  const priceOf = (c: any) => {
    const p = typeof c.price === 'number' ? c.price : undefined
    const s = typeof c.salePrice === 'number' ? c.salePrice : undefined
    if (typeof s === 'number' && typeof p === 'number') return Math.min(s, p)
    return (typeof s === 'number' ? s : (typeof p === 'number' ? p : Number.POSITIVE_INFINITY))
  }

  const shouldFetch = true

  // Carrega catálogo com cache simples por chave de filtro/página
  useEffect(() => {
    const params: any = { page, pageSize: 15 }
    if (query.type) params.type = query.type
    if (query.rarity) params.rarity = query.rarity
    if (query.fromDate) params.fromDate = query.fromDate
    if (query.toDate) params.toDate = query.toDate
    if (query.onSale) params.onSale = 1
    if (query.onPromotion) params.onPromotion = 1
    const key = `${query.type || 'all'}|${query.rarity || 'all'}|${query.fromDate || 'any'}|${query.toDate || 'any'}|page:${page}`
    const cached = cacheRef.current.get(key)
    const controller = new AbortController()
    let cancelled = false
    if (cached) {
      setItems(cached)
      setLoading(false)
      return () => controller.abort()
    }
    setLoading(true)
    api.get('/cosmetics', { params, signal: controller.signal }).then(r => {
      if (cancelled) return
      const sorted = [...r.data.items].sort((a:any,b:any)=> priceOf(a) - priceOf(b))
      cacheRef.current.set(key, sorted)
      setItems(sorted)
      setTotalPages(Math.max(1, Number(r.data?.totalPages || 1)))
    }).catch(() => {
      if (cancelled) return
      setItems([])
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; controller.abort() }
  }, [query.type, query.rarity, query.fromDate, query.toDate, page])

  const groups: Record<string, Cosmetic[]> = items.reduce((acc, it) => {
    const key = (it.type || 'outro').toLowerCase()
    acc[key] = acc[key] || []
    acc[key].push(it)
    return acc
  }, {} as Record<string, Cosmetic[]>)

  const LABELS: Record<string, string> = {
    outfit: 'Outfits', emote: 'Emotes', backpack: 'Back Blings', pickaxe: 'Pickaxes', glider: 'Gliders', wrap: 'Wraps', music: 'Music', loadingscreen: 'Loading Screens', spray: 'Sprays', banner: 'Banners', outro: 'Outros'
  }

  return (
    <div className={`item-shop ${query.type ? `type-${String(query.type).toLowerCase()}` : ''}`}>
      <section className="catalog-hero" aria-label="Catálogo de Cosméticos">
        <div className="catalog-hero-bg" aria-hidden="true" />
        <div className="catalog-hero-content">
          <h1 className="page-title">Catálogo de Cosméticos</h1>
          <div className="title-accent" aria-hidden="true" />
          {/* Subtítulo removido conforme solicitado */}
          
        </div>
      </section>
      <div className="catalog">
        <BarraFiltros query={query} onChange={(q:any) => { setQuery(q); setPage(1) }} />
        <div className="catalog-content">
          {loading ? (
            <div className="loading" role="status" aria-live="polite">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="empty" role="status" aria-live="polite">Nenhum item encontrado.</div>
          ) : (
            <>
              <div className="grid" id="cosmetics-grid" aria-label="Grade de cosméticos">
                {items
                  .filter(i => {
                    const nameOk = (query.name || '').length ? i.name?.toLowerCase().includes((query.name||'').toLowerCase()) : true
                    const onSaleOk = query.onSale ? !!i.onSale : true
                    const promoOk = query.onPromotion ? (typeof i.salePrice === 'number' && typeof i.price === 'number' && i.salePrice < i.price) : true
                    const statusOk = (query.isNew ? i.isNew : true) && onSaleOk && promoOk
                    const price = priceOf(i)
                    const minOk = typeof query.minPrice === 'number' ? price >= query.minPrice : true
                    const maxOk = typeof query.maxPrice === 'number' ? price <= query.maxPrice : true
                    return nameOk && statusOk && minOk && maxOk
                  })
                  .map((c:any) => (
                    <CartaoCosmetico key={c.id} c={c} />
                  ))}
              </div>
              <div className="pager" aria-label="Paginação" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <button className="btn btn-outline" disabled={loading || page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</button>
                <span className="pager-info">Página {page} de {totalPages}</span>
                <button className="btn btn-outline" disabled={loading || page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Próxima</button>
              </div>
            </>
          )}

          
        </div>
      </div>
    </div>
  )
}
