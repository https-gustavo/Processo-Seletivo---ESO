import { create } from 'zustand'
import { api } from '../api'

type UserState = {
  credits: number | null
  setCredits: (c: number | null) => void
  refreshCredits: () => Promise<void>
  deductCredits: (amount: number) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  credits: null,
  setCredits: (c) => set({ credits: c }),
  refreshCredits: async () => {
    try {
      const r = await api.get('/users/me')
      const c = r.data?.credits
      set({ credits: typeof c === 'number' ? c : null })
    } catch {
      // Ignora erro: mantém saldo atual
    }
  },
  deductCredits: (amount: number) => {
    const current = get().credits
    if (typeof current === 'number') {
      const next = Math.max(0, current - Math.max(0, amount))
      set({ credits: next })
    }
  }
}))
