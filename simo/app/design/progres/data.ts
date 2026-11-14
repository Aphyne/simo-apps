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
  { halaman: 'Data Obat (list, tambah, detail, edit)', rute: '/obat/**', status: 'Belum', catatan: 'Isi gaya v1' },
  { halaman: 'Barang Masuk', rute: '/barang-masuk', status: 'Belum', catatan: 'Isi gaya v1' },
  { halaman: 'Barang Keluar', rute: '/barang-keluar', status: 'Belum', catatan: 'Isi gaya v1' },
  { halaman: 'Monitoring', rute: '/monitoring', status: 'Belum', catatan: 'Isi gaya v1' },
  { halaman: 'Perhitungan EOQ/ROP', rute: '/perhitungan', status: 'Belum', catatan: 'Hanya admin; menu nonaktif' },
  { halaman: 'Laporan', rute: '/laporan', status: 'Belum', catatan: 'Isi gaya v1' },
  { halaman: 'Simulasi', rute: '/simulasi', status: 'Belum', catatan: 'Hanya admin; menu nonaktif' },
  { halaman: 'Analisis Komparatif', rute: '/analisis', status: 'Belum', catatan: 'Hanya admin; menu nonaktif' },
  { halaman: 'Supplier (list, tambah, edit)', rute: '/supplier/**', status: 'Belum', catatan: 'Isi gaya v1' },
  { halaman: 'Manajemen User', rute: '/users', status: 'Belum', catatan: 'Hanya admin' },
  { halaman: 'Pengaturan', rute: '/pengaturan', status: 'Belum', catatan: 'Hanya admin' },
  { halaman: 'Reorder', rute: '/reorder', status: 'Belum', catatan: 'Isi gaya v1' },
  { halaman: 'Pemantauan', rute: '/pemantauan', status: 'Belum', catatan: 'Hanya superadmin' },
  { halaman: 'Login', rute: '/login', status: 'Belum', catatan: 'Isi gaya v1' },
  { halaman: 'Error / not-found', rute: 'app/error.tsx, not-found.tsx', status: 'Belum', catatan: 'ErrorPanel masih gaya v1' },
]
