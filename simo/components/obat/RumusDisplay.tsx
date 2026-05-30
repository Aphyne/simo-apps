'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatRupiah, formatAngka } from '@/lib/utils'
import type { DetailPerhitungan, LangkahPerhitungan } from '@/types/obat'

type ModalKey = 'eoq' | 'ss' | 'rop' | 'tc' | null

// ─── Parameter mini grid (hanya yang relevan, 2 kolom) ───────────────────────
function ParamGrid({ items }: { items: { label: string; nilai: string }[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Parameter yang Digunakan
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((p, idx) => (
          <div key={p.label} className={`bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 ${idx === items.length - 1 && items.length % 2 !== 0 ? 'col-span-2' : ''}`}>
            <p className="text-xs text-gray-400 mb-0.5">{p.label}</p>
            <p className="text-sm font-semibold text-gray-800">{p.nilai}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Parameter lengkap untuk tampilan utama ───────────────────────────────────
function ParamGridAll({ input }: { input: DetailPerhitungan['input'] }) {
  const items = [
    { label: 'D — Demand Tahunan', nilai: `${formatAngka(input.D, 0)} unit/tahun` },
    { label: 'd — Demand Harian',  nilai: `${formatAngka(input.demand_harian, 2)} unit/hari` },
    { label: 'σ — Std. Deviasi',   nilai: `${formatAngka(input.sigma, 4)} unit/hari` },
    { label: 'S — Biaya Pesan',    nilai: formatRupiah(input.S) },
    { label: 'H — Biaya Simpan',   nilai: `${formatRupiah(input.H)}/unit/thn` },
    { label: 'LT — Lead Time',     nilai: `${input.LT} hari` },
    { label: 'Z — Service Level',  nilai: `${input.Z}` },
  ]
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Parameter yang Digunakan
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map((p, idx) => (
          <div key={p.label} className={`bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 ${idx === items.length - 1 && items.length % 4 !== 0 ? 'col-span-2 sm:col-span-2' : ''}`}>
            <p className="text-xs text-gray-400">{p.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{p.nilai}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Kartu langkah perhitungan ────────────────────────────────────────────────
function KartuLangkah({
  nomor, judul, borderColor, badgeColor, langkah, satuan, isRupiah,
}: {
  nomor: number
  judul: string
  borderColor: string
  badgeColor: string
  langkah: LangkahPerhitungan
  satuan?: string
  isRupiah?: boolean
}) {
  const hasilStr =
    langkah.hasil === null ? '—'
    : isRupiah ? formatRupiah(langkah.hasil)
    : `${formatAngka(langkah.hasil, 2)}${satuan ? ` ${satuan}` : ''}`

  return (
    <div className={`rounded-xl border border-gray-200 border-l-4 ${borderColor} bg-white p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 w-7 h-7 rounded-lg ${badgeColor} text-xs font-bold flex items-center justify-center`}>
          {nomor}
        </span>
        <div className="flex-1 space-y-2 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{judul}</p>

          <div className="bg-gray-50 rounded-lg px-3 py-1.5 font-mono text-sm text-gray-700 border border-gray-100 break-all">
            {langkah.rumus}
          </div>

          <div className="text-sm text-gray-600 break-words">
            <span className="text-xs text-gray-400 uppercase tracking-wide mr-2">Substitusi:</span>
            <span className="font-mono break-all">{langkah.substitusi}</span>
          </div>

          {langkah.langkah && (
            <div className="text-sm text-gray-600 break-words">
              <span className="text-xs text-gray-400 uppercase tracking-wide mr-2">Kalkulasi:</span>
              <span className="font-mono break-all">{langkah.langkah}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500">Hasil:</span>
            {langkah.hasil !== null ? (
              <span className="text-lg font-bold text-gray-900">{hasilStr}</span>
            ) : (
              <span className="text-sm text-gray-400 italic">Tidak dapat dihitung</span>
            )}
          </div>

          {langkah.catatan && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-700">
              {langkah.catatan}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Card hasil (dengan tombol ⓘ) ────────────────────────────────────────────
function HasilCard({
  label, nilai, satuan, warna, bgWarna, borderColor, isRupiah, onInfo,
}: {
  label: string
  nilai: number | null | undefined
  satuan?: string
  warna: string
  bgWarna: string
  borderColor: string
  isRupiah?: boolean
  onInfo: () => void
}) {
  return (
    <div className={`relative bg-white rounded-xl border border-gray-200 border-l-4 ${borderColor} shadow-sm p-5 text-center`}>
      <button
        onClick={onInfo}
        className="absolute top-3 right-3 p-1 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
        title="Lihat detail perhitungan"
      >
        <Info className="w-4 h-4" />
      </button>

      <div className={`w-10 h-10 rounded-xl ${bgWarna} flex items-center justify-center mx-auto mb-3`}>
        <span className={`text-xs font-bold ${warna}`}>{label}</span>
      </div>

      {nilai !== null && nilai !== undefined ? (
        <p className={`text-2xl font-bold ${warna} leading-tight`}>
          {isRupiah ? formatRupiah(nilai) : formatAngka(nilai, 2)}
        </p>
      ) : (
        <p className="text-sm text-gray-300 italic">Tidak dapat dihitung</p>
      )}

      {satuan && nilai !== null && nilai !== undefined && (
        <p className="text-xs text-gray-400 mt-1">{satuan}</p>
      )}
    </div>
  )
}

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function RumusDisplay({ data }: { data: DetailPerhitungan }) {
  const { input, langkah_eoq, langkah_safety_stock, langkah_rop, langkah_tc } = data
  const [openModal, setOpenModal] = useState<ModalKey>(null)

  const cards = [
    {
      key: 'eoq' as ModalKey,
      label: 'EOQ',
      nilai: langkah_eoq.hasil,
      satuan: 'unit per pemesanan',
      warna: 'text-blue-600',
      bgWarna: 'bg-blue-100',
      judul: 'Economic Order Quantity (EOQ)',
      borderColor: 'border-l-blue-500',
      badgeColor: 'bg-blue-100 text-blue-600',
      langkah: langkah_eoq,
      params: [
        { label: 'D — Demand Tahunan', nilai: `${formatAngka(input.D, 0)} unit/tahun` },
        { label: 'S — Biaya Pesan',    nilai: formatRupiah(input.S) },
        { label: 'H — Biaya Simpan',   nilai: `${formatRupiah(input.H)}/unit/tahun` },
      ],
    },
    {
      key: 'ss' as ModalKey,
      label: 'SS',
      nilai: langkah_safety_stock.hasil,
      satuan: 'unit stok pengaman',
      warna: 'text-emerald-600',
      bgWarna: 'bg-emerald-100',
      judul: 'Safety Stock (SS) — Stok Pengaman',
      borderColor: 'border-l-emerald-500',
      badgeColor: 'bg-emerald-100 text-emerald-600',
      langkah: langkah_safety_stock,
      params: [
        { label: 'Z — Service Level', nilai: `${input.Z}` },
        { label: 'σ — Std. Deviasi',  nilai: `${formatAngka(input.sigma, 4)} unit/hari` },
        { label: 'LT — Lead Time',    nilai: `${input.LT} hari` },
      ],
    },
    {
      key: 'rop' as ModalKey,
      label: 'ROP',
      nilai: langkah_rop.hasil,
      satuan: 'unit titik pemesanan ulang',
      warna: 'text-orange-500',
      bgWarna: 'bg-orange-100',
      judul: 'Reorder Point (ROP) — Titik Pemesanan Ulang',
      borderColor: 'border-l-orange-500',
      badgeColor: 'bg-orange-100 text-orange-500',
      langkah: langkah_rop,
      params: [
        { label: 'd — Demand Harian', nilai: `${formatAngka(input.demand_harian, 2)} unit/hari` },
        { label: 'LT — Lead Time',    nilai: `${input.LT} hari` },
      ],
    },
    {
      key: 'tc' as ModalKey,
      label: 'TC',
      nilai: langkah_tc.hasil,
      warna: 'text-purple-600',
      bgWarna: 'bg-purple-100',
      judul: 'Total Cost (TC) — Total Biaya Persediaan',
      borderColor: 'border-l-purple-500',
      badgeColor: 'bg-purple-100 text-purple-600',
      langkah: langkah_tc,
      isRupiah: true,
      params: [
        { label: 'D — Demand Tahunan', nilai: `${formatAngka(input.D, 0)} unit/tahun` },
        { label: 'S — Biaya Pesan',    nilai: formatRupiah(input.S) },
        { label: 'H — Biaya Simpan',   nilai: `${formatRupiah(input.H)}/unit/tahun` },
      ],
    },
  ]

  const activeCard = cards.find((c) => c.key === openModal)

  return (
    <div className="space-y-5">

      {/* ── Semua Parameter (ringkas, main view) ─────────────────────────── */}
      <ParamGridAll input={input} />

      {/* ── 4 Hasil Kalkulasi ───────────────────────────────────────────── */}
      <div>
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
          Klik <Info className="w-3 h-3" /> pada kartu untuk melihat langkah perhitungan
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.map((c) => (
            <HasilCard
              key={String(c.key)}
              label={c.label}
              nilai={c.nilai}
              satuan={c.satuan}
              warna={c.warna}
              bgWarna={c.bgWarna}
              borderColor={c.borderColor}
              isRupiah={c.isRupiah}
              onInfo={() => setOpenModal(c.key)}
            />
          ))}
        </div>
      </div>

      {/* ── Modal Detail Langkah ────────────────────────────────────────── */}
      <Dialog open={openModal !== null} onOpenChange={(open) => { if (!open) setOpenModal(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-gray-800 pr-6">
              {activeCard?.judul}
            </DialogTitle>
          </DialogHeader>

          {activeCard && (
            <div className="space-y-4">
              <ParamGrid items={activeCard.params} />
              <KartuLangkah
                nomor={cards.findIndex((c) => c.key === openModal) + 1}
                judul={activeCard.judul}
                borderColor={activeCard.borderColor}
                badgeColor={activeCard.badgeColor}
                langkah={activeCard.langkah}
                satuan={activeCard.satuan}
                isRupiah={activeCard.isRupiah}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
