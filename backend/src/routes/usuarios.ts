import { Router } from 'express'
import { requireAuth } from '../middleware/autenticacao'
import { getDb } from '../lib/db'

const router = Router()

router.get('/', (req, res) => {
  const db = getDb()
  const page = Number(req.query.page || 1)
  const pageSize = Number(req.query.pageSize || 20)
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
  const items = db.prepare('SELECT id, email, credits, createdAt FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?').all(pageSize, (page-1)*pageSize)
  res.json({ items, page, totalPages: Math.max(1, Math.ceil((total.count||0)/pageSize)) })
})

// Perfil do usuário autenticado
router.get('/me', requireAuth, (req, res) => {
  const db = getDb()
  const userId = (req as any).userId
  const user = db.prepare('SELECT id, email, credits, createdAt FROM users WHERE id = ?').get(userId)
  if (!user) return res.status(404).json({ error: 'not_found' })
  res.json(user)
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const items = db.prepare(`
    SELECT c.id, c.name, c.type, c.rarity, c.imageUrl FROM purchases p
    JOIN cosmetics c ON c.id = p.cosmeticId
    WHERE p.userId = ? AND p.returnedAt IS NULL
    ORDER BY c.name
  `).all(req.params.id)
  res.json({ items })
})

export default router
