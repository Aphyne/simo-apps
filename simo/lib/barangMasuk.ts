import type { BarangMasuk } from '@/types/obat'

// Perhitungan harga untuk form Ubah stok masuk. Backend menyimpan `barang_masuk.harga_beli` sebagai
// harga riil PER SATUAN SESUDAH PPN (barangMasukController: harga_beli_dus x (1 + ppn/100) / satuan_per_dus),
// sedangkan kolom "Harga beli per dus" di form adalah harga SEBELUM PPN. Form Ubah harus membalik hitungan itu,
// kalau tidak, PPN yang tersimpan hilang saat catatan disimpan ulang.

// Harga beli per dus sebelum PPN dari nilai tersimpan. Dibulatkan ke rupiah utuh bila selisihnya hanya
// kerutan pembulatan 4 desimal di database; selain itu 2 desimal.
export function hargaBeliDusSebelumPPN(hargaBeliPerSatuan: number, satuanPerDus: number, ppnPct: number, diskonPct = 0): number {
  // Harga tersimpan = harga per dus x (1 - diskon) x (1 + PPN) / isi per dus, jadi dibalik dengan membagi keduanya.
  const pembagi = (1 + (ppnPct || 0) / 100) * (1 - (diskonPct || 0) / 100)
  if (!(pembagi > 0)) return 0
  const x = (hargaBeliPerSatuan * satuanPerDus) / pembagi
  const utuh = Math.round(x)
  return Math.abs(x - utuh) < 0.05 ? utuh : Math.round(x * 100) / 100
}

// ── Tampilan per faktur ──────────────────────────────────────────────────────
// Database mencatat satu baris per obat. Satu faktur = baris-baris dengan supplier dan no. faktur yang sama.
// Baris tanpa no. faktur (data lama) tidak digabung: masing-masing menjadi satu kelompok sendiri.
export interface KelompokFaktur {
  kunci: string
  tanggal: string
  namaSupplier: string | null
  noFaktur: string | null
  ppnPct: number
  // Jatuh tempo faktur (YYYY-MM-DD dari server), null bila belum diisi.
  jatuhTempo: string | null
  rows: BarangMasuk[]
  totalSebelumPPN: number
  totalSesudahPPN: number
  // Jumlah baris yang belum punya harga beli (tidak ikut dijumlahkan).
  tanpaHarga: number
}

export function kelompokkanPerFaktur(rows: BarangMasuk[]): KelompokFaktur[] {
  const peta = new Map<string, KelompokFaktur>()
  for (const r of rows) {
    const kunci = r.no_faktur ? `${r.supplier_id ?? ''}|${r.no_faktur}` : `baris|${r.id}`
    let g = peta.get(kunci)
    if (!g) {
      g = { kunci, tanggal: r.tanggal, namaSupplier: r.nama_supplier, noFaktur: r.no_faktur, ppnPct: Number(r.ppn_pct) || 0, jatuhTempo: r.jatuh_tempo ?? null, rows: [], totalSebelumPPN: 0, totalSesudahPPN: 0, tanpaHarga: 0 }
      peta.set(kunci, g)
    }
    g.rows.push(r)
    if (!g.jatuhTempo && r.jatuh_tempo) g.jatuhTempo = r.jatuh_tempo
    if (r.harga_beli != null) {
      const ppn = Number(r.ppn_pct) || 0
      g.totalSesudahPPN += r.harga_beli * r.jumlah_satuan
      g.totalSebelumPPN += (r.harga_beli / (1 + ppn / 100)) * r.jumlah_satuan
    } else {
      g.tanpaHarga += 1
    }
  }
  return Array.from(peta.values())
}

// Jumlah dus (boleh pecahan, mis. 2,5) menjadi jumlah satuan yang tersimpan. Backend memakai rumus yang sama
// (Math.round(dus x isi per dus)), jadi angka yang ditampilkan sama dengan yang akan tersimpan.
export function konversiDus(dus: number, satuanPerDus: number): number {
  return Math.round(dus * satuanPerDus)
}

// Baris "Riwayat faktur": data lama yang diimpor. Stok sudah termasuk barang ini di snapshot, jadi baris itu
// tidak menambah stok dan menghapusnya tidak mengurangi stok (sama dengan aturan backend `isRiwayatFaktur`).
export function isRiwayatFaktur(item: { catatan: string | null }): boolean {
  return typeof item.catatan === 'string' && item.catatan.startsWith('Riwayat faktur')
}

// Tanggal (YYYY-MM-DD) menurut jam setempat dari string ISO. `slice(0, 10)` memakai UTC dan bisa mundur sehari
// bila server berzona WIB; tabel sudah memakai tanggal setempat, jadi form Ubah harus sama.
export function tanggalLokalYMD(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
