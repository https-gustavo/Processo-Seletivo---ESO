import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database

export function initDb(dbPath: string) {
  // Garante que a pasta do arquivo do banco exista (útil fora do Docker)
  try {
    const dir = path.dirname(dbPath)
    if (dir && dir !== '.' && dir !== '/' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  } catch {
    // Se falhar, a abertura do DB abaixo ainda pode funcionar para caminhos simples
  }
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      credits INTEGER NOT NULL DEFAULT 10000,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cosmetics (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      rarity TEXT,
      addedDate TEXT,
      price INTEGER,
      salePrice INTEGER,
      isNew INTEGER DEFAULT 0,
      onSale INTEGER DEFAULT 0,
      imageUrl TEXT,
      bundleId TEXT
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      cosmeticId TEXT NOT NULL,
      price INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      returnedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      cosmeticId TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      ranAt TEXT NOT NULL,
      upserted INTEGER NOT NULL,
      newMarked INTEGER NOT NULL,
      saleMarked INTEGER NOT NULL,
      error TEXT
    );
  `)

  // Migração: se a tabela purchases possuir UNIQUE(userId, cosmeticId), removê-lo
  try {
    const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='purchases'").get() as any
    const sqlDef = String(row?.sql || '')
    if (sqlDef.includes('UNIQUE(userId, cosmeticId)')) {
      db.exec('BEGIN')
      db.exec(`
        CREATE TABLE purchases_new (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          cosmeticId TEXT NOT NULL,
          price INTEGER NOT NULL,
          createdAt TEXT NOT NULL,
          returnedAt TEXT
        );
      `)
      db.exec('INSERT INTO purchases_new SELECT id, userId, cosmeticId, price, createdAt, returnedAt FROM purchases')
      db.exec('DROP TABLE purchases')
      db.exec('ALTER TABLE purchases_new RENAME TO purchases')
      db.exec('COMMIT')
    }
  } catch {
    // Ignora falhas de migração; prossegue com schema atual
  }
}

export function getDb() {
  if (!db) throw new Error('DB not initialized')
  return db
}
