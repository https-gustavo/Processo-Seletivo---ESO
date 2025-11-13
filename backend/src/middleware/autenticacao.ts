import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || ''
  const [, token] = header.split(' ')
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as any
    ;(req as any).userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'invalid_token' })
  }
}