import { Link } from 'react-router-dom'
import { formatVBucks } from '../utils/format'
import { memo } from 'react'

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

function CosmeticCard({ c }: { c: Cosmetic }) {
  const typeClass = `type-${(c.type || '').toLowerCase()}`
  const rarityClass = `rarity-${(c.rarity || '').toLowerCase()}`
  return (
    <div className={`card card-cartoon ${typeClass} ${rarityClass}`}>
      <Link to={`/cosmetics/${c.id}`}>
        <div className="card-media">
          {c.imageUrl ? (
            <img
              src={c.imageUrl}
              alt={c.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="placeholder" />
          )}
          <div className="card-overlay">
            <div className="overlay-left">
              <span className="chip chip-type">{(c.type || 'Item').toUpperCase()}</span>
              {c.isNew && <span className="chip chip-new">NOVO</span>}
              {c.onSale && <span className="chip chip-sale">À VENDA</span>}
              {c.owned && <span className="chip chip-owned">ADQUIRIDO</span>}
            </div>
            <div className="overlay-right">
              <span className={`chip chip-rarity ${rarityClass}`}>{(c.rarity || 'N/A').toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="card-title">{c.name}</div>
          <div className="price">
            {c.salePrice && c.price && c.salePrice < c.price ? (
              <>
                <span className="old">
        <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
        <span className="vbuck-label">VBUCK</span>
        <span className="vbucks-amount">{formatVBucks(c.price)}</span>
                </span>
                <span className="now sale">
        <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
        <span className="vbuck-label">VBUCK</span>
        <span className="vbucks-amount">{formatVBucks(c.salePrice)}</span>
                </span>
              </>
            ) : (
              <span className="now">
                {typeof (c.price ?? c.salePrice) === 'number' ? (
                  <>
        <img src="/imagens/vbuck.png" alt="V-Bucks" className="vbuck-icon" />
        <span className="vbuck-label">VBUCK</span>
        <span className="vbucks-amount">{formatVBucks((c.price ?? c.salePrice) as number)}</span>
                  </>
                ) : (
                  'N/D'
                )}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default memo(CosmeticCard)
