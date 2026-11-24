import { create } from 'zustand'
import { TOKEN_KEY, USER_KEY } from '@/lib/constants'
import { setTokenCookie, clearTokenCookie } from '@/lib/cookie'
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
      // localStorage supaya sesi bertahan setelah tab/browser ditutup (sampai token
      // kedaluwarsa atau logout). Konsekuensinya semua tab berbagi satu akun.
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      // Cookie diperlukan agar Next.js middleware bisa deteksi auth status
      setTokenCookie(token)
    }
    set({ user, token })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      clearTokenCookie()
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
        return
      } catch {
        // data rusak: jatuh ke pembersihan di bawah
      }
    }
    // Tidak ada sesi yang valid: buang cookie penanda yang basi supaya middleware
    // tidak mengira masih login (cookie hidup 7 hari, penyimpanan bisa kosong).
    clearTokenCookie()
    set({ isHydrated: true })
  },

  isAdmin: () => get().user?.role === 'admin',
}))
