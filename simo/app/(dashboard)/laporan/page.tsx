'use client'

import { useState } from 'react'
import { FileText, Download, FileSpreadsheet, X, Eye } from 'lucide-react'
import {
  useLaporanStok,
  useLaporanBarangMasuk,
  useLaporanBarangKeluar,
  useLaporanKedaluarsa,
  useLaporanEoqRop,
} from '@/hooks/useLaporan'
import { useSimulasiList } from '@/hooks/useSimulasi'
import { exportPDF, exportExcel } from '@/lib/export'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { KATEGORI_OBAT } from '@/lib/constants'

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'stok' | 'barang-masuk' | 'barang-keluar' | 'kedaluarsa' | 'eoq-rop' | 'simulasi'

const TABS: { id: Tab; label: string }[] = [
  { id: 'stok', label: 'Laporan Stok' },
  { id: 'barang-masuk', label: 'Barang Masuk' },
  { id: 'barang-keluar', label: 'Barang Keluar' },
  { id: 'kedaluarsa', label: 'Kedaluarsa' },
  { id: 'eoq-rop', label: 'EOQ & ROP' },
  { id: 'simulasi', label: 'Skenario Simulasi' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function nilaiStr(v: number | null | undefined) {
  if (v == null) return '-'
  return Math.round(v).toLocaleString('id-ID')
}

function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="py-12 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Memuat data…
        </div>
      </td>
    </tr>
  )
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="py-12 text-center text-sm text-gray-400">Tidak ada data</td>
    </tr>
  )
}

// ── Filter: Kategori Dropdown ─────────────────────────────────────────────────
function KategoriSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">Kategori</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none">
        <option value="">Semua Kategori</option>
        {KATEGORI_OBAT.map(k => <option key={k} value={k}>{k}</option>)}
      </select>
    </div>
  )
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
interface PreviewModalProps {
  open: boolean
  onClose: () => void
  judul: string
  keterangan?: string
  kolom: string[]
  baris: (string | number)[][]
  onDownloadPDF: () => void
  onDownloadExcel: () => void
}

