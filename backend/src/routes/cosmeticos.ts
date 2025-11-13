// Rotas de cosméticos — listagem com filtros, detalhes e galeria.
// Comentários autorais do processo seletivo (por Gustavo Menezes).
import { Router } from 'express'
import { getDb } from '../lib/db'
import jwt from 'jsonwebtoken'
import { fetchCosmetics } from '../external/fortnite'

const router = Router()

router.get('/', (req, res) => {
  const db = getDb()
  const page = Number(req.query.page || 1)
  const pageSize = Number(req.query.pageSize || 24)
  const name = String(req.query.name || '')
  const type = String(req.query.type || '')
  const rarity = String(req.query.rarity || '')
  const isNew = req.query.isNew ? 1 : undefined
  const onSale = req.query.onSale ? 1 : undefined
  const onPromotion = req.query.onPromotion ? 1 : undefined
  const bundleId = String(req.query.bundleId || '')
  const fromDate = String(req.query.fromDate || '')
  const toDate = String(req.query.toDate || '')

  // Extrai token Bearer do header Authorization e lê userId do JWT
  let userId: string | undefined
  const header = String(req.headers.authorization || '')
  const [scheme, rawToken] = header.split(' ')
  const token = scheme === 'Bearer' ? rawToken : ''
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as any
      userId = payload.userId
    } catch {
      userId = undefined
    }
  }

  const where: string[] = []
  const params: any[] = []
  if (name) { where.push('name LIKE ?'); params.push(`%${name}%`) }
  if (type) { where.push('type = ?'); params.push(type) }
  if (rarity) { where.push('rarity = ?'); params.push(rarity) }
  if (isNew !== undefined) { where.push('isNew = ?'); params.push(isNew) }
  if (onSale !== undefined) { where.push('onSale = ?'); params.push(onSale) }
  if (onPromotion !== undefined) { where.push('(salePrice IS NOT NULL AND salePrice < price)') }
  if (bundleId) { where.push('bundleId = ?'); params.push(bundleId) }
  if (fromDate) { where.push('addedDate >= ?'); params.push(fromDate) }
  if (toDate) { where.push('addedDate <= ?'); params.push(toDate) }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = db.prepare(`SELECT COUNT(*) as count FROM cosmetics ${whereSql}`).get(...params) as any
  const selectOwned = userId ? `, EXISTS(SELECT 1 FROM purchases p WHERE p.userId = ? AND p.cosmeticId = c.id AND p.returnedAt IS NULL) AS owned` : ''
  const items = db.prepare(`
    SELECT c.id, c.name, c.type, c.rarity, c.imageUrl, c.isNew, c.onSale, c.price, c.salePrice, c.bundleId${selectOwned}
    FROM cosmetics c ${whereSql} ORDER BY c.name LIMIT ? OFFSET ?
  `)
    .all(...(userId ? [userId] : []), ...params, pageSize, (page-1)*pageSize)
  const totalPages = Math.max(1, Math.ceil((total.count || 0)/pageSize))
  res.json({ items, totalPages, page })
})

router.get('/:id', (req, res) => {
  const db = getDb()
  // Extrai token Bearer do header Authorization e tenta obter userId
  let userId: string | undefined
  const header = String(req.headers.authorization || '')
  const [scheme, rawToken] = header.split(' ')
  const token = scheme === 'Bearer' ? rawToken : ''
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as any
      userId = payload.userId
    } catch {
      userId = undefined
    }
  }
  const item = db.prepare('SELECT * FROM cosmetics WHERE id = ?').get(req.params.id) as any
  if (!item) return res.status(404).json({ error: 'not_found' })
  if (userId) {
    const owned = db.prepare('SELECT 1 FROM purchases WHERE userId = ? AND cosmeticId = ? AND returnedAt IS NULL').get(userId, req.params.id)
    item.owned = !!owned
  }
  res.json(item)
})

// Imagens extras do cosmético (galeria), via fonte externa
router.get('/:id/images', async (req, res) => {
  try {
    const data = await fetchCosmetics().catch(() => null)
    const items: any[] = Array.isArray(data) ? data : (data?.data || [])
    const id = String(req.params.id)
    const match = items.find((it: any) => String(it.id || it.hash || it.key) === id)
    if (!match) return res.status(404).json({ error: 'not_found' })
    const imgs = match.images || {}
    const images = {
      icon: imgs.icon || null,
      smallIcon: imgs.smallIcon || null,
      featured: imgs.featured || null,
      png: imgs.png || null,
      full_background: imgs.full_background || imgs.fullBackground || null,
    }
    const gallery = Object.values(images).filter((u) => !!u)
    res.json({ images, gallery })
  } catch (e) {
    res.status(500).json({ error: 'external_unavailable' })
  }
})

export default router
