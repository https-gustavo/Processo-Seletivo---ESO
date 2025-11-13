import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import CartaoCosmetico from '../components/CartaoCosmetico'

export default function HomePage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const r = await api.get('/cosmetics', { params: { page: 1, pageSize: 2000 } })
        setItems(r.data?.items || [])
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Heurística simples: prioriza itens dos Simpsons por nome e tipo
  const simpsonsKeywords = [
    'simpsons','simpson',
    'homer','marge','bart','lisa','maggie',
    'flanders','ned',
    'milhouse','apu','mr burns','burns','sideshow bob','sideshow',
    'skinner','nelson','moe','duff'
  ]
  const SIMPSONS_REGEX = new RegExp(`\\b(${simpsonsKeywords.join('|')})\\b`, 'i')
  const PREFERRED = [
    'ned flanders','flanders','homer','marge','bart','lisa','maggie',
    'milhouse','apu','mr burns','sideshow bob','skinner','nelson','moe','duff'
  ]
  const EXCLUDE = ['krusty the clown','krusty','clown','palhaço']
  const typeWeight = (t?: string) => {
    const n = String(t||'').toLowerCase()
    if (n.includes('outfit')) return 0
    if (n.includes('pickaxe')) return 1
    if (n.includes('back')) return 2
    if (n.includes('emote')) return 3
    if (n.includes('wrap')) return 4
    if (n.includes('glider') || n.includes('umbrella')) return 5
    return 9
  }
  const nameWeight = (name?: string) => {
    const n = String(name||'').toLowerCase()
    const idx = PREFERRED.findIndex(k => n.includes(k))
    return idx >= 0 ? idx : 100
  }
  const simpsonsItems = useMemo(() => (
    items
      .filter((i:any) => SIMPSONS_REGEX.test(String(i.name||'')))
      .filter((i:any) => {
        const n = String(i.name||'').toLowerCase()
        return !EXCLUDE.some(k => n.includes(k))
      })
      .sort((a:any,b:any) => {
        const aw = nameWeight(a.name) + typeWeight(a.type)
        const bw = nameWeight(b.name) + typeWeight(b.type)
        return aw - bw
      })
      .slice(0, 12)
  ), [items])

  // Fallback: mostra trajes gerais quando não há itens dos Simpsons
  const generalOutfits = useMemo(() => (
    items
      .filter((i:any) => (i.type||'').toLowerCase() === 'outfit')
      .slice(0, 12)
  ), [items])
  const skinsToShow = simpsonsItems.length ? simpsonsItems : generalOutfits

  return (
    <div className="item-shop">
      <section className="welcome-hero" aria-label="Banner inicial">
        <div className="welcome-hero-bg" />
        <div className="welcome-hero-overlay" />
        <div className="welcome-hero-content">
          <h1 className="page-title">Temporada dos Simpsons</h1>
          <p className="muted">Explore os cosméticos em destaque abaixo.</p>
        </div>
      </section>
      {loading ? (
        <div className="loading" role="status" aria-live="polite">Carregando...</div>
      ) : (
        <section className="section" aria-label={simpsonsItems.length ? 'Itens dos Simpsons' : 'Skins'}>
          <div className="section-header">
            <h2>{simpsonsItems.length ? 'Itens dos Simpsons' : 'Skins'}</h2>
            <Link to="/cosmetics" className="section-link">Ver todas</Link>
          </div>
          <div className="grid">
            {skinsToShow.map((c:any) => (
              <CartaoCosmetico key={`home-${c.id}`} c={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
