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
      // sessionStorage (bukan localStorage) — supaya tiap tab punya sesi sendiri,
      // tidak saling menimpa kalau tab berbeda login dengan akun berbeda.
      sessionStorage.setItem(TOKEN_KEY, token)
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
      // Cookie diperlukan agar Next.js middleware bisa deteksi auth status
      document.cookie = `simo_token=${token}; path=/; SameSite=Lax`
    }
    set({ user, token })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      document.cookie = 'simo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    set({ user: null, token: null })
  },

  // Dipanggil sekali saat app load untuk restore session dari sessionStorage
  hydrate: () => {
    if (typeof window === 'undefined') return
    const token = sessionStorage.getItem(TOKEN_KEY)
    const userStr = sessionStorage.getItem(USER_KEY)
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
