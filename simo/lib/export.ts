import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const APOTEK = 'Apotek Rezky Medika'

// ── PDF ───────────────────────────────────────────────────────────────────────
export function exportPDF(
  judul: string,
  kolom: string[],
  baris: (string | number)[][],
  catatan?: string,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const tgl = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  // Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(APOTEK, 14, 15)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(judul, 14, 22)

  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Dicetak: ${tgl}`, 14, 28)
  doc.setTextColor(0)

  if (catatan) {
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(catatan, 14, 33)
    doc.setTextColor(0)
  }

  autoTable(doc, {
    head: [kolom],
    body: baris,
    startY: catatan ? 37 : 33,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  doc.save(`${judul.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}

// ── Excel ─────────────────────────────────────────────────────────────────────
export function exportExcel(
  namaFile: string,
  kolom: string[],
  baris: (string | number)[][],
) {
  const ws = XLSX.utils.aoa_to_sheet([kolom, ...baris])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan')

  // Auto column width
  const colWidths = kolom.map((h, i) => ({
    wch: Math.max(
      h.length,
      ...baris.map((r) => String(r[i] ?? '').length),
    ) + 2,
  }))
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `${namaFile}_${Date.now()}.xlsx`)
}
