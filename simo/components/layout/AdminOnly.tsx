'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

// Penjaga sisi klien untuk halaman khusus admin. Bukan pengganti keamanan
// (backend tetap menolak 403); ini mencegah staf melihat halaman saat URL
// dibuka langsung. Konten anak tidak dirender (dan hook datanya tidak jalan)
// sampai peran terverifikasi, sehingga tidak ada kedipan konten admin.
export default function AdminOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const boleh = user?.role === 'admin'

  useEffect(() => {
    if (isHydrated && !boleh) router.replace('/dashboard')
  }, [isHydrated, boleh, router])

  if (!isHydrated || !boleh) return null
  return <>{children}</>
}
