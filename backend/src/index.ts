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
const corsOptions: cors.CorsOptions = {
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())

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
