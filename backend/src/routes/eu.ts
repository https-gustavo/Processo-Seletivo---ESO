// Rota /api/me — histórico de transações e troca de senha.
// Comentários autorais do processo seletivo (por Gustavo Menezes).
import { Router } from 'express'
import { requireAuth } from '../middleware/autenticacao'
import { getDb } from '../lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const router = Router()

router.get('/transactions', requireAuth, (req, res) => {
  const userId = (req as any).userId
  const db = getDb()
  const rows = db.prepare(`
    SELECT id, type, amount, cosmeticId, createdAt
    FROM transactions
    WHERE userId = ?
    ORDER BY createdAt DESC
  `).all(userId)
  res.json({ items: rows })
})

// Alteração de senha do usuário autenticado
router.post('/change-password', requireAuth, (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(6, 'password_too_short'),
    newPassword: z.string().min(6, 'password_too_short'),
  })
  const parse = schema.safeParse(req.body)
  if (!parse.success) {
    const first = parse.error.issues[0]
    return res.status(400).json({ error: first?.message || 'invalid_body' })
  }
  const { currentPassword, newPassword } = parse.data
  const db = getDb()
  const userId = (req as any).userId
  const user = db.prepare('SELECT id, passwordHash FROM users WHERE id = ?').get(userId) as any
  if (!user) return res.status(404).json({ error: 'not_found' })
  const ok = bcrypt.compareSync(currentPassword, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid_current_password' })
  const newHash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(newHash, userId)
  res.json({ ok: true })
})

export default router
