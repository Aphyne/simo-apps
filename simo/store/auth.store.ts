import { create } from 'zustand'
import { TOKEN_KEY, USER_KEY } from '@/lib/constants'
import type { AuthUser } from '@/types/user'

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isHydrated: boolean

  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
  hydrate: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isHydrated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      // Cookie diperlukan agar Next.js middleware bisa deteksi auth status
      document.cookie = `simo_token=${token}; path=/; SameSite=Lax`
    }
    set({ user, token })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      document.cookie = 'simo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    set({ user: null, token: null })
  },

  // Dipanggil sekali saat app load untuk restore session dari localStorage
  hydrate: () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem(TOKEN_KEY)
    const userStr = localStorage.getItem(USER_KEY)
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser
        set({ user, token, isHydrated: true })
      } catch {
        set({ isHydrated: true })
      }
    } else {
      set({ isHydrated: true })
    }
  },

  isAdmin: () => get().user?.role === 'admin',
}))
