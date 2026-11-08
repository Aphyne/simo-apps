// Pembuat pesan WhatsApp Reorder dengan format Surat Pesanan apotek
// (meniru docs/data-apotek/surat-pesanan.jpeg: kop apotek, Kepada Yth., SURAT PESANAN No.,
// daftar NO / NAMA OBAT / SATUAN / JUMLAH, catatan Perhatian, tanggal & tanda tangan APJ).

export interface IdentitasApotek {
  nama: string
  alamat: string
  sia: string
  namaApj: string
  sipaApj: string
  kota: string
}

export interface ItemPesanan {
  nama: string
  jumlah: number
  satuan: string
}

export interface TujuanSupplier {
  id: number
  nama: string
  alamat?: string | null
}

// Nomor WhatsApp lokal ("0812-3456-789", "+62 812...", "812...") → format wa.me ("62812...")
export function normalisasiWa(nomor: string | null | undefined): string | null {
  if (!nomor) return null
  const d = nomor.replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('62')) return d
  if (d.startsWith('0')) return '62' + d.slice(1)
  if (d.startsWith('8')) return '62' + d
  return d
}

function tanggalPanjang(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
}

// Nomor surat otomatis dari tanggal + id supplier (belum ada penomoran berurutan di sistem)
export function nomorSurat(supplierId: number, tanggal: Date): string {
  const y = tanggal.getFullYear()
  const m = String(tanggal.getMonth() + 1).padStart(2, '0')
  const dd = String(tanggal.getDate()).padStart(2, '0')
  return `SP/${y}${m}${dd}/${String(supplierId).padStart(2, '0')}`
}

export function buatSuratPesanan(params: {
  apotek: IdentitasApotek
  supplier: TujuanSupplier
  items: ItemPesanan[]
  tanggal?: Date
}): string {
  const { apotek, supplier, items } = params
  const tanggal = params.tanggal ?? new Date()

  const baris = items.map((it, i) => `${i + 1}. ${it.nama} — ${it.jumlah} ${it.satuan}`)

  return [
    `*${apotek.nama.toUpperCase()}*`,
    apotek.sia ? `SIA : ${apotek.sia}` : null,
    apotek.alamat || null,
    '──────────────',
    'Kepada Yth.',
    `*${supplier.nama}*`,
    supplier.alamat ? `Di ${supplier.alamat}` : null,
    '',
    '*SURAT PESANAN*',
    `No. ${nomorSurat(supplier.id, tanggal)}`,
    '',
    'NO. NAMA OBAT — JUMLAH',
    ...baris,
    '',
    '*Perhatian*',
    'Barang akan kami return/kembalikan apabila:',
    '1. Tidak sesuai dengan permintaan, kecuali ada pemberitahuan sebelumnya kepada kami.',
    '2. Expired date (ED) kurang dari 1 tahun (minimal 1 tahun).',
    '3. Barang kondisi rusak/kotor.',
    '',
    `${apotek.kota}, ${tanggalPanjang(tanggal)}`,
    'Apoteker Pengelola Apotek',
    '',
    apotek.namaApj ? `*${apotek.namaApj}*` : null,
    apotek.sipaApj ? `SIPA : ${apotek.sipaApj}` : null,
  ]
    .filter((x): x is string => x !== null)
    .join('\n')
}

// Tautan WhatsApp: ke nomor supplier kalau ada, kalau tidak buka WhatsApp dan user memilih kontak sendiri
export function buatLinkWa(nomorSupplier: string | null | undefined, pesan: string): string {
  const no = normalisasiWa(nomorSupplier)
  return `https://wa.me/${no ?? ''}?text=${encodeURIComponent(pesan)}`
}
