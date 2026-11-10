'use client'

import { useState } from 'react'

// Waktu "sekarang" yang dibekukan saat komponen pertama kali dirender.
// Memanggil Date.now()/new Date() langsung di badan komponen membuat render tidak murni
// (hasilnya berubah di setiap render). Untuk perhitungan sisa hari kedaluwarsa dan
// rentang tanggal, ketelitian sampai hitungan detik tidak diperlukan; komponen yang
// dibuka ulang (pindah halaman) otomatis memakai waktu terbaru.
export function useNow(): Date {
  const [now] = useState(() => new Date())
  return now
}
