// Helper Reorder: nomor WhatsApp, nomor surat, pesan pengantar, dan pengiriman PDF Surat Pesanan.
// Isi surat sendiri dibuat sebagai PDF di lib/reorderPdf.ts (meniru surat-pesanan.jpeg).

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

// Nomor surat otomatis dari tanggal + id supplier (belum ada penomoran berurutan di sistem)
export function nomorSurat(supplierId: number, tanggal: Date): string {
  const y = tanggal.getFullYear()
  const m = String(tanggal.getMonth() + 1).padStart(2, '0')
  const dd = String(tanggal.getDate()).padStart(2, '0')
  return `SP/${y}${m}${dd}/${String(supplierId).padStart(2, '0')}`
}

// Pesan singkat pengantar yang menyertai PDF Surat Pesanan di chat WhatsApp
export function buatPesanPengantar(params: {
  apotek: IdentitasApotek
  supplier: TujuanSupplier
  jumlahItem: number
  nomor: string
}): string {
  const { apotek, supplier, jumlahItem, nomor } = params
  return [
    `Yth. ${supplier.nama},`,
    '',
    `Terlampir Surat Pesanan No. ${nomor} dari ${apotek.nama} (${jumlahItem} item).`,
    'Mohon konfirmasi ketersediaan dan harganya. Terima kasih.',
  ].join('\n')
}

// Tautan WhatsApp: ke nomor supplier kalau ada, kalau tidak buka WhatsApp dan user memilih kontak sendiri
export function buatLinkWa(nomorSupplier: string | null | undefined, pesan: string): string {
  const no = normalisasiWa(nomorSupplier)
  return `https://wa.me/${no ?? ''}?text=${encodeURIComponent(pesan)}`
}

export function unduhBlob(blob: Blob, namaFile: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export type HasilKirim = 'dibagikan' | 'diunduh' | 'dibatalkan'

// WhatsApp (wa.me) tidak bisa melampirkan file otomatis. Jadi:
//  - HP: buka lembar bagikan sistem dengan PDF terlampir → pilih WhatsApp → pilih kontak.
//  - Komputer: PDF diunduh, lalu chat WhatsApp supplier dibuka dengan pesan pengantar;
//    user tinggal melampirkan file yang baru diunduh (klip kertas / tarik file ke chat).
export async function kirimPdfViaWa(params: {
  blob: Blob
  namaFile: string
  nomorSupplier: string | null | undefined
  pesan: string
}): Promise<HasilKirim> {
  const { blob, namaFile, nomorSupplier, pesan } = params
  const file = new File([blob], namaFile, { type: 'application/pdf' })
  const isHp = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  if (isHp && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: pesan })
      return 'dibagikan'
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return 'dibatalkan'
      // gagal selain dibatalkan user → lanjut ke cara unduh + buka chat
    }
  }

  unduhBlob(blob, namaFile)
  window.open(buatLinkWa(nomorSupplier, pesan), '_blank', 'noopener,noreferrer')
  return 'diunduh'
}
