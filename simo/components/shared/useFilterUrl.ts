'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export type UbahParam = (patch: Record<string, string | null>, opsi?: { resetHalaman?: boolean }) => void

// Filter, urutan, dan halaman disimpan di URL (?q=&kategori=&hal=...) supaya tidak hilang saat kembali dari halaman lain
// dan bisa dibagikan sebagai tautan. Halaman yang memakainya harus dibungkus <Suspense> di page.tsx (useSearchParams).
//
// `ubahParam(patch)`: nilai kosong atau null menghapus parameter. Mengubah filter mengembalikan paginasi ke halaman 1
// (parameter `hal` dihapus) kecuali `{ resetHalaman: false }` (dipakai saat yang diubah memang nomor halamannya).
//
// Memakai History API bawaan (tersinkron dengan useSearchParams), bukan router.replace: bila halaman dibuka dengan ?q=
// (muat ulang atau tautan), router.replace(pathname) tanpa query mengembalikan alamat awal itu, jadi "Atur ulang" tidak bekerja.
export function useFilterUrl() {
  const pathname = usePathname()
  const sp = useSearchParams()

  const ubahParam: UbahParam = useCallback(
    (patch, opsi = {}) => {
      const next = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v)
        else next.delete(k)
      }
      if (opsi.resetHalaman !== false) next.delete('hal')
      const qs = next.toString()
      window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
    },
    [sp, pathname]
  )

  return { sp, pathname, ubahParam }
}

// Kolom cari memakai state lokal supaya ketikan tidak tertinggal; ke URL (dan ke API) baru setelah jeda 300 ms.
// `search` = nilai yang sedang ada di URL. Mengembalikan [teks kolom cari, pengubahnya].
export function useCariTertunda(search: string, ubahParam: UbahParam, kunci = 'q', jedaMs = 300) {
  const [cari, setCari] = useState(search)
  useEffect(() => {
    // Bandingkan setelah dirapikan: spasi saja dianggap kosong, supaya tidak mengulang pembaruan URL.
    if ((cari.trim() ? cari : '') === search) return
    const t = setTimeout(() => ubahParam({ [kunci]: cari.trim() ? cari : null }), jedaMs)
    return () => clearTimeout(t)
  }, [cari, search, ubahParam, kunci, jedaMs])
  return [cari, setCari] as const
}
