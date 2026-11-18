import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { muatLogoApotek } from './logoApotek'

const APOTEK = 'Apotek Rezky Medika'

type Sel = string | number

// ── Gaya bersama (selaras dengan design system v2: tabel datar, kepala abu, garis tipis) ─────────────
const WARNA = {
  teks: [15, 23, 42] as [number, number, number],
  abu: [100, 116, 139] as [number, number, number],
  garis: [226, 232, 240] as [number, number, number],
  latarTotal: [241, 245, 249] as [number, number, number],
}
const MARGIN_X = 14

// Font standar PDF (Helvetica) tidak punya panah "↳"; diganti tanda hubung supaya tidak muncul sebagai kotak.
const bersihkan = (c: Sel) => (typeof c === 'string' ? c.replace(/↳/g, '-') : c)

// Kolom yang semua isinya angka atau rupiah ditulis rata kanan (kepalanya ikut).
const lazimAngka = (c: Sel) => typeof c === 'number' || /^(Rp\s?)?-?[\d.,]+$/.test(String(c).trim())
function kolomKanan(kolom: string[], baris: Sel[][]) {
  const kanan: Record<number, { halign: 'right' }> = {}
  kolom.forEach((_, ci) => {
    if (baris.length > 0 && baris.every((r) => lazimAngka(r[ci] ?? '') || String(r[ci] ?? '').trim() === '-')) kanan[ci] = { halign: 'right' }
  })
  return kanan
}

// Kop: logo di kiri, nama apotek dan alamat center, garis tipis di bawahnya. Mengembalikan posisi y berikutnya.
function gambarKop(doc: jsPDF, namaApotek: string, alamatApotek: string, logo: string | null): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const center = pageWidth / 2
  if (logo) doc.addImage(logo, 'PNG', MARGIN_X, 9, 17, 17)

  doc.setTextColor(...WARNA.teks)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(namaApotek.toUpperCase(), center, 16, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...WARNA.abu)
  doc.text(alamatApotek, center, 22, { align: 'center' })

  doc.setDrawColor(...WARNA.garis)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_X, 29, pageWidth - MARGIN_X, 29)
  doc.setTextColor(...WARNA.teks)
  return 29
}

// Gaya tabel datar: tanpa latar kepala dan tanpa garis tegak; kepala abu, garis tipis antar baris.
function gayaTabel(ukuran: number) {
  return {
    theme: 'plain' as const,
    styles: { fontSize: ukuran, cellPadding: 2, overflow: 'linebreak' as const, textColor: WARNA.teks, lineColor: WARNA.garis, lineWidth: { bottom: 0.2 } },
    headStyles: { textColor: WARNA.abu, fontStyle: 'bold' as const, fontSize: ukuran, lineWidth: { bottom: 0.4 }, lineColor: WARNA.garis },
    footStyles: { fillColor: WARNA.latarTotal, textColor: WARNA.teks, fontStyle: 'bold' as const, lineWidth: { top: 0.4 }, lineColor: WARNA.garis },
  }
}

// ── PDF: Kartu Stok ─────────────────────────────────────────────────────────
// Kop yang sama dengan laporan lain, lalu "KARTU STOK" center dan info obat (Kode/Nama/Kemasan/Satuan/Tanggal)
// rata kiri di bawahnya.
export interface KartuStokInfo {
  namaApotek: string
  alamatApotek: string
  kodeObat: string
  namaObat: string
  kemasan: string
  satuan: string
  tanggalFilter: string
}

