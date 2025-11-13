import { Router } from 'express'
import { getDb } from '../lib/db'
import { v4 as uuid } from 'uuid'
import { requireAuth } from '../middleware/autenticacao'

const router = Router()

router.get('/me', requireAuth, (req, res) => {
  const userId = (req as any).userId
  const db = getDb()
  const rows = db.prepare(`
    SELECT p.id, p.cosmeticId as cosmeticId, c.name as cosmeticName, c.imageUrl as imageUrl, p.price, p.createdAt, p.returnedAt
    FROM purchases p JOIN cosmetics c ON c.id = p.cosmeticId
    WHERE p.userId = ? ORDER BY p.createdAt DESC
  `).all(userId)
  res.json({ items: rows })
})

router.post('/', requireAuth, (req, res) => {
  const userId = (req as any).userId
  const { cosmeticId } = req.body
  if (!cosmeticId) return res.status(400).json({ error: 'invalid_body' })
  const db = getDb()
  const cosmetic = db.prepare('SELECT id, price, salePrice, bundleId FROM cosmetics WHERE id = ?').get(cosmeticId) as any
  if (!cosmetic) return res.status(404).json({ error: 'cosmetic_not_found' })
  // Bloqueia recompra apenas se houver compra ATIVA (não devolvida)
  const existing = db.prepare('SELECT id FROM purchases WHERE userId = ? AND cosmeticId = ? AND returnedAt IS NULL').get(userId, cosmeticId)
  if (existing) return res.status(409).json({ error: 'already_owned' })
  const price = cosmetic.salePrice ?? cosmetic.price ?? 0
  const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId) as any
  if ((user?.credits || 0) < price) return res.status(402).json({ error: 'insufficient_credits' })
  const id = uuid()
  const now = new Date().toISOString()
  const insert = db.prepare('INSERT INTO purchases (id, userId, cosmeticId, price, createdAt) VALUES (?, ?, ?, ?, ?)')
  const updateCredits = db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?')
  const txInsert = db.prepare('INSERT INTO transactions (id, userId, type, amount, cosmeticId, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
  const transaction = (db as any).transaction(() => {
    // Compra do item principal e registro da transação
    insert.run(id, userId, cosmeticId, price, now)
    updateCredits.run(price, userId)
    txInsert.run(uuid(), userId, 'purchase', -price, cosmeticId, now)

    // Se houver bundle, marca demais itens como adquiridos com preço 0
    const bundleId: string | null = cosmetic.bundleId || null
    if (bundleId) {
      const bundleItems = db.prepare('SELECT id FROM cosmetics WHERE bundleId = ?').all(bundleId) as any[]
      bundleItems
        .map((b:any) => String(b.id))
        .filter((bid) => bid && bid !== cosmeticId)
        .forEach((bid) => {
          const owned = db.prepare('SELECT id FROM purchases WHERE userId = ? AND cosmeticId = ? AND returnedAt IS NULL').get(userId, bid)
          if (!owned) {
            insert.run(uuid(), userId, bid, 0, now)
            txInsert.run(uuid(), userId, 'purchase', 0, bid, now)
          }
        })
    }
  })
  transaction()
  res.json({ id, cosmeticId, price, createdAt: now })
})

// Devolução de um cosmético adquirido: reembolsa créditos e marca returnedAt
router.post('/return', requireAuth, (req, res) => {
  const userId = (req as any).userId
  const { cosmeticId } = req.body || {}
  if (!cosmeticId) return res.status(400).json({ error: 'invalid_body' })

  const db = getDb()
  // Localiza compra ativa (não devolvida) do usuário para o item
  const purchase = db.prepare(`
    SELECT id, price, createdAt, returnedAt
    FROM purchases
    WHERE userId = ? AND cosmeticId = ? AND returnedAt IS NULL
  `).get(userId, cosmeticId) as any

  if (!purchase) {
    // Não possui o item ou já foi devolvido
    return res.status(404).json({ error: 'not_owned_or_already_returned' })
  }

  const now = new Date().toISOString()
  const refund = Number(purchase.price || 0)
  const updatePurchase = db.prepare('UPDATE purchases SET returnedAt = ? WHERE id = ?')
  const updateCredits = db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?')
  const txInsert = db.prepare('INSERT INTO transactions (id, userId, type, amount, cosmeticId, createdAt) VALUES (?, ?, ?, ?, ?, ?)')

  const transaction = (db as any).transaction(() => {
    updatePurchase.run(now, purchase.id)
    if (refund > 0) {
      updateCredits.run(refund, userId)
      txInsert.run(uuid(), userId, 'return', refund, cosmeticId, now)
    } else {
      // Mesmo sem reembolso, registramos a devolução para histórico
      txInsert.run(uuid(), userId, 'return', 0, cosmeticId, now)
    }
  })
  transaction()

  res.json({ ok: true, id: purchase.id, cosmeticId, refunded: refund, returnedAt: now })
})

export default router
