import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const APOTEK = 'Apotek Rezky Medika'

// ── PDF: Kartu Stok ─────────────────────────────────────────────────────────
// Layout khusus meniru kartu stok fisik: logo kecil di pojok kiri-atas (lepas
// dari teks), nama apotek + garis + alamat + "KARTU STOK" semua center
// berurutan ke bawah, lalu info obat (Kode/Nama/Kemasan/Satuan/Tanggal) rata
// kiri di bawahnya. Dipisah dari exportPDF generic supaya 6 laporan lain (yang
// masih pakai layout lama) tidak ikut berubah sampai header baru ini
// difinalkan dan diterapkan ke semuanya.
export interface KartuStokInfo {
  namaApotek: string
  alamatApotek: string
  kodeObat: string
  namaObat: string
  kemasan: string
  satuan: string
  tanggalFilter: string
}

export function exportKartuStokPDF(
  info: KartuStokInfo,
  kolom: string[],
  baris: (string | number)[][],
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const center = pageWidth / 2
  const marginX = 14

  // ── Logo generik (lingkaran + simbol plus) di pojok kiri-atas, lepas ───────
  // Pusat lingkaran sejajar baseline teks nama apotek (y=16), radius 4mm supaya
  // tepi bawah logo (y=16+4=20) tidak menyentuh garis horizontal di y=22.
  const iconR = 4
  const iconCx = marginX + iconR
  const iconCy = 15
  doc.setFillColor(37, 99, 235)
  doc.circle(iconCx, iconCy, iconR, 'F')
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.7)
  doc.line(iconCx - 2, iconCy, iconCx + 2, iconCy)
  doc.line(iconCx, iconCy - 2, iconCx, iconCy + 2)
  doc.setDrawColor(0, 0, 0)

  // ── Nama apotek (center) ────────────────────────────────────────────────────
  let y = 16
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(info.namaApotek.toUpperCase(), center, y, { align: 'center' })

  // ── Garis lurus penuh ────────────────────────────────────────────────────────
  y += 6
  doc.setLineWidth(0.3)
  doc.line(marginX, y, pageWidth - marginX, y)

  // ── Alamat (center) ──────────────────────────────────────────────────────────
  y += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(info.alamatApotek, center, y, { align: 'center' })
  doc.setTextColor(0)

  // ── Judul "KARTU STOK" (center) ─────────────────────────────────────────────
  y += 8
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('KARTU STOK', center, y, { align: 'center' })

  // ── Info obat, rata kiri ─────────────────────────────────────────────────────
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
    doc.setFont('helvetica', 'bold')
    doc.text(label, marginX, y)
    doc.setFont('helvetica', 'normal')
    doc.text(`: ${value}`, marginX + 26, y)
    y += 5
  }

  // Lebar kolom proporsional: Tanggal/Masuk/Keluar/Sisa/Expired sempit (isi
  // pendek), Keterangan & Dicatat Oleh lebih lebar tapi tetap boleh wrap ke
  // bawah (overflow linebreak) kalau isinya kepanjangan, bukan makan tempat.
  const tableAreaWidth = pageWidth - marginX * 2
  autoTable(doc, {
    head: [kolom],
    body: baris,
    startY: y + 4,
    styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableWidth: tableAreaWidth,
    columnStyles: {
      0: { cellWidth: tableAreaWidth * 0.11 }, // Tanggal
      1: { cellWidth: tableAreaWidth * 0.24 }, // Keterangan
      2: { cellWidth: tableAreaWidth * 0.08 }, // Masuk
      3: { cellWidth: tableAreaWidth * 0.08 }, // Keluar
      4: { cellWidth: tableAreaWidth * 0.08 }, // Sisa
      5: { cellWidth: tableAreaWidth * 0.11 }, // Expired
      6: { cellWidth: tableAreaWidth * 0.30 }, // Dicatat Oleh
    },
    margin: { left: marginX, right: marginX },
  })

  doc.save(`Kartu_Stok_${info.kodeObat}_${Date.now()}.pdf`)
}

// ── PDF ───────────────────────────────────────────────────────────────────────
// Header seragam untuk semua laporan: logo kecil lepas di pojok kiri-atas,
// nama apotek + garis + alamat center berurutan ke bawah, lalu judul laporan
// center, baru keterangan filter + tanggal cetak rata kiri sebelum tabel —
// sama persis pola exportKartuStokPDF supaya seluruh dokumen laporan konsisten.
export function exportPDF(
  judul: string,
  kolom: string[],
  baris: (string | number)[][],
  catatan?: string,
  kaki?: (string | number)[][],
  namaApotek: string = APOTEK,
  alamatApotek: string = '',
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const center = pageWidth / 2
  const marginX = 14

  const tgl = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  // ── Logo generik (lingkaran + simbol plus) di pojok kiri-atas, lepas ───────
  // Pusat lingkaran sejajar baseline teks nama apotek (y=16), radius 4mm supaya
  // tepi bawah logo (y=16+4=20) tidak menyentuh garis horizontal di y=22.
  const iconR = 4
  const iconCx = marginX + iconR
  const iconCy = 15
  doc.setFillColor(37, 99, 235)
  doc.circle(iconCx, iconCy, iconR, 'F')
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.7)
  doc.line(iconCx - 2, iconCy, iconCx + 2, iconCy)
  doc.line(iconCx, iconCy - 2, iconCx, iconCy + 2)
  doc.setDrawColor(0, 0, 0)

  // ── Nama apotek (center) ────────────────────────────────────────────────────
  let y = 16
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(namaApotek.toUpperCase(), center, y, { align: 'center' })

  // ── Garis lurus penuh ────────────────────────────────────────────────────────
  y += 6
  doc.setLineWidth(0.3)
  doc.line(marginX, y, pageWidth - marginX, y)

  // ── Alamat (center) ──────────────────────────────────────────────────────────
  y += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(alamatApotek, center, y, { align: 'center' })
  doc.setTextColor(0)

  // ── Judul laporan (center) ──────────────────────────────────────────────────
  y += 8
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(judul.toUpperCase(), center, y, { align: 'center' })

  // ── Keterangan filter + tanggal cetak, rata kiri ────────────────────────────
  y += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  if (catatan) {
    doc.text(catatan, marginX, y)
    y += 5
  }
  doc.text(`Dicetak: ${tgl}`, marginX, y)
  doc.setTextColor(0)

  autoTable(doc, {
    head: [kolom],
    body: baris,
    ...(kaki && kaki.length > 0 ? {
      foot: kaki,
      footStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      showFoot: 'lastPage',
    } : {}),
    startY: y + 4,
    // Portrait jauh lebih sempit dari landscape (lebar tabel ~182mm) — font
    // dikecilkan dan overflow dibuat 'linebreak' (word-wrap dalam sel) supaya
    // kolom banyak (sampai 10+) tetap muat tanpa terpotong, bukan dipotong diam-diam.
    styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 6.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableWidth: 'auto',
    margin: { left: marginX, right: marginX },
  })

  doc.save(`${judul.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}

// ── Excel ─────────────────────────────────────────────────────────────────────
export function exportExcel(
  namaFile: string,
  kolom: string[],
  baris: (string | number)[][],
  kaki?: (string | number)[][],
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