export async function exportKartuStokPDF(
  info: KartuStokInfo,
  kolom: string[],
  baris: Sel[][],
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const logo = await muatLogoApotek()

  let y = gambarKop(doc, info.namaApotek, info.alamatApotek, logo)

  y += 9
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('KARTU STOK', pageWidth / 2, y, { align: 'center' })

  y += 9
  doc.setFontSize(9)
  const infoLines: [string, string][] = [
    ['Kode Obat', info.kodeObat],
    ['Nama Obat', info.namaObat],
    ['Kemasan', info.kemasan],
    ['Satuan', info.satuan],
    ['Tanggal', info.tanggalFilter],
  ]
  for (const [label, value] of infoLines) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...WARNA.abu)
    doc.text(label, MARGIN_X, y)
    doc.setTextColor(...WARNA.teks)
    doc.text(`: ${value}`, MARGIN_X + 26, y)
    y += 5
  }

  // Lebar kolom proporsional: Tanggal/Masuk/Keluar/Sisa/Expired sempit (isi pendek), Keterangan dan Dicatat Oleh
  // lebih lebar tapi tetap boleh wrap ke bawah kalau isinya kepanjangan.
  const tableAreaWidth = pageWidth - MARGIN_X * 2
  const lebar = [0.14, 0.22, 0.08, 0.08, 0.08, 0.14, 0.26]
  const kanan = kolomKanan(kolom, baris)
  autoTable(doc, {
    ...gayaTabel(9),
    head: [kolom],
    body: baris.map((r) => r.map(bersihkan)),
    startY: y + 4,
    tableWidth: tableAreaWidth,
    columnStyles: Object.fromEntries(lebar.map((w, i) => [i, { cellWidth: tableAreaWidth * w, ...(kanan[i] ?? {}) }])),
    margin: { left: MARGIN_X, right: MARGIN_X },
  })

  doc.save(`Kartu_Stok_${info.kodeObat}_${Date.now()}.pdf`)
}

// ── PDF ───────────────────────────────────────────────────────────────────────
// Kop seragam untuk semua laporan, lalu judul laporan center, lalu keterangan filter + tanggal cetak rata kiri
// sebelum tabel.
export async function exportPDF(
  judul: string,
  kolom: string[],
  baris: Sel[][],
  catatan?: string,
  kaki?: Sel[][],
  namaApotek: string = APOTEK,
  alamatApotek: string = '',
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const logo = await muatLogoApotek()

  const tgl = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  let y = gambarKop(doc, namaApotek, alamatApotek, logo)

  y += 9
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(judul.toUpperCase(), pageWidth / 2, y, { align: 'center' })

  y += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...WARNA.abu)
  if (catatan) {
    doc.text(catatan, MARGIN_X, y)
    y += 5
  }
  doc.text(`Dicetak: ${tgl}`, MARGIN_X, y)
  doc.setTextColor(...WARNA.teks)

  const kanan = kolomKanan(kolom, baris)
  autoTable(doc, {
    // Portrait jauh lebih sempit dari landscape (lebar tabel ~182mm): font dikecilkan dan overflow 'linebreak'
    // (word-wrap dalam sel) supaya kolom banyak (sampai 10+) tetap muat tanpa terpotong.
    ...gayaTabel(6.5),
    head: [kolom],
    body: baris.map((r) => r.map(bersihkan)),
    ...(kaki && kaki.length > 0 ? { foot: kaki.map((r) => r.map(bersihkan)), showFoot: 'lastPage' as const } : {}),
    startY: y + 4,
    columnStyles: kanan,
    // columnStyles tidak berlaku untuk baris kaki, jadi angka total diratakan kanan di sini.
    didParseCell: (d) => { if (d.section === 'foot' && kanan[d.column.index]) d.cell.styles.halign = 'right' },
    tableWidth: 'auto',
    margin: { left: MARGIN_X, right: MARGIN_X },
  })

  doc.save(`${judul.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}

// ── Excel ─────────────────────────────────────────────────────────────────────
export function exportExcel(
  namaFile: string,
  kolom: string[],
  baris: Sel[][],
  kaki?: Sel[][],
) {
  const allRows = kaki && kaki.length > 0 ? [...baris, ...kaki] : baris
  const ws = XLSX.utils.aoa_to_sheet([kolom, ...allRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan')

  // Auto column width
  const colWidths = kolom.map((h, i) => ({
    wch: Math.max(
      h.length,
      ...allRows.map((r) => String(r[i] ?? '').length),
    ) + 2,
  }))
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `${namaFile}_${Date.now()}.xlsx`)
}
