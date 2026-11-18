'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Mencegat perpindahan halaman lewat tautan di dalam aplikasi (menu samping, tautan lain) saat `aktif` (ada perubahan yang
// belum disimpan). Klik tautan ditahan; halaman pemakai menampilkan konfirmasi lewat `tertunda`, lalu memanggil `lanjut`
// (pindah, perubahan dibuang) atau `batal` (tetap di halaman). Tidak mencakup tombol Kembali peramban dan menutup tab:
// menutup atau memuat ulang halaman ditangani peringatan `beforeunload` oleh pemakainya.
export function useCegatPindah(aktif: boolean) {
  const router = useRouter()
  const [tujuan, setTujuan] = useState<string | null>(null)

  useEffect(() => {
    if (!aktif) return
    function klik(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const tautan = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!tautan || tautan.target === '_blank' || tautan.hasAttribute('download')) return
      const url = new URL(tautan.href, window.location.href)
      if (url.origin !== window.location.origin) return
      // Tautan ke halaman yang sama (mis. lompat ke bagian di halaman) tidak membuang apa pun.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      e.preventDefault()
      e.stopPropagation()
      setTujuan(url.pathname + url.search + url.hash)
    }
    document.addEventListener('click', klik, true)
    return () => document.removeEventListener('click', klik, true)
  }, [aktif])

  return {
    tertunda: tujuan !== null,
    lanjut: () => {
      const t = tujuan
      setTujuan(null)
      if (t) router.push(t)
    },
    batal: () => setTujuan(null),
  }
}
