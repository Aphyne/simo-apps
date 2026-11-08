import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { nomorSurat, type IdentitasApotek, type ItemPesanan, type TujuanSupplier } from './reorder'

// Surat Pesanan dalam bentuk PDF, meniru surat pesanan cetak apotek
// (docs/data-apotek/surat-pesanan.jpeg): hitam-putih, huruf Times, kop apotek + garis ganda,
// "Kepada Yth.", SURAT PESANAN No., tabel NO / NAMA OBAT / SATUAN / JUMLAH,
// catatan Perhatian, serta tanggal & tanda tangan Apoteker Pengelola Apotek.

const MARGIN = 20
const HURUF = 'times'

function tanggalPanjang(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
}

function slug(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export interface HasilPdf {
  blob: Blob
  namaFile: string
  nomor: string
}

export function buatPdfSuratPesanan(params: {
  apotek: IdentitasApotek
  supplier: TujuanSupplier
  items: ItemPesanan[]
  tanggal?: Date
}): HasilPdf {
  const { apotek, supplier, items } = params
  const tanggal = params.tanggal ?? new Date()
  const nomor = nomorSurat(supplier.id, tanggal)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const lebar = doc.internal.pageSize.getWidth()
  const tinggi = doc.internal.pageSize.getHeight()
  const tengah = lebar / 2
  doc.setTextColor(0)
  doc.setDrawColor(0)

  // ── Kop apotek ──────────────────────────────────────────────────────────────
  let y = 20
  doc.setFont(HURUF, 'bold')
  doc.setFontSize(18)
  doc.text(apotek.nama.toUpperCase(), tengah, y, { align: 'center' })
  y += 7
  doc.setFontSize(12)
  if (apotek.sia) {
    doc.text(`SIA : ${apotek.sia}`, tengah, y, { align: 'center' })
    y += 6
  }
  doc.setFont(HURUF, 'normal')
  doc.setFontSize(11)
  const alamat = doc.splitTextToSize(apotek.alamat, lebar - MARGIN * 2 - 20) as string[]
  doc.text(alamat, tengah, y, { align: 'center' })
  y += alamat.length * 5 + 1
  // garis ganda (tebal di atas, tipis di bawah) seperti kop surat cetak
  doc.setLineWidth(0.9)
  doc.line(MARGIN, y, lebar - MARGIN, y)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y + 1.4, lebar - MARGIN, y + 1.4)
  y += 10

  // ── Kepada Yth. ─────────────────────────────────────────────────────────────
  const xKanan = 120
  doc.setFont(HURUF, 'bold')
  doc.setFontSize(11)
  doc.text('Kepada Yth.', xKanan, y)
  y += 5.5
  doc.text(supplier.nama, xKanan, y)
  if (supplier.alamat) {
    doc.setFont(HURUF, 'normal')
    const di = doc.splitTextToSize(`Di ${supplier.alamat}`, lebar - MARGIN - xKanan) as string[]
    y += 5.5
    doc.text(di, xKanan, y)
    y += (di.length - 1) * 5
  }
  y += 12

  // ── Judul ───────────────────────────────────────────────────────────────────
  doc.setFont(HURUF, 'bold')
  doc.setFontSize(13)
  const judul = 'SURAT PESANAN'
  doc.text(judul, tengah, y, { align: 'center' })
  const lebarJudul = doc.getTextWidth(judul)
  doc.setLineWidth(0.4)
  doc.line(tengah - lebarJudul / 2, y + 1, tengah + lebarJudul / 2, y + 1)
  y += 6
  doc.setFont(HURUF, 'normal')
  doc.setFontSize(11)
  doc.text(`No. ${nomor}`, tengah, y, { align: 'center' })
  y += 6

  // ── Tabel obat ──────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [['NO', 'NAMA OBAT', 'SATUAN', 'JUMLAH']],
    body: items.map((it, i) => [String(i + 1), it.nama, it.satuan, String(it.jumlah)]),
    theme: 'grid',
    margin: { left: MARGIN, right: MARGIN, bottom: 20 },
    styles: { font: HURUF, fontSize: 11, textColor: 0, lineColor: 0, lineWidth: 0.3, cellPadding: 2.4, valign: 'middle' },
    headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 28, halign: 'center' },
    },
  })

  // ── Perhatian + tanda tangan ────────────────────────────────────────────────
  const akhirTabel = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  const tinggiBlok = 62
  let yb = akhirTabel + 12
  if (yb + tinggiBlok > tinggi - 12) {
    doc.addPage()
    yb = 25
  }

  const lebarKiri = 88
  doc.setFont(HURUF, 'bold')
  doc.setFontSize(11)
  doc.text('Perhatian', MARGIN, yb)
  let yk = yb + 6
  doc.setFont(HURUF, 'normal')
  doc.setFontSize(10)
  doc.text('Barang akan kami return/kembalikan apabila :', MARGIN, yk)
  yk += 6
  const syarat = [
    '1. Tidak sesuai dengan permintaan, kecuali ada pemberitahuan sebelumnya kepada kami.',
    '2. Expired date (ED) kurang dari 1 tahun (minimal 1 tahun).',
    '3. Barang kondisi rusak/kotor.',
  ]
  for (const s of syarat) {
    const baris = doc.splitTextToSize(s, lebarKiri) as string[]
    doc.text(baris, MARGIN, yk)
    yk += baris.length * 4.6 + 1.5
  }

  let yt = yb
  doc.setFont(HURUF, 'bold')
  doc.setFontSize(11)
  doc.text(`${apotek.kota}, ${tanggalPanjang(tanggal)}`, xKanan, yt)
  yt += 5.5
  doc.setFont(HURUF, 'normal')
  doc.text('Apoteker Pengelola Apotek', xKanan, yt)
  yt += 28 // ruang tanda tangan / stempel
  doc.setFont(HURUF, 'bold')
  doc.text(apotek.namaApj, xKanan, yt)
  if (apotek.sipaApj) {
    yt += 5.5
    doc.text(`SIPA : ${apotek.sipaApj}`, xKanan, yt)
  }

  const yyyymmdd = `${tanggal.getFullYear()}${String(tanggal.getMonth() + 1).padStart(2, '0')}${String(tanggal.getDate()).padStart(2, '0')}`
  return {
    blob: doc.output('blob'),
    namaFile: `Surat_Pesanan_${slug(supplier.nama)}_${yyyymmdd}.pdf`,
    nomor,
  }
}
