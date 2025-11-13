import { Router } from 'express'
import { getDb } from '../lib/db'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const router = Router()

router.post('/register', (req, res) => {
  const schema = z.object({
    email: z.string().email('invalid_email'),
    password: z.string().min(6, 'password_too_short'),
  })
  const parse = schema.safeParse(req.body)
  if (!parse.success) {
    const first = parse.error.issues[0]
    return res.status(400).json({ error: first?.message || 'invalid_body' })
  }
  const email = parse.data.email.trim().toLowerCase()
  const password = parse.data.password
  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return res.status(409).json({ error: 'email_in_use' })
  const id = uuid()
  const passwordHash = bcrypt.hashSync(password, 10)
  db.prepare('INSERT INTO users (id, email, passwordHash, credits, createdAt) VALUES (?, ?, ?, ?, ?)')
    .run(id, email, passwordHash, 10000, new Date().toISOString())
  res.json({ id, email, credits: 10000 })
})

router.post('/login', (req, res) => {
  const schema = z.object({
    email: z.string().email('invalid_email'),
    password: z.string().min(6, 'password_too_short'),
  })
  const parse = schema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_body' })
  }
  const email = parse.data.email.trim().toLowerCase()
  const password = parse.data.password
  const db = getDb()
  const user = db.prepare('SELECT id, passwordHash FROM users WHERE email = ?').get(email)
  if (!user) return res.status(401).json({ error: 'invalid_credentials' })
  const ok = bcrypt.compareSync(password, (user as any).passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' })
  const token = jwt.sign({ userId: (user as any).id }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '7d' })
  res.json({ token })
})

export default router
