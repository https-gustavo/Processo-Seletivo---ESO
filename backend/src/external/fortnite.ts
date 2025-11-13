import axios from 'axios'
const base = process.env.EXTERNAL_API_BASE_URL || 'https://fortnite-api.com/v2'
const fallbackBase = 'https://fortnite-api.com/v2'
const DEBUG = process.env.DEBUG_EXTERNAL === '1'

async function tryGet(urls: string[]) {
  for (const u of urls) {
    try {
      if (DEBUG) console.log(`[external] requesting ${u}`)
      const r = await axios.get(u, {
        headers: { Accept: 'application/json' },
        timeout: 15000,
      })
      const d = r.data
      const isArray = Array.isArray(d)
      const isObject = d && typeof d === 'object' && !isArray
      const isString = typeof d === 'string'
      if (DEBUG) console.log(`[external] success ${u} ->`, typeof d, isArray, d?.status)
      if (isString) {
        try {
          const parsed = JSON.parse(d)
          if (DEBUG) console.log(`[external] parsed JSON from string for ${u}`)
          return parsed
        } catch (e: any) {
          if (DEBUG) console.warn(`[external] non-JSON response from ${u}, skipping. reason: ${e?.message || e}`)
          // try next URL
          continue
        }
      }
      if (isArray || isObject) {
        return d
      }
      if (DEBUG) console.warn(`[external] unexpected response type from ${u}: ${typeof d}, skipping`)
      // try next URL
      continue
    } catch (e: any) {
      if (DEBUG) console.warn(`[external] failed ${u}: ${e?.message || e}`)
      }
  }
  return { data: [] }
}

export async function fetchCosmetics() {
  const urls = [
    `${base}/cosmetics/br`,
    `${fallbackBase}/cosmetics/br`,
  ]
  return await tryGet(urls)
}

export async function fetchNewCosmetics() {
  const urls = [
    `${base}/cosmetics/br?new=true`,
    `${fallbackBase}/cosmetics/br?new=true`,
  ]
  return await tryGet(urls)
}

export async function fetchShop() {
  const urls = [
    // Usa /v2/shop; /v2/shop/br está indisponível
    `${base}/shop`,
    `${fallbackBase}/shop`,
  ]
  return await tryGet(urls)
}
