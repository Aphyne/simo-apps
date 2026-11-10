'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

// Penjaga sisi klien untuk /design: di produksi hanya role superadmin; di mode
// pengembangan terbuka bebas tanpa login. Bukan pengganti keamanan (isi /design
// statis dan tidak sensitif; data tetap dilindungi backend).
// /design berada di luar grup (dashboard), jadi hydrate() dari DashboardLayout
// tidak jalan; penjaga ini memulihkan sesi dari sessionStorage sendiri.
const PRODUKSI = process.env.NODE_ENV === 'production'

export default function SuperadminOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const hydrate = useAuthStore((s) => s.hydrate)
  const boleh = user?.role === 'superadmin'

  useEffect(() => {
    if (PRODUKSI && !isHydrated) hydrate()
  }, [isHydrated, hydrate])

  useEffect(() => {
    if (!PRODUKSI || !isHydrated) return
    if (!user) router.replace('/login')
    else if (!boleh) router.replace('/dashboard')
  }, [isHydrated, user, boleh, router])

  if (!PRODUKSI) return <>{children}</>
  if (!isHydrated || !boleh) return null
  return <>{children}</>
}
