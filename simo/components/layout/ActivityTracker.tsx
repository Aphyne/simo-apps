'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

const HEARTBEAT_MS = 60_000

// Mengirim penanda aktivitas ke server untuk keperluan penelitian:
//  - setiap pindah halaman  -> POST /aktivitas/halaman
//  - setiap 60 detik selama tab terlihat -> POST /aktivitas/heartbeat ("masih aktif")
// Tidak menampilkan apa pun, dan kegagalan dikirim tidak pernah mengganggu pengguna.
// Akun peneliti (superadmin) tidak dilacak.
export default function ActivityTracker() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const terakhir = useRef<string | null>(null)
  const dilacak = !!user && user.role !== 'superadmin'

  useEffect(() => {
    if (!dilacak || terakhir.current === pathname) return
    terakhir.current = pathname
    api.post('/aktivitas/halaman', { path: pathname }).catch(() => {})
  }, [pathname, dilacak])

  useEffect(() => {
    if (!dilacak) return
    const kirim = () => {
      if (document.visibilityState === 'visible') {
        api.post('/aktivitas/heartbeat').catch(() => {})
      }
    }
    kirim()
    const id = setInterval(kirim, HEARTBEAT_MS)
    document.addEventListener('visibilitychange', kirim)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', kirim)
    }
  }, [dilacak])

  return null
}
