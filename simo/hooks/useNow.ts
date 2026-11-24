'use client'

import { useState, useSyncExternalStore } from 'react'

// false saat render di server dan saat hidrasi, true sesudah halaman hidup di browser.
// Dipakai untuk teks yang bergantung jam/zona waktu setempat (sapaan, tanggal): server
// Vercel berjalan di UTC, browser pengguna di WIB, jadi HTML server tidak boleh memuat
// teks itu (kalau berbeda, React melempar error hidrasi #418).
const tanpaLangganan = () => () => {}
export function useSudahDiBrowser(): boolean {
  return useSyncExternalStore(tanpaLangganan, () => true, () => false)
}

// Waktu "sekarang" yang dibekukan saat komponen pertama kali dirender.
// Memanggil Date.now()/new Date() langsung di badan komponen membuat render tidak murni
// (hasilnya berubah di setiap render). Untuk perhitungan sisa hari kedaluwarsa dan
// rentang tanggal, ketelitian sampai hitungan detik tidak diperlukan; komponen yang
// dibuka ulang (pindah halaman) otomatis memakai waktu terbaru.
export function useNow(): Date {
  const [now] = useState(() => new Date())
  return now
}
