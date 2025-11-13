import cron from 'node-cron'
import { getDb } from './lib/db'
import { v4 as uuid } from 'uuid'
import { fetchCosmetics, fetchNewCosmetics, fetchShop } from './external/fortnite'

function normalizeCosmetic(item: any) {
  const id = item.id || item.hash || item.key || String(Date.now())
  return {
    id,
    name: item.name || item.displayName || 'Unknown',
    type: item.type?.value || item.type || 'unknown',
    rarity: item.rarity?.value || item.rarity || 'common',
    addedDate: item.added || item.addedDate || null,
    imageUrl: item.images?.icon || item.images?.smallIcon || item.image || null,
    bundleId: item.bundle?.id || null,
    price: item.price || null,
    salePrice: item.salePrice || null,
  }
}

export async function runSyncOnce(): Promise<{ upserted: number; newMarked: number; saleMarked: number }> {
  const db = getDb()
  let upserted = 0
  let newMarked = 0
  let saleMarked = 0
  try {
    const all = await fetchCosmetics().catch(() => null)
    if (all?.data || Array.isArray(all)) {
      const items = Array.isArray(all) ? all : all.data
      const upsert = db.prepare(`
        INSERT INTO cosmetics (id, name, type, rarity, addedDate, imageUrl)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, type=excluded.type, rarity=excluded.rarity, addedDate=excluded.addedDate, imageUrl=excluded.imageUrl
      `)
      const tx = (db as any).transaction((rows: any[]) => {
        rows.forEach((r: any) => {
          const c = normalizeCosmetic(r)
          upsert.run(c.id, c.name, c.type, c.rarity, c.addedDate, c.imageUrl)
        })
      })
      tx(items)
      upserted = items.length
      console.log(`[sync] upserted cosmetics: ${items.length}`)

      // Refine "new" items by 14-day window using addedDate
      const now = new Date()
      const threshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      const thresholdIso = threshold.toISOString()
      // Normalize addedDate to ISO if possible during marking
      const selectIds = db.prepare('SELECT id, addedDate FROM cosmetics').all() as any[]
      const markNew = db.prepare('UPDATE cosmetics SET isNew = 1 WHERE id = ?')
      const clearNewAll = db.prepare('UPDATE cosmetics SET isNew = 0')
      const txNew = (db as any).transaction((rows: any[]) => {
        clearNewAll.run()
        rows.forEach((row: any) => {
          const ad = row.addedDate
          if (!ad) return
          const t = Date.parse(ad) || Date.parse(`${ad}`)
          if (!isNaN(t)) {
            if (t >= Date.parse(thresholdIso)) {
              markNew.run(row.id)
            }
          }
        })
      })
      txNew(selectIds)
      const countNew = db.prepare('SELECT COUNT(*) as c FROM cosmetics WHERE isNew = 1').get() as any
      newMarked = Number(countNew.c || 0)
      console.log(`[sync] marked new cosmetics by date window (14d): ${newMarked}`)
    }

    // Optional: still attempt explicit "new" endpoint as supplemental source
    const news = await fetchNewCosmetics().catch(() => null)
    if (news?.data || Array.isArray(news)) {
      const items = Array.isArray(news) ? news : news.data
      const newsLen = items.length || 0
      const threshold = Math.max(50, Math.floor(upserted * 0.3))
      if (newsLen > threshold) {
        console.warn(`[sync] skipping supplemental new marking; endpoint returned ${newsLen} (> ${threshold}) items`)
      } else {
        const mark = db.prepare('UPDATE cosmetics SET isNew = 1 WHERE id = ?')
        const tx = (db as any).transaction((rows: any[]) => {
          rows.forEach((r: any) => {
            const c = normalizeCosmetic(r)
            mark.run(c.id)
          })
        })
        tx(items)
        const countNew2 = db.prepare('SELECT COUNT(*) as c FROM cosmetics WHERE isNew = 1').get() as any
        newMarked = Number(countNew2.c || 0)
        console.log(`[sync] supplemented new cosmetics from endpoint, total isNew: ${newMarked}`)
      }
    }

    const shop = await fetchShop().catch(() => null)
    if (shop?.data || Array.isArray(shop)) {
      // Estrutura do /shop/br: buckets com entries (featured, daily, etc.)
      const root = Array.isArray(shop) ? null : (shop.data?.data || shop.data)
      const buckets = ['featured', 'daily', 'specialFeatured', 'specialDaily', 'vaulted', 'offers']
      const entries: any[] = []
      if (Array.isArray(shop)) {
        // fallback: se vier array direto, trata como entries
        entries.push(...(shop as any[]))
      } else if (root) {
        if (Array.isArray((root as any).entries)) entries.push(...(root as any).entries)
        buckets.forEach((b) => {
          const be = (root as any)[b]?.entries
          if (Array.isArray(be)) entries.push(...be)
        })
      }

      const mark = db.prepare('UPDATE cosmetics SET onSale = 1, price = COALESCE(?, price), salePrice = COALESCE(?, salePrice) WHERE id = ?')
      const tx = (db as any).transaction((rows: any[]) => {
        rows.forEach((entry: any) => {
          const regular = entry.regularPrice ?? entry.price ?? null
          const final = entry.finalPrice ?? null
          const sale = (regular != null && final != null && final < regular) ? final : null
          const basePrice = regular ?? final ?? null
          const items = Array.isArray(entry.items) ? entry.items : []
          items.forEach((it: any) => {
            const c = normalizeCosmetic(it)
            mark.run(basePrice, sale, c.id)
          })
        })
      })
      tx(entries)
      saleMarked = entries.length
      console.log(`[sync] marked on sale entries processed: ${entries.length}`)
    }

    // Preencher preço base para itens sem qualquer preço
    function fallbackPrice(type: string, rarity: string): number | null {
      const t = (type || '').toLowerCase()
      const r = (rarity || '').toLowerCase()
      const byType: Record<string, Record<string, number>> = {
        outfit: { common: 800, uncommon: 800, rare: 1200, epic: 1500, legendary: 2000, mythic: 2000 },
        emote: { common: 200, uncommon: 200, rare: 500, epic: 800, legendary: 800 },
        pickaxe: { common: 500, uncommon: 500, rare: 800, epic: 1200, legendary: 1200 },
        glider: { common: 500, uncommon: 500, rare: 800, epic: 1200, legendary: 1500 },
        wrap: { common: 300, uncommon: 300, rare: 500, epic: 700, legendary: 700 },
        backpack: { common: 400, uncommon: 400, rare: 600, epic: 800, legendary: 1200 },
        music: { common: 200, uncommon: 200, rare: 400, epic: 600, legendary: 600 },
        loadingscreen: { common: 200, uncommon: 200, rare: 200, epic: 200, legendary: 200 },
        spray: { common: 200, uncommon: 200, rare: 300, epic: 300, legendary: 300 },
        banner: { common: 200, uncommon: 200, rare: 200, epic: 200, legendary: 200 },
      }
      const map = byType[t]
      if (map) return map[r] ?? map.rare ?? 500
      const byRarity: Record<string, number> = { common: 300, uncommon: 300, rare: 500, epic: 800, legendary: 1200, mythic: 1500 }
      return byRarity[r] ?? 500
    }

    const missing = db
      .prepare('SELECT id, type, rarity FROM cosmetics WHERE price IS NULL AND salePrice IS NULL')
      .all() as any[]
    const setBase = db.prepare('UPDATE cosmetics SET price = ? WHERE id = ?')
    const txFill = (db as any).transaction((rows: any[]) => {
      rows.forEach((row: any) => {
        const p = fallbackPrice(row.type, row.rarity)
        if (p != null && p > 0) setBase.run(p, row.id)
      })
    })
    txFill(missing)
    if (missing.length) {
      console.log(`[sync] filled fallback prices for items: ${missing.length}`)
    }
  } catch (e) {
    console.error('[sync] error', e)
    const now = new Date().toISOString()
    db.prepare('INSERT INTO sync_log (id, ranAt, upserted, newMarked, saleMarked, error) VALUES (?, ?, ?, ?, ?, ?)')
      .run(uuid(), now, upserted, newMarked, saleMarked, String(e))
    return { upserted, newMarked, saleMarked }
  }
  const now = new Date().toISOString()
  db.prepare('INSERT INTO sync_log (id, ranAt, upserted, newMarked, saleMarked, error) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuid(), now, upserted, newMarked, saleMarked, null)
  return { upserted, newMarked, saleMarked }
}

export function startSync() {
  runSyncOnce()
  cron.schedule('*/10 * * * *', () => {
    runSyncOnce()
  })
}
