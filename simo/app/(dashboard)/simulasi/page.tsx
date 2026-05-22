'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { FlaskConical, Save, Trash2, ChevronDown, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  useSimpanSimulasi, useDeleteSimulasi, useSimulasiList,
  SimulasiTersimpan,
} from '@/hooks/useSimulasi'
import { useObatList } from '@/hooks/useObat'
import { formatRupiah, formatTanggal } from '@/lib/utils'

// ── Kalkulasi EOQ client-side (rumus sama persis dengan backend) ───────────────
const Z_SCORE: Record<number, number> = { 90: 1.28, 95: 1.65, 97: 1.88, 99: 2.33 }
const getZ = (sl: number) => Z_SCORE[sl] ?? 1.65

function calcEOQ(D: number, S: number, H: number): number | null {
  if (S <= 0 || H <= 0 || D <= 0) return null
  return Math.sqrt((2 * D * S) / H)
}
function calcSS(sl: number, sigma: number, LT: number): number {
  return getZ(sl) * sigma * Math.sqrt(LT)
}
function calcROP(d: number, LT: number, SS: number): number {
  return d * LT + SS
}
function calcTC(D: number, S: number, eoq: number | null, H: number): number | null {
  if (!eoq || eoq <= 0) return null
  return (D / eoq) * S + (eoq / 2) * H
}

// ── Helper UI ─────────────────────────────────────────────────────────────────
function Selisih({ val, isRupiah = false }: { val: number | null; isRupiah?: boolean }) {
  if (val === null) return <span className="text-gray-300">—</span>
  if (Math.abs(val) < 0.01) return <span className="text-xs text-gray-400">tidak berubah</span>
  const plus = val > 0
  const label = isRupiah ? formatRupiah(Math.abs(val)) : Math.abs(val).toLocaleString('id-ID')
  return (
    <span className={`text-xs font-semibold ${plus ? 'text-red-600' : 'text-green-600'}`}>
      {plus ? '+' : '-'}{label}
    </span>
  )
}

function BarisBanding({
  label, desc, sekarang, simulasi, selisih, satuan, isRupiah = false,
}: {
  label: string; desc?: string
  sekarang: number | null; simulasi: number | null; selisih: number | null
  satuan?: string; isRupiah?: boolean
}) {
  const fmt = (v: number | null) =>
    v === null ? '—'
    : isRupiah ? formatRupiah(v)
    : `${Math.round(v).toLocaleString('id-ID')}${satuan ? ' ' + satuan : ''}`

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2.5 text-sm">
        <div className="font-medium text-gray-700">{label}</div>
        {desc && <div className="text-xs text-gray-400">{desc}</div>}
      </td>
      <td className="px-4 py-2.5 text-sm text-right text-gray-700">{fmt(sekarang)}</td>
      <td className="px-4 py-2.5 text-sm text-right font-semibold text-blue-700">{fmt(simulasi)}</td>
      <td className="px-4 py-2.5 text-sm text-right"><Selisih val={selisih} isRupiah={isRupiah} /></td>
    </tr>
  )
}

