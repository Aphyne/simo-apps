import type { BarangKeluar } from '@/types/obat'

// Daftar keterangan yang dikenal backend (barangKeluarController: KETERANGAN_VALID).
export const KETERANGAN_KELUAR = ['Penjualan', 'Retur', 'Rusak', 'Kedaluarsa', 'Lainnya'] as const

// Nilai penjualan satu baris (jumlah x harga jual yang dicatat saat transaksi). Hanya Penjualan yang dihitung:
// retur, rusak, kedaluarsa, dan lainnya bukan pendapatan. Harga jual kosong atau 0 = belum ada harga (null),
// bukan Rp 0.
export function nilaiPenjualan(item: Pick<BarangKeluar, 'keterangan' | 'jumlah' | 'harga_jual'>): number | null {
  const harga = Number(item.harga_jual)
  if (item.keterangan !== 'Penjualan' || !(harga > 0)) return null
  return item.jumlah * harga
}

// Tanggal hari ini menurut jam setempat (YYYY-MM-DD). `toISOString()` memakai UTC dan sebelum 07.00 WIB
// hasilnya kemarin.
export function tanggalLokal(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Rupiah ringkas untuk ubin yang sempit ("Rp 12,3 jt"). Angka lengkap tetap ditulis di tempat yang cukup lebar.
export function rupiahRingkas(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

// ── Tampilan per transaksi ───────────────────────────────────────────────────
// Database mencatat satu baris per obat dan belum menyimpan nomor struk. Baris yang dicatat lewat form Catat
// sekaligus (satu keranjang) dimasukkan dalam satu transaksi database, jadi waktu dicatatnya (`created_at`) identik.
// Satu transaksi = baris dengan waktu dicatat, pencatat, tanggal, dan keterangan yang sama. Baris lama (impor satu per
// satu) waktunya berbeda, jadi masing-masing menjadi satu transaksi sendiri. Ini kelompok per pencatatan, bukan nomor struk.
export interface KelompokTransaksi {
  kunci: string
  tanggal: string
  // Waktu dicatat (ISO), dipakai menampilkan jam.
  dicatat: string
  keterangan: string
  namaUser: string | null
  roleUser: string | null
  rows: BarangKeluar[]
  // Jumlah nilai penjualan baris yang punya harga jual; 0 bila bukan penjualan.
  totalPenjualan: number
  // Baris Penjualan tanpa harga jual (tidak ikut dijumlahkan).
  tanpaHarga: number
}

export function kelompokkanPerTransaksi(rows: BarangKeluar[]): KelompokTransaksi[] {
  const peta = new Map<string, KelompokTransaksi>()
  for (const r of rows) {
    const kunci = r.created_at ? `${r.created_at}|${r.username ?? r.nama_user ?? ''}|${r.keterangan}|${r.tanggal}` : `baris|${r.id}`
    let g = peta.get(kunci)
    if (!g) {
      g = { kunci, tanggal: r.tanggal, dicatat: r.created_at, keterangan: r.keterangan, namaUser: r.nama_user, roleUser: r.role_user, rows: [], totalPenjualan: 0, tanpaHarga: 0 }
      peta.set(kunci, g)
    }
    g.rows.push(r)
    if (r.keterangan === 'Penjualan') {
      const nilai = nilaiPenjualan(r)
      if (nilai === null) g.tanpaHarga += 1
      else g.totalPenjualan += nilai
    }
  }
  return Array.from(peta.values())
}

// Jam dicatat (HH.mm) menurut jam setempat; kosong bila waktunya tidak valid.
export function jamDicatat(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

// Rupiah untuk ubin: angka lengkap sampai 10 juta (lebih jelas untuk apotek kecil), selebihnya ringkas ("Rp 12,3 jt")
// supaya muat di ubin sempit.
export function rupiahUbin(n: number): string {
  if (n < 10_000_000) return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
  return rupiahRingkas(n)
}
