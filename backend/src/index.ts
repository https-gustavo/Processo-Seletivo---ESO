import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './lib/db'
import authRouter from './routes/autenticacao'
import cosmeticsRouter from './routes/cosmeticos'
import purchasesRouter from './routes/compras'
import usersRouter from './routes/usuarios'
import meRouter from './routes/eu'
import { startSync, runSyncOnce } from './sync'

const app = express()
const allowedOriginsRaw = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

// Normaliza origens removendo barras finais para evitar mismatches
const normalizeOrigin = (s: string) => s.replace(/\/+$/, '')
const allowedOrigins = allowedOriginsRaw.map(normalizeOrigin)

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Sem origin (ex.: requisiÃ§Ãµes same-origin, curl) â€” permite
    if (!origin) return callback(null, true)
    const normalized = normalizeOrigin(origin)
    // Suporte a wildcard: CORS_ORIGIN="*"
    if (allowedOrigins.includes('*')) return callback(null, true)
    // Permite apenas origens configuradas
    if (allowedOrigins.includes(normalized)) return callback(null, true)
    // Log de diagnÃ³stico para facilitar troubleshooting de CORS
    console.warn(`[cors] origem nÃ£o permitida: '${origin}' (normalizada='${normalized}'). allowed=`, allowedOrigins)
    // Bloqueia demais
    callback(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined
  const normalized = origin ? normalizeOrigin(origin) : undefined
  const allow = !normalized || allowedOrigins.includes('*') || allowedOrigins.includes(normalized || '')
  if (allow && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})

initDb(process.env.DB_PATH || 'data/app.db')

app.use('/api/auth', authRouter)
app.use('/api/cosmetics', cosmeticsRouter)
app.use('/api/purchases', purchasesRouter)
app.use('/api/users', usersRouter)
app.use('/api/me', meRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/sync', async (_req, res) => {
  const result = await runSyncOnce()
  res.json({ ok: true, ...result })
})

startSync()

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`)
})