function PreviewModal({ open, onClose, judul, keterangan, kolom, baris, onDownloadPDF, onDownloadExcel }: PreviewModalProps) {
  if (!open) return null

  const tgl = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-gray-800">Preview Laporan</span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Document preview area */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          {/* Paper simulation */}
          <div className="mx-auto min-w-max rounded-sm bg-white px-10 py-8 shadow-md"
               style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            {/* Document header — mirip output jsPDF */}
            <div className="mb-1 text-lg font-bold text-gray-900">Apotek Rezky Medika</div>
            <div className="text-sm font-semibold text-gray-800">{judul}</div>
            <div className="mt-0.5 text-xs text-gray-500">Dicetak: {tgl}</div>
            {keterangan && (
              <div className="mt-0.5 text-xs text-gray-400">{keterangan}</div>
            )}

            <div className="my-4 border-t border-gray-300" />

            {/* Table */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {kolom.map((h, i) => (
                    <th key={i}
                      className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-white whitespace-nowrap"
                      style={{ backgroundColor: '#2563eb' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {baris.length === 0 ? (
                  <tr>
                    <td colSpan={kolom.length} className="border border-gray-200 px-2 py-4 text-center text-gray-400">
                      Tidak ada data
                    </td>
                  </tr>
                ) : baris.map((row, ri) => (
                  <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-gray-200 px-2 py-1 whitespace-nowrap text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 text-right text-xs text-gray-400">
              Total {baris.length} baris data
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <span className="text-sm text-gray-500">{baris.length} data akan diekspor</span>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              Tutup
            </button>
            <button onClick={() => { onDownloadExcel(); onClose() }}
              className="flex items-center gap-1.5 rounded-lg border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50">
              <FileSpreadsheet className="h-4 w-4" /> Download Excel
            </button>
            <button onClick={() => { onDownloadPDF(); onClose() }}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700">
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Action Bar (tombol Preview + Excel + PDF) ─────────────────────────────────
function ActionBar({ onPreview, onExcel, onPDF }: {
  onPreview: () => void; onExcel: () => void; onPDF: () => void
}) {
  return (
    <div className="flex gap-2">
      <button onClick={onPreview}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
        <Eye className="h-4 w-4" /> Preview
      </button>
      <button onClick={onExcel}
        className="flex items-center gap-1.5 rounded-lg border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50">
        <FileSpreadsheet className="h-4 w-4" /> Excel
      </button>
      <button onClick={onPDF}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
        <Download className="h-4 w-4" /> PDF
      </button>
    </div>
  )
}

// ── Tab: Laporan Stok ─────────────────────────────────────────────────────────
function TabStok() {
  const [kategori, setKategori] = useState('')
  const [preview, setPreview] = useState(false)
  const { data, isLoading } = useLaporanStok(kategori || undefined)
  const rows = data ?? []

  const kolom = ['Kode', 'Nama Obat', 'Kategori', 'Satuan', 'Stok', 'EOQ', 'Safety Stock', 'ROP', 'Total Biaya/Thn', 'Exp. Terdekat']
  const baris = rows.map(r => [
    r.kode, r.nama, r.kategori, r.satuan,
    r.stok, nilaiStr(r.eoq), nilaiStr(r.safety_stock), nilaiStr(r.rop),
    r.total_biaya != null ? formatRupiah(r.total_biaya) : '-',
    r.expired_terdekat ? formatTanggal(r.expired_terdekat) : '-',
  ])

  function handlePDF() {
    exportPDF('Laporan Stok Obat', kolom, baris, kategori ? `Kategori: ${kategori}` : undefined)
  }
  function handleExcel() {
    const kolomXls = [...kolom, 'Demand Harian']
    const barisXls = rows.map(r => [
      r.kode, r.nama, r.kategori, r.satuan,
      r.stok, r.eoq ?? '', r.safety_stock ?? '', r.rop ?? '',
      r.total_biaya ?? '', r.expired_terdekat ?? '', r.demand_harian ?? '',
    ])
    exportExcel('Laporan_Stok_Obat', kolomXls, barisXls)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <KategoriSelect value={kategori} onChange={setKategori} />
        {kategori && (
          <button onClick={() => setKategori('')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
        <div className="ml-auto flex items-end gap-2">
          <span className="text-sm text-gray-500">{rows.length} obat</span>
          <ActionBar onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              {kolom.map(h => <th key={h} className="px-3 py-2.5 text-left whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <LoadingRow cols={10} /> :
             rows.length === 0 ? <EmptyRow cols={10} /> :
             rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.kode}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{r.nama}</td>
                <td className="px-3 py-2 text-gray-600">{r.kategori}</td>
                <td className="px-3 py-2 text-gray-600">{r.satuan}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.stok.toLocaleString('id-ID')}</td>
                <td className="px-3 py-2 text-right text-gray-600">{nilaiStr(r.eoq)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{nilaiStr(r.safety_stock)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{nilaiStr(r.rop)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{r.total_biaya != null ? formatRupiah(r.total_biaya) : '-'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{r.expired_terdekat ? formatTanggal(r.expired_terdekat) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PreviewModal open={preview} onClose={() => setPreview(false)}
        judul="Laporan Stok Obat" keterangan={kategori ? `Kategori: ${kategori}` : undefined}
        kolom={kolom} baris={baris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </div>
  )
}

// ── Tab: Barang Masuk ─────────────────────────────────────────────────────────
function TabBarangMasuk() {
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')
  const [kategori, setKategori] = useState('')
  const [preview, setPreview] = useState(false)
  const { data, isLoading } = useLaporanBarangMasuk(dari || undefined, sampai || undefined, kategori || undefined)
  const rows = data ?? []

  const keteranganFilter = [dari && sampai ? `Periode: ${formatTanggal(dari)} – ${formatTanggal(sampai)}` : dari ? `Dari: ${formatTanggal(dari)}` : sampai ? `Sampai: ${formatTanggal(sampai)}` : '', kategori ? `Kategori: ${kategori}` : ''].filter(Boolean).join(' | ') || undefined
  const kolom = ['Tanggal', 'Kode', 'Nama Obat', 'Kategori', 'Satuan', 'Jml Dus', 'Jml Satuan', 'Supplier', 'No. Faktur', 'Dicatat Oleh']
  const baris = rows.map(r => [
    formatTanggal(r.tanggal), r.kode, r.nama_obat, r.kategori, r.satuan,
    r.jumlah_dus, r.jumlah_satuan,
    r.nama_supplier ?? '-', r.no_faktur ?? '-',
    r.nama_user ? `${r.nama_user} (${r.role_user})` : '-',
  ])

  function handlePDF() { exportPDF('Laporan Barang Masuk', kolom, baris, keteranganFilter) }
  function handleExcel() {
    const kolomXls = [...kolom, 'Catatan']
    const barisXls = rows.map(r => [
      r.tanggal, r.kode, r.nama_obat, r.kategori, r.satuan,
      r.jumlah_dus, r.jumlah_satuan, r.nama_supplier ?? '', r.no_faktur ?? '',
      r.nama_user ?? '', r.catatan ?? '',
    ])
    exportExcel('Laporan_Barang_Masuk', kolomXls, barisXls)
  }

  const hasFilter = dari || sampai || kategori
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Dari Tanggal</label>
          <input type="date" value={dari} onChange={e => setDari(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Sampai Tanggal</label>
          <input type="date" value={sampai} onChange={e => setSampai(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <KategoriSelect value={kategori} onChange={setKategori} />
        {hasFilter && (
          <button onClick={() => { setDari(''); setSampai(''); setKategori('') }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
        <div className="ml-auto flex items-end gap-2">
          <span className="text-sm text-gray-500">{rows.length} transaksi</span>
          <ActionBar onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              {kolom.map(h => <th key={h} className="px-3 py-2.5 text-left whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <LoadingRow cols={kolom.length} /> :
             rows.length === 0 ? <EmptyRow cols={kolom.length} /> :
             rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{formatTanggal(r.tanggal)}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.kode}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{r.nama_obat}</td>
                <td className="px-3 py-2 text-gray-600">{r.kategori}</td>
                <td className="px-3 py-2 text-gray-600">{r.satuan}</td>
                <td className="px-3 py-2 text-right">{r.jumlah_dus}</td>
                <td className="px-3 py-2 text-right">{r.jumlah_satuan}</td>
                <td className="px-3 py-2 text-gray-600">{r.nama_supplier ?? '-'}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.no_faktur ?? '-'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                  {r.nama_user ?? '-'}{r.role_user && <span className="ml-1 text-xs text-gray-400">({r.role_user})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PreviewModal open={preview} onClose={() => setPreview(false)}
        judul="Laporan Barang Masuk" keterangan={keteranganFilter}
        kolom={kolom} baris={baris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </div>
  )
}

// ── Tab: Barang Keluar ────────────────────────────────────────────────────────
function TabBarangKeluar() {
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [kategori, setKategori] = useState('')
  const [preview, setPreview] = useState(false)
  const { data, isLoading } = useLaporanBarangKeluar(dari || undefined, sampai || undefined, keterangan || undefined, kategori || undefined)
  const rows = data ?? []

  const keteranganFilter = [
    dari && sampai ? `Periode: ${formatTanggal(dari)} – ${formatTanggal(sampai)}` : dari ? `Dari: ${formatTanggal(dari)}` : sampai ? `Sampai: ${formatTanggal(sampai)}` : '',
    keterangan ? `Keterangan: ${keterangan}` : '',
    kategori ? `Kategori: ${kategori}` : '',
  ].filter(Boolean).join(' | ') || undefined

  const kolom = ['Tanggal', 'Kode', 'Nama Obat', 'Kategori', 'Satuan', 'Jumlah', 'Keterangan', 'Stok Sebelum', 'Stok Sesudah', 'Dicatat Oleh']
  const baris = rows.map(r => [
    formatTanggal(r.tanggal), r.kode, r.nama_obat, r.kategori, r.satuan,
    r.jumlah, r.keterangan, r.stok_sebelum, r.stok_sesudah,
    r.nama_user ? `${r.nama_user} (${r.role_user})` : '-',
  ])

  function handlePDF() { exportPDF('Laporan Barang Keluar', kolom, baris, keteranganFilter) }
  function handleExcel() {
    const kolomXls = [...kolom, 'Catatan']
    const barisXls = rows.map(r => [
      r.tanggal, r.kode, r.nama_obat, r.kategori, r.satuan,
      r.jumlah, r.keterangan, r.stok_sebelum, r.stok_sesudah,
      r.nama_user ?? '', r.catatan ?? '',
    ])
    exportExcel('Laporan_Barang_Keluar', kolomXls, barisXls)
  }

  const hasFilter = dari || sampai || keterangan || kategori
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Dari Tanggal</label>
          <input type="date" value={dari} onChange={e => setDari(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Sampai Tanggal</label>
          <input type="date" value={sampai} onChange={e => setSampai(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Keterangan</label>
          <select value={keterangan} onChange={e => setKeterangan(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">Semua</option>
            <option value="penjualan">Penjualan</option>
            <option value="expired">Expired</option>
            <option value="rusak">Rusak</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        <KategoriSelect value={kategori} onChange={setKategori} />
        {hasFilter && (
          <button onClick={() => { setDari(''); setSampai(''); setKeterangan(''); setKategori('') }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
        <div className="ml-auto flex items-end gap-2">
          <span className="text-sm text-gray-500">{rows.length} transaksi</span>
          <ActionBar onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              {kolom.map(h => <th key={h} className="px-3 py-2.5 text-left whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <LoadingRow cols={kolom.length} /> :
             rows.length === 0 ? <EmptyRow cols={kolom.length} /> :
             rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{formatTanggal(r.tanggal)}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.kode}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{r.nama_obat}</td>
                <td className="px-3 py-2 text-gray-600">{r.kategori}</td>
                <td className="px-3 py-2 text-gray-600">{r.satuan}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.jumlah}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    r.keterangan === 'penjualan' ? 'bg-blue-100 text-blue-700' :
                    r.keterangan === 'expired' ? 'bg-red-100 text-red-700' :
                    r.keterangan === 'rusak' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{r.keterangan}</span>
                </td>
                <td className="px-3 py-2 text-right text-gray-600">{r.stok_sebelum}</td>
                <td className="px-3 py-2 text-right text-gray-600">{r.stok_sesudah}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                  {r.nama_user ?? '-'}{r.role_user && <span className="ml-1 text-xs text-gray-400">({r.role_user})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PreviewModal open={preview} onClose={() => setPreview(false)}
        judul="Laporan Barang Keluar" keterangan={keteranganFilter}
        kolom={kolom} baris={baris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </div>
  )
}

// ── Tab: Kedaluarsa ────────────────────────────────────────────────────────────
function TabKedaluarsa() {
  const [hari, setHari] = useState(90)
  const [kategori, setKategori] = useState('')
  const [preview, setPreview] = useState(false)
  const { data, isLoading } = useLaporanKedaluarsa(hari, kategori || undefined)
  const rows = data ?? []

  const keteranganFilter = [`Dalam ${hari} hari ke depan`, kategori ? `Kategori: ${kategori}` : ''].filter(Boolean).join(' | ')
  const kolom = ['Kode', 'Nama Obat', 'Kategori', 'Satuan', 'Stok', 'Tgl. Expired', 'Sisa Hari']
  const baris = rows.map(r => [r.kode, r.nama, r.kategori, r.satuan, r.stok, formatTanggal(r.expired_terdekat), `${r.sisa_hari} hari`])

  function handlePDF() { exportPDF('Laporan Obat Kedaluarsa', kolom, baris, keteranganFilter) }
  function handleExcel() {
    const barisXls = rows.map(r => [r.kode, r.nama, r.kategori, r.satuan, r.stok, r.expired_terdekat, r.sisa_hari])
    exportExcel('Laporan_Kedaluarsa', kolom, barisXls)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Kedaluarsa dalam</label>
          <div className="flex gap-1.5">
            {[30, 60, 90, 180].map(d => (
              <button key={d} onClick={() => setHari(d)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  hari === d ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>{d} hari</button>
            ))}
          </div>
        </div>
        <KategoriSelect value={kategori} onChange={setKategori} />
        {kategori && (
          <button onClick={() => setKategori('')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <X className="h-3 w-3" /> Reset Kategori
          </button>
        )}
        <div className="ml-auto flex items-end gap-2">
          <span className="text-sm text-gray-500">{rows.length} obat</span>
          <ActionBar onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              {kolom.map(h => <th key={h} className="px-3 py-2.5 text-left whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <LoadingRow cols={7} /> :
             rows.length === 0 ? <EmptyRow cols={7} /> :
             rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.kode}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{r.nama}</td>
                <td className="px-3 py-2 text-gray-600">{r.kategori}</td>
                <td className="px-3 py-2 text-gray-600">{r.satuan}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.stok.toLocaleString('id-ID')}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{formatTanggal(r.expired_terdekat)}</td>
                <td className="px-3 py-2">
                  <span className={`font-semibold ${r.sisa_hari <= 30 ? 'text-red-600' : r.sisa_hari <= 60 ? 'text-orange-500' : 'text-yellow-600'}`}>
                    {r.sisa_hari} hari
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PreviewModal open={preview} onClose={() => setPreview(false)}
        judul="Laporan Obat Kedaluarsa" keterangan={keteranganFilter}
        kolom={kolom} baris={baris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </div>
  )
}

// ── Tab: EOQ & ROP ────────────────────────────────────────────────────────────
function TabEoqRop() {
  const [kategori, setKategori] = useState('')
  const [preview, setPreview] = useState(false)
  const { data, isLoading } = useLaporanEoqRop(kategori || undefined)
  const rows = data ?? []

  const kolom = ['Kode', 'Nama Obat', 'Satuan', 'Demand/Thn', 'B. Pesan', 'B. Simpan', 'Lead Time', 'EOQ', 'Safety Stock', 'ROP', 'Total Biaya/Thn']
  const baris = rows.map(r => [
    r.kode, r.nama, r.satuan,
    nilaiStr(r.demand_tahunan),
    formatRupiah(r.biaya_pesan), formatRupiah(r.biaya_simpan),
    `${r.lead_time} hr`,
    nilaiStr(r.eoq), nilaiStr(r.safety_stock), nilaiStr(r.rop),
    r.total_biaya != null ? formatRupiah(r.total_biaya) : '-',
  ])

  function handlePDF() { exportPDF('Laporan EOQ & ROP', kolom, baris, kategori ? `Kategori: ${kategori}` : undefined) }
  function handleExcel() {
    const kolomXls = ['Kode', 'Nama Obat', 'Satuan', 'Kategori', 'Demand Harian', 'Demand Tahunan', 'Std Dev', 'Biaya Pesan', 'Biaya Simpan', 'Lead Time (hr)', 'EOQ', 'Safety Stock', 'ROP', 'Total Biaya/Thn']
    const barisXls = rows.map(r => [
      r.kode, r.nama, r.satuan, r.kategori,
      r.demand_harian ?? '', r.demand_tahunan ?? '', r.std_dev_demand ?? '',
      r.biaya_pesan, r.biaya_simpan, r.lead_time,
      r.eoq ?? '', r.safety_stock ?? '', r.rop ?? '', r.total_biaya ?? '',
    ])
    exportExcel('Laporan_EOQ_ROP', kolomXls, barisXls)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <KategoriSelect value={kategori} onChange={setKategori} />
        {kategori && (
          <button onClick={() => setKategori('')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
        <div className="ml-auto flex items-end gap-2">
          <span className="text-sm text-gray-500">{rows.length} obat</span>
          <ActionBar onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              {kolom.map(h => <th key={h} className="px-3 py-2.5 text-left whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <LoadingRow cols={kolom.length} /> :
             rows.length === 0 ? <EmptyRow cols={kolom.length} /> :
             rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.kode}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{r.nama}</td>
                <td className="px-3 py-2 text-gray-600">{r.satuan}</td>
                <td className="px-3 py-2 text-right text-gray-600">{nilaiStr(r.demand_tahunan)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{formatRupiah(r.biaya_pesan)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{formatRupiah(r.biaya_simpan)}</td>
                <td className="px-3 py-2 text-center text-gray-600">{r.lead_time} hr</td>
                <td className="px-3 py-2 text-right font-semibold text-blue-700">{nilaiStr(r.eoq)}</td>
                <td className="px-3 py-2 text-right font-semibold text-orange-600">{nilaiStr(r.safety_stock)}</td>
                <td className="px-3 py-2 text-right font-semibold text-green-700">{nilaiStr(r.rop)}</td>
                <td className="px-3 py-2 text-right text-gray-700">{r.total_biaya != null ? formatRupiah(r.total_biaya) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PreviewModal open={preview} onClose={() => setPreview(false)}
        judul="Laporan EOQ & ROP" keterangan={kategori ? `Kategori: ${kategori}` : undefined}
        kolom={kolom} baris={baris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </div>
  )
}

// ── Tab: Simulasi ─────────────────────────────────────────────────────────────
function TabSimulasi() {
  const [preview, setPreview] = useState(false)
  const { data, isLoading } = useSimulasiList()
  const rows = data ?? []

  const kolom = ['Nama Skenario', 'Obat', 'EOQ Sek.', 'EOQ Sim.', 'SS Sek.', 'SS Sim.', 'ROP Sek.', 'ROP Sim.', 'TC Sek.', 'TC Sim.', 'Dibuat']
  const baris = rows.map(r => [
    r.nama_skenario,
    `${r.nama_obat} (${r.kode_obat})`,
    nilaiStr(r.hasil_simulasi.aktual.eoq),
    nilaiStr(r.hasil_simulasi.simulasi.eoq),
    Math.round(r.hasil_simulasi.aktual.safety_stock).toLocaleString('id-ID'),
    Math.round(r.hasil_simulasi.simulasi.safety_stock).toLocaleString('id-ID'),
    Math.round(r.hasil_simulasi.aktual.rop).toLocaleString('id-ID'),
    Math.round(r.hasil_simulasi.simulasi.rop).toLocaleString('id-ID'),
    r.hasil_simulasi.aktual.total_biaya != null ? formatRupiah(r.hasil_simulasi.aktual.total_biaya) : '-',
    r.hasil_simulasi.simulasi.total_biaya != null ? formatRupiah(r.hasil_simulasi.simulasi.total_biaya) : '-',
    formatTanggal(r.created_at),
  ])

  function handlePDF() { exportPDF('Laporan Skenario Simulasi', kolom, baris) }
  function handleExcel() {
    const kolomXls = [
      'Nama Skenario', 'Nama Obat', 'Kode', 'Satuan', 'Dibuat Oleh',
      'EOQ Sekarang', 'EOQ Simulasi', 'SS Sekarang', 'SS Simulasi',
      'ROP Sekarang', 'ROP Simulasi', 'TC Sekarang', 'TC Simulasi',
      'Δ Demand (%)', 'Lead Time Baru (hr)', 'B. Pesan Baru', 'B. Simpan Baru', 'Tanggal Dibuat',
    ]
    const barisXls = rows.map(r => [
      r.nama_skenario, r.nama_obat, r.kode_obat, r.satuan, r.nama_user ?? '',
      r.hasil_simulasi.aktual.eoq ?? '', r.hasil_simulasi.simulasi.eoq ?? '',
      Math.round(r.hasil_simulasi.aktual.safety_stock), Math.round(r.hasil_simulasi.simulasi.safety_stock),
      Math.round(r.hasil_simulasi.aktual.rop), Math.round(r.hasil_simulasi.simulasi.rop),
      r.hasil_simulasi.aktual.total_biaya ?? '', r.hasil_simulasi.simulasi.total_biaya ?? '',
      r.parameter_input.demand_perubahan_pct ?? 0,
      r.parameter_input.lead_time_baru ?? '',
      r.parameter_input.biaya_pesan_baru ?? '',
      r.parameter_input.biaya_simpan_baru ?? '',
      r.created_at,
    ])
    exportExcel('Laporan_Simulasi', kolomXls, barisXls)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">{rows.length} skenario tersimpan</span>
        <ActionBar onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">Nama Skenario</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">Obat</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">EOQ</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">Safety Stock</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">ROP</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">Total Biaya/Thn</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">Dibuat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <LoadingRow cols={7} /> :
             rows.length === 0 ? <EmptyRow cols={7} /> :
             rows.map((r, i) => {
              const a = r.hasil_simulasi.aktual
              const s = r.hasil_simulasi.simulasi
              return (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-3 py-2 font-medium text-gray-900">{r.nama_skenario}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-800">{r.nama_obat}</div>
                    <div className="font-mono text-xs text-gray-400">{r.kode_obat}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="text-gray-500">Sek: {nilaiStr(a.eoq)}</div>
                    <div className="font-semibold text-blue-700">Sim: {nilaiStr(s.eoq)}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="text-gray-500">Sek: {Math.round(a.safety_stock).toLocaleString('id-ID')}</div>
                    <div className="font-semibold text-orange-600">Sim: {Math.round(s.safety_stock).toLocaleString('id-ID')}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="text-gray-500">Sek: {Math.round(a.rop).toLocaleString('id-ID')}</div>
                    <div className="font-semibold text-green-700">Sim: {Math.round(s.rop).toLocaleString('id-ID')}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="text-gray-500">Sek: {a.total_biaya != null ? formatRupiah(a.total_biaya) : '-'}</div>
                    <div className="font-semibold text-blue-700">Sim: {s.total_biaya != null ? formatRupiah(s.total_biaya) : '-'}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatTanggal(r.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <PreviewModal open={preview} onClose={() => setPreview(false)}
        judul="Laporan Skenario Simulasi"
        kolom={kolom} baris={baris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<Tab>('stok')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <FileText className="h-6 w-6 text-blue-600" />
          Laporan & Export
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Filter data, preview tampilan laporan, lalu unduh sebagai PDF atau Excel
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'stok'         && <TabStok />}
        {activeTab === 'barang-masuk' && <TabBarangMasuk />}
        {activeTab === 'barang-keluar'&& <TabBarangKeluar />}
        {activeTab === 'kedaluarsa'   && <TabKedaluarsa />}
        {activeTab === 'eoq-rop'      && <TabEoqRop />}
        {activeTab === 'simulasi'     && <TabSimulasi />}
      </div>
    </div>
  )
}