// ── Riwayat tersimpan ──────────────────────────────────────────────────────────
function RiwayatSimulasi() {
  const { data: list = [], isLoading } = useSimulasiList()
  const deleteMutation = useDeleteSimulasi()
  const [expanded, setExpanded] = useState<number | null>(null)

  if (isLoading) return <div className="h-16 bg-gray-50 animate-pulse rounded-lg mx-5 mb-4" />
  if (list.length === 0) return (
    <p className="text-sm text-gray-400 text-center py-8">Belum ada simulasi yang disimpan.</p>
  )

  return (
    <div className="divide-y">
      {list.map((s: SimulasiTersimpan) => {
        const p = s.parameter_input
        const h = s.hasil_simulasi
        const isOpen = expanded === s.id
        return (
          <div key={s.id}>
            <div
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => setExpanded(isOpen ? null : s.id)}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{s.nama_skenario}</p>
                <p className="text-xs text-gray-400">
                  {s.nama_obat} · {formatTanggal(s.created_at)}
                  {s.nama_user && ` · oleh ${s.nama_user}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 hidden sm:block">
                  {p.demand_perubahan_pct > 0 ? '+' : ''}{p.demand_perubahan_pct}% permintaan
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(s.id) }}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {isOpen && (
              <div className="px-5 pb-4 bg-gray-50">
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="text-left py-1.5 font-medium">Metrik</th>
                      <th className="text-right py-1.5 font-medium">Sekarang</th>
                      <th className="text-right py-1.5 font-medium text-blue-600">Simulasi</th>
                      <th className="text-right py-1.5 font-medium">Selisih</th>
                    </tr>
                  </thead>
                  <tbody>
                    <BarisBanding label="EOQ" sekarang={h.aktual.eoq} simulasi={h.simulasi.eoq} selisih={h.selisih.eoq} satuan={s.satuan} />
                    <BarisBanding label="Safety Stock" sekarang={h.aktual.safety_stock} simulasi={h.simulasi.safety_stock} selisih={h.selisih.safety_stock} satuan={s.satuan} />
                    <BarisBanding label="ROP" sekarang={h.aktual.rop} simulasi={h.simulasi.rop} selisih={h.selisih.rop} satuan={s.satuan} />
                    <BarisBanding label="Total Biaya/thn" sekarang={h.aktual.total_biaya} simulasi={h.simulasi.total_biaya} selisih={h.selisih.total_biaya} isRupiah />
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Halaman utama ──────────────────────────────────────────────────────────────
export default function SimulasiPage() {
  const { data: obatData } = useObatList({ page: 1, limit: 500 })
  const obatList = obatData?.data ?? []
  const simpan = useSimpanSimulasi()

  const [obatId, setObatId]   = useState('')
  const [pct,    setPct]      = useState('0')
  const [ltBaru, setLtBaru]   = useState('')
  const [bpBaru, setBpBaru]   = useState('')
  const [bsBaru, setBsBaru]   = useState('')
  const [nama,   setNama]     = useState('')

  const o = obatList.find((x) => x.id === Number(obatId))

  const handleSelectObat = (id: string) => {
    setObatId(id)
    const found = obatList.find((x) => x.id === Number(id))
    if (found) {
      setLtBaru(String(found.lead_time ?? 1))
      setBpBaru(String(found.biaya_pesan ?? 0))
      setBsBaru(String(found.biaya_simpan ?? 0))
      setPct('0')
      setNama('')
    }
  }

  const handleReset = () => {
    if (!o) return
    setLtBaru(String(o.lead_time ?? 1))
    setBpBaru(String(o.biaya_pesan ?? 0))
    setBsBaru(String(o.biaya_simpan ?? 0))
    setPct('0')
  }

  // ── Live kalkulasi (client-side, tanpa API call) ─────────────────────────
  const hasil = useMemo(() => {
    if (!o) return null

    const D_akt  = parseFloat(String(o.demand_tahunan)) || 0
    const d_akt  = parseFloat(String(o.demand_harian))  || 0
    const sig    = parseFloat(String(o.std_dev_demand)) || 0
    const sl     = o.service_level || 95
    const LT_akt = parseInt(String(o.lead_time))        || 1
    const S_akt  = parseFloat(String(o.biaya_pesan))    || 0
    const H_akt  = parseFloat(String(o.biaya_simpan))   || 0

    const pctNum = parseFloat(pct) || 0
    const LT_sim = parseInt(ltBaru) || LT_akt
    const S_sim  = parseFloat(bpBaru) || S_akt
    const H_sim  = parseFloat(bsBaru) || H_akt

    const D_sim = D_akt * (1 + pctNum / 100)
    const d_sim = d_akt * (1 + pctNum / 100)
    const sig_sim = sig * (1 + pctNum / 100)

    // Aktual
    const eoq_akt = o.eoq !== null ? parseFloat(String(o.eoq)) : calcEOQ(D_akt, S_akt, H_akt)
    const ss_akt  = parseFloat(String(o.safety_stock)) || calcSS(sl, sig, LT_akt)
    const rop_akt = parseFloat(String(o.rop))          || calcROP(d_akt, LT_akt, ss_akt)
    const tc_akt  = o.total_biaya !== null ? parseFloat(String(o.total_biaya)) : calcTC(D_akt, S_akt, eoq_akt, H_akt)

    // Simulasi
    const eoq_sim = calcEOQ(D_sim, S_sim, H_sim)
    const ss_sim  = calcSS(sl, sig_sim, LT_sim)
    const rop_sim = calcROP(d_sim, LT_sim, ss_sim)
    const tc_sim  = calcTC(D_sim, S_sim, eoq_sim, H_sim)

    return {
      satuan: o.satuan,
      sekarang: {
        demand_tahunan: D_akt, eoq: eoq_akt, safety_stock: ss_akt, rop: rop_akt, total_biaya: tc_akt,
      },
      simulasi: {
        demand_tahunan: Math.round(D_sim),
        demand_harian: parseFloat(d_sim.toFixed(2)),
        biaya_pesan: S_sim, biaya_simpan: H_sim, lead_time: LT_sim,
        eoq: eoq_sim, safety_stock: ss_sim, rop: rop_sim, total_biaya: tc_sim,
      },
      selisih: {
        eoq:          eoq_sim !== null && eoq_akt !== null ? parseFloat((eoq_sim - eoq_akt).toFixed(2)) : null,
        safety_stock: parseFloat((ss_sim  - ss_akt).toFixed(2)),
        rop:          parseFloat((rop_sim - rop_akt).toFixed(2)),
        total_biaya:  tc_sim !== null && tc_akt !== null ? parseFloat((tc_sim - tc_akt).toFixed(2)) : null,
      },
    }
  }, [o, pct, ltBaru, bpBaru, bsBaru])

  const handleSimpan = async () => {
    if (!o || !hasil) return
    if (!nama.trim()) return toast.error('Isi nama skenario terlebih dahulu')
    const pctNum = parseFloat(pct) || 0
    await simpan.mutateAsync({
      obat_id: o.id,
      nama_skenario: nama.trim(),
      parameter_input: {
        demand_perubahan_pct: pctNum,
        lead_time_baru: parseInt(ltBaru) || o.lead_time,
        biaya_pesan_baru: parseFloat(bpBaru) || o.biaya_pesan,
        biaya_simpan_baru: parseFloat(bsBaru) || o.biaya_simpan,
      },
      aktual: {
        demand_tahunan: hasil.sekarang.demand_tahunan,
        demand_harian:  parseFloat(String(o.demand_harian)) || 0,
        biaya_pesan:    parseFloat(String(o.biaya_pesan))   || 0,
        biaya_simpan:   parseFloat(String(o.biaya_simpan))  || 0,
        lead_time:      o.lead_time ?? 1,
        eoq:            hasil.sekarang.eoq,
        safety_stock:   hasil.sekarang.safety_stock,
        rop:            hasil.sekarang.rop,
        total_biaya:    hasil.sekarang.total_biaya,
      },
      simulasi: hasil.simulasi,
      selisih: hasil.selisih,
    })
    setNama('')
  }

  // chart data
  const chartMetrik = hasil ? [
    { metrik: 'EOQ',          Sekarang: Math.round(hasil.sekarang.eoq ?? 0), Simulasi: Math.round(hasil.simulasi.eoq ?? 0) },
    { metrik: 'Safety Stock', Sekarang: Math.round(hasil.sekarang.safety_stock), Simulasi: Math.round(hasil.simulasi.safety_stock) },
    { metrik: 'ROP',          Sekarang: Math.round(hasil.sekarang.rop), Simulasi: Math.round(hasil.simulasi.rop) },
  ] : []


  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-blue-600" />
          Simulasi Skenario
          <span className="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">NOVELTY</span>
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Uji coba "bagaimana jika…" tanpa mengubah data aktual apotek
        </p>
      </div>

      {/* Layout utama: kiri | kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ── KOLOM KIRI ──────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Pilih obat */}
          <div className="bg-white rounded-xl border p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Obat yang Disimulasikan
            </label>
            <select
              value={obatId}
              onChange={(e) => handleSelectObat(e.target.value)}
              className="w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Pilih obat —</option>
              {obatList.map((x) => (
                <option key={x.id} value={x.id}>{x.nama} ({x.kode})</option>
              ))}
            </select>

            {/* Nilai saat ini — compact grid */}
            {o && (
              <div className="mt-3 rounded-lg bg-gray-50 border px-3 py-2.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Nilai Saat Ini
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">D/tahun</span>
                    <span className="font-medium">{Math.round(o.demand_tahunan ?? 0).toLocaleString('id-ID')} {o.satuan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">D/hari</span>
                    <span className="font-medium">{o.demand_harian ?? 0} {o.satuan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Biaya pesan (S)</span>
                    <span className="font-medium">{formatRupiah(o.biaya_pesan ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Biaya simpan (H)</span>
                    <span className="font-medium">{formatRupiah(o.biaya_simpan ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lead time</span>
                    <span className="font-medium">{o.lead_time ?? 1} hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">σ (std dev)</span>
                    <span className="font-medium">{o.std_dev_demand ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Parameter skenario */}
          <div className="bg-white rounded-xl border p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Parameter Skenario
            </p>

            {/* Perubahan permintaan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perubahan Permintaan (%)
                {o && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    → {Math.round((o.demand_tahunan ?? 0) * (1 + (parseFloat(pct) || 0) / 100)).toLocaleString('id-ID')} {o.satuan}/thn
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  value={pct}
                  onChange={(e) => setPct(e.target.value)}
                  step="5"
                  className="w-24 text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-400">%</span>
                <div className="flex gap-1 flex-wrap">
                  {[-20, -10, 0, 10, 20, 30].map((v) => (
                    <button
                      key={v}
                      onClick={() => setPct(String(v))}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        pct === String(v) ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 hover:border-blue-400'
                      }`}
                    >
                      {v > 0 ? '+' : ''}{v}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lead time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Time baru <span className="text-gray-400 font-normal">(hari)</span>
              </label>
              <input
                type="number"
                value={ltBaru}
                onChange={(e) => setLtBaru(e.target.value)}
                min="1"
                className="w-28 text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Biaya pesan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biaya sekali pesan baru <span className="text-gray-400 font-normal">(Rp)</span>
              </label>
              <input
                type="number"
                value={bpBaru}
                onChange={(e) => setBpBaru(e.target.value)}
                step="any"
                className="w-48 text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Biaya simpan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biaya simpan baru <span className="text-gray-400 font-normal">(Rp / unit / tahun)</span>
              </label>
              <input
                type="number"
                value={bsBaru}
                onChange={(e) => setBsBaru(e.target.value)}
                step="any"
                className="w-48 text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              disabled={!o}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset ke nilai aktual
            </button>
          </div>

          {/* Simpan skenario */}
          {hasil && (
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Simpan Skenario Ini
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nama skenario (misal: Penjualan naik 20%)"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="flex-1 text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSimpan}
                  disabled={simpan.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                >
                  <Save className="w-4 h-4" />
                  {simpan.isPending ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
            Simulasi tidak mengubah data aktual obat. Hasil dapat disimpan sebagai catatan untuk pengambilan keputusan.
          </div>
        </div>

        {/* ── KOLOM KANAN ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <p className="text-sm font-semibold text-gray-700">Tabel Perbandingan</p>
            {o && (
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Live update
              </span>
            )}
          </div>

          {!o ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-2">
              <FlaskConical className="w-8 h-8 text-gray-300" />
              <p className="text-sm">Pilih obat di kolom kiri</p>
              <p className="text-xs">Tabel perbandingan akan muncul otomatis</p>
            </div>
          ) : (
            <>
              {/* Tabel perbandingan */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs text-gray-500">
                      <th className="px-4 py-2.5 text-left font-medium">Parameter</th>
                      <th className="px-4 py-2.5 text-right font-medium">Sekarang</th>
                      <th className="px-4 py-2.5 text-right font-medium text-blue-600">Simulasi</th>
                      <th className="px-4 py-2.5 text-right font-medium">Selisih</th>
                    </tr>
                  </thead>
                  <tbody>
                    <BarisBanding
                      label="Permintaan / tahun" satuan={o.satuan}
                      sekarang={hasil!.sekarang.demand_tahunan}
                      simulasi={hasil!.simulasi.demand_tahunan}
                      selisih={hasil!.simulasi.demand_tahunan - hasil!.sekarang.demand_tahunan}
                    />
                    <BarisBanding
                      label="EOQ" desc="jumlah pesan optimal" satuan={o.satuan}
                      sekarang={hasil!.sekarang.eoq}
                      simulasi={hasil!.simulasi.eoq}
                      selisih={hasil!.selisih.eoq}
                    />
                    <BarisBanding
                      label="Safety Stock" desc="stok pengaman" satuan={o.satuan}
                      sekarang={hasil!.sekarang.safety_stock}
                      simulasi={hasil!.simulasi.safety_stock}
                      selisih={hasil!.selisih.safety_stock}
                    />
                    <BarisBanding
                      label="ROP" desc="titik pemesanan ulang" satuan={o.satuan}
                      sekarang={hasil!.sekarang.rop}
                      simulasi={hasil!.simulasi.rop}
                      selisih={hasil!.selisih.rop}
                    />
                    <BarisBanding
                      label="Total Biaya / tahun" isRupiah
                      sekarang={hasil!.sekarang.total_biaya}
                      simulasi={hasil!.simulasi.total_biaya}
                      selisih={hasil!.selisih.total_biaya}
                    />
                  </tbody>
                </table>
              </div>

              {/* Interpretasi singkat */}
              {hasil && (hasil.selisih.eoq !== null || hasil.selisih.total_biaya !== null) && (
                <div className="mx-4 my-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
                  <ul className="space-y-0.5 list-disc list-inside">
                    {hasil.selisih.eoq !== null && Math.abs(hasil.selisih.eoq) >= 0.5 && (
                      <li>
                        Perlu memesan <strong>{Math.abs(Math.round(hasil.selisih.eoq))} {o.satuan}{' '}
                        {hasil.selisih.eoq > 0 ? 'lebih banyak' : 'lebih sedikit'}</strong> per pemesanan.
                      </li>
                    )}
                    {Math.abs(hasil.selisih.rop) >= 0.5 && (
                      <li>
                        Titik pesan ulang (ROP) {hasil.selisih.rop > 0 ? 'naik' : 'turun'} menjadi{' '}
                        <strong>{Math.round(hasil.simulasi.rop)} {o.satuan}</strong>.
                      </li>
                    )}
                    {hasil.selisih.total_biaya !== null && Math.abs(hasil.selisih.total_biaya) >= 1 && (
                      <li>
                        Biaya persediaan/tahun{' '}
                        <strong>{hasil.selisih.total_biaya > 0 ? 'naik' : 'turun'}{' '}
                        {formatRupiah(Math.abs(hasil.selisih.total_biaya))}</strong>.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Chart EOQ · SS · ROP */}
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-500 font-medium mb-1">EOQ · SS · ROP — Sekarang vs Skenario</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartMetrik} margin={{ top: 2, right: 4, left: -10, bottom: 2 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="metrik" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 6 }}
                      formatter={(v: number) => [`${v} ${o.satuan}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Sekarang" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Simulasi"  fill="#2563eb" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Riwayat tersimpan */}
      <div className="bg-white rounded-xl border">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Riwayat Skenario Tersimpan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Klik baris untuk lihat detail</p>
          </div>
        </div>
        <RiwayatSimulasi />
      </div>

    </div>
  )
}
