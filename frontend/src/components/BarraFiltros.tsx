type Props = {
  query?: any
  onChange?: (q:any)=>void
  decorativo?: boolean
}

const TYPE_OPTIONS = [
  { value: '', label: 'Selecione um tipo' },
  { value: 'outfit', label: 'Trajes' },
  { value: 'emote', label: 'Gestos' },
  { value: 'backpack', label: 'Acessórios de Costas' },
  { value: 'pickaxe', label: 'Ferramentas de Coleta' },
  { value: 'glider', label: 'Planadores' },
  { value: 'wrap', label: 'Envelopamentos' },
  { value: 'music', label: 'Músicas' },
  { value: 'loadingscreen', label: 'Telas de Carregamento' },
  { value: 'spray', label: 'Sprays' },
  { value: 'banner', label: 'Banners' },
]

const RARITY_OPTIONS = [
  { value: '', label: 'Selecione raridade' },
  { value: 'common', label: 'Comum' },
  { value: 'uncommon', label: 'Incomum' },
  { value: 'rare', label: 'Raro' },
  { value: 'epic', label: 'Épico' },
  { value: 'legendary', label: 'Lendário' },
  { value: 'mythic', label: 'Mítico' },
]

export default function FiltersBar({ query = {}, onChange, decorativo = false }: Props) {
  return (
    <aside className="filters-panel" aria-label="Filtros do catálogo">
      <div className="filters-title">Filtrar por</div>
      <div className="donut-search" role="search">
        <input
          placeholder="Buscar por nome"
          value={query.name||''}
          onChange={e=>onChange && onChange({ ...query, name: e.target.value })}
          aria-label="Buscar por nome"
        />
      </div>
      <div className="filters decorative">
        <div>
          <label>Tipo</label>
          <div className="check-group">
            {TYPE_OPTIONS.filter(t=>t.value).map(opt => {
              const selected = query.type === opt.value
              return (
                <label
                  key={opt.value}
                  className={`pretty-check ${selected ? 'selected' : ''}`}
                  onClick={()=> onChange && onChange({ ...query, type: selected ? undefined : opt.value })}
                  role="checkbox"
                  aria-checked={selected}
                >
                  <span className="box" />
                  <span className="text">{opt.label}</span>
                </label>
              )
            })}
          </div>
        </div>
        <div>
          <label>Raridade</label>
          <div className="check-group">
            {RARITY_OPTIONS.filter(r=>r.value).map(opt => {
              const selected = query.rarity === opt.value
              return (
                <label
                  key={opt.value}
                  className={`pretty-check ${selected ? 'selected' : ''}`}
                  onClick={()=> onChange && onChange({ ...query, rarity: selected ? undefined : opt.value })}
                  role="checkbox"
                  aria-checked={selected}
                >
                  <span className="box" />
                  <span className="text">{opt.label}</span>
                </label>
              )
            })}
          </div>
        </div>
        <div>
          <label>Data</label>
          <div className="date-range" role="group" aria-label="Filtrar por data">
            <input
              type="date"
              value={query.fromDate || ''}
              onChange={(e)=> onChange && onChange({ ...query, fromDate: e.target.value || undefined })}
              aria-label="Desde"
            />
            <input
              type="date"
              value={query.toDate || ''}
              onChange={(e)=> onChange && onChange({ ...query, toDate: e.target.value || undefined })}
              aria-label="Até"
            />
          </div>
        </div>
      </div>
      <div className="group" aria-label="Status">
        <label className="inline-check">
          <input type="checkbox" checked={!!query.isNew} onChange={(e)=>onChange && onChange({ ...query, isNew: e.target.checked ? 1 : undefined })} />
          Novidades
        </label>
        <label className="inline-check">
          <input type="checkbox" checked={!!query.onSale} onChange={(e)=>onChange && onChange({ ...query, onSale: e.target.checked ? 1 : undefined })} />
          À venda
        </label>
        <label className="inline-check">
          <input type="checkbox" checked={!!query.onPromotion} onChange={(e)=>onChange && onChange({ ...query, onPromotion: e.target.checked ? 1 : undefined })} />
          Em promoção
        </label>
      </div>
      <button className="btn-outline" onClick={()=>onChange && onChange({})}>Limpar filtros</button>
    </aside>
  )
}
