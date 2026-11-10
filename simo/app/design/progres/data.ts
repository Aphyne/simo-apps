// Salinan tabel "Progres penataan" di docs/DESIGN.md bagian 6.
// DESIGN.md tetap sumber utama: ubah docs/DESIGN.md dan berkas ini bersamaan.

export type StatusPenataan = 'Mengikuti' | 'Belum' | 'Belum tercatat'

export interface BarisProgres {
  halaman: string
  rute: string
  status: StatusPenataan
  catatan: string
}

export const PROGRES_PENATAAN: BarisProgres[] = [
  { halaman: 'Layout (Sidebar + Header)', rute: 'components/layout/*', status: 'Mengikuti', catatan: 'Drawer di < lg' },
  { halaman: 'Dashboard', rute: '/dashboard', status: 'Mengikuti', catatan: '' },
  { halaman: 'Data Obat (list, tambah, detail, edit)', rute: '/obat/**', status: 'Mengikuti', catatan: '13 kandidat kontras perlu ditinjau' },
  { halaman: 'Barang Masuk', rute: '/barang-masuk', status: 'Mengikuti', catatan: 'Rujukan WCAG' },
  { halaman: 'Barang Keluar', rute: '/barang-keluar', status: 'Mengikuti', catatan: '' },
  { halaman: 'Monitoring', rute: '/monitoring', status: 'Belum', catatan: 'Checklist lama belum dicentang' },
  { halaman: 'Perhitungan EOQ/ROP', rute: '/perhitungan', status: 'Mengikuti', catatan: 'Hanya admin; menu nonaktif' },
  { halaman: 'Laporan', rute: '/laporan', status: 'Mengikuti', catatan: '37 pasangan konflik kaskade' },
  { halaman: 'Simulasi', rute: '/simulasi', status: 'Mengikuti', catatan: 'Hanya admin; menu nonaktif' },
  { halaman: 'Analisis Komparatif', rute: '/analisis', status: 'Mengikuti', catatan: 'Hanya admin; menu nonaktif' },
  { halaman: 'Supplier (list, tambah, edit)', rute: '/supplier/**', status: 'Mengikuti', catatan: '' },
  { halaman: 'Manajemen User', rute: '/users', status: 'Mengikuti', catatan: 'Hanya admin' },
  { halaman: 'Pengaturan', rute: '/pengaturan', status: 'Mengikuti', catatan: 'Hanya admin' },
  { halaman: 'Login', rute: '/login', status: 'Mengikuti', catatan: '' },
  { halaman: 'Reorder', rute: '/reorder', status: 'Belum tercatat', catatan: 'Tidak ada di checklist lama' },
  { halaman: 'Pemantauan', rute: '/pemantauan', status: 'Belum tercatat', catatan: 'Hanya superadmin' },
  { halaman: 'Error / not-found', rute: 'app/error.tsx, not-found.tsx', status: 'Belum tercatat', catatan: '' },
]
