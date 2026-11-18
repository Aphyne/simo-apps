// Salinan tabel "Progres penataan" di docs/DESIGN.md bagian 6 (design system v2: Flat + Bento).
// DESIGN.md tetap sumber utama: ubah docs/DESIGN.md dan berkas ini bersamaan.
// "Mengikuti" = isi halaman sudah memakai token dan pola v2. Shell (sidebar, header, latar, huruf)
// sudah v2 di semua halaman, jadi halaman "Belum" hanya berarti isinya masih gaya v1.

export type StatusPenataan = 'Mengikuti' | 'Belum' | 'Belum tercatat'

export interface BarisProgres {
  halaman: string
  rute: string
  status: StatusPenataan
  catatan: string
}

export const PROGRES_PENATAAN: BarisProgres[] = [
  { halaman: 'Layout (Sidebar + Header)', rute: 'components/layout/*', status: 'Mengikuti', catatan: 'Drawer di < lg; target sentuh 44px' },
  { halaman: 'Dashboard', rute: '/dashboard', status: 'Mengikuti', catatan: '' },
  { halaman: 'Design (style guide)', rute: '/design', status: 'Mengikuti', catatan: 'Hanya superadmin' },
  { halaman: 'Data Obat (list, tambah, detail, edit)', rute: '/obat/**', status: 'Mengikuti', catatan: 'Dikerjakan 16 Nov 2026; menunggu acc Boss. Pola baru di 4.8' },
  { halaman: 'Barang Masuk (Stok masuk)', rute: '/barang-masuk', status: 'Mengikuti', catatan: 'Dikerjakan 17 Nov 2026; menunggu acc Boss. Pola baru di 4.8' },
  { halaman: 'Barang Keluar (Stok keluar)', rute: '/barang-keluar', status: 'Mengikuti', catatan: 'Dikerjakan 18 Nov 2026; menunggu acc Boss. Pola Stok masuk' },
  { halaman: 'Monitoring', rute: '/monitoring', status: 'Belum', catatan: 'Isi gaya v1' },
  { halaman: 'Perhitungan EOQ/ROP', rute: '/perhitungan', status: 'Belum', catatan: 'Hanya admin; menu nonaktif' },
  { halaman: 'Laporan', rute: '/laporan', status: 'Mengikuti', catatan: 'Dikerjakan 18 Nov 2026; menunggu acc Boss. Lembar kertas pratinjau dan PDF tidak disentuh' },
  { halaman: 'Simulasi', rute: '/simulasi', status: 'Belum', catatan: 'Hanya admin; menu nonaktif' },
  { halaman: 'Analisis Komparatif', rute: '/analisis', status: 'Belum', catatan: 'Hanya admin; menu nonaktif' },
  { halaman: 'Supplier (list, tambah, edit)', rute: '/supplier/**', status: 'Mengikuti', catatan: 'Dikerjakan 18 Nov 2026; menunggu acc Boss. Daftar berbentuk tabel' },
  { halaman: 'Manajemen User', rute: '/users', status: 'Mengikuti', catatan: 'Dikerjakan 18 Nov 2026; menunggu acc Boss. Hanya admin' },
  { halaman: 'Pengaturan', rute: '/pengaturan', status: 'Mengikuti', catatan: 'Dikerjakan 18 Nov 2026; menunggu acc Boss. Hanya admin' },
  { halaman: 'Reorder', rute: '/reorder', status: 'Mengikuti', catatan: 'Dikerjakan 18 Nov 2026; menunggu acc Boss. Format PDF Surat Pesanan tidak disentuh' },
  { halaman: 'Pemantauan', rute: '/pemantauan', status: 'Belum', catatan: 'Hanya superadmin' },
  { halaman: 'Login', rute: '/login', status: 'Belum', catatan: 'Isi gaya v1' },
  { halaman: 'Error / not-found', rute: 'app/error.tsx, not-found.tsx', status: 'Belum', catatan: 'ErrorPanel masih gaya v1' },
]
