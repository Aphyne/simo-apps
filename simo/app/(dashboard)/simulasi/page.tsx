'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Save, Trash2, ChevronDown, RefreshCw, HelpCircle } from 'lucide-react'
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
    <span className={`text-xs font-semibold ${plus ? 'text-red-600' : 'text-emerald-600'}`}>
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
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0">
      <td className="px-4 py-2.5 text-sm">
        <div className="font-medium text-gray-700">{label}</div>
        {desc && <div className="text-xs text-gray-400">{desc}</div>}
      </td>
      <td className="px-4 py-2.5 text-sm text-right text-gray-700">{fmt(sekarang)}</td>
      <td className="px-4 py-2.5 text-sm text-right font-semibold text-blue-600">{fmt(simulasi)}</td>
      <td className="px-4 py-2.5 text-sm text-right"><Selisih val={selisih} isRupiah={isRupiah} /></td>
    </tr>
  )
}

// ── Riwayat tersimpan ──────────────────────────────────────────────────────────
function RiwayatSimulasi() {
  const { data: list = [], isLoading } = useSimulasiList()
  const deleteMutation = useDeleteSimulasi()
  const [expanded, setExpanded] = useState<number | null>(null)

  if (isLoading) return <div className="h-16 animate-pulse bg-gray-100 rounded-xl mx-5 mb-4" />
  if (list.length === 0) return (
    <p className="text-center py-10 text-gray-400 text-sm">Belum ada simulasi yang disimpan.</p>
  )

  return (
    <div className="divide-y divide-gray-100">
      {list.map((s: SimulasiTersimpan) => {
        const p = s.parameter_input
        const h = s.hasil_simulasi
        const isOpen = expanded === s.id
        return (
          <div key={s.id}>
            <div
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
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
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-1.5 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {isOpen && (
              <div className="px-5 pb-4 bg-gray-50/50">
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Metrik</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Sekarang</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-blue-600 uppercase tracking-wide">Simulasi</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Selisih</th>
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

  const [showInfo1, setShowInfo1] = useState(false)
  const [showInfo2, setShowInfo2] = useState(false)
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

  const chartMetrik = hasil ? [
    ...(hasil.sekarang.eoq !== null ? [{ metrik: 'EOQ', Sekarang: Math.round(hasil.sekarang.eoq), Simulasi: Math.round(hasil.simulasi.eoq ?? 0) }] : []),
    { metrik: 'Safety Stock', Sekarang: Math.round(hasil.sekarang.safety_stock), Simulasi: Math.round(hasil.simulasi.safety_stock) },
    { metrik: 'ROP',          Sekarang: Math.round(hasil.sekarang.rop),          Simulasi: Math.round(hasil.simulasi.rop) },
  ] : []

  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

  return (
    <div className="space-y-5">

      {/* ── Pilih obat — selalu full width ──────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Obat yang Disimulasikan</p>
            <p className="text-xs text-gray-400 mt-0.5">Coba-coba skenario, data asli tidak akan berubah.</p>
          </div>
          <button
            onClick={() => setShowInfo1((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${showInfo1 ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            title="Tentang halaman ini"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
        {showInfo1 && (
          <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700 leading-relaxed">
            Halaman ini untuk mencoba skenario bagaimana jika terjadi perubahan. Misalnya menjelang musim hujan saat permintaan obat flu dan batuk mulai naik, atau saat supplier akan menaikkan harga. Coba ubah angkanya, lihat hasilnya, lalu putuskan kapan harus pesan dan berapa banyak. Hasilnya hanya perkiraan dan tidak mengubah data yang sudah ada.
          </div>
        )}
        <div className="relative">
          <select
            value={obatId}
            onChange={(e) => handleSelectObat(e.target.value)}
            className={`w-full appearance-none ${inputCls} pr-8`}
          >
            <option value="">— Pilih obat untuk memulai simulasi —</option>
            {obatList.map((x) => (
              <option key={x.id} value={x.id}>{x.nama} ({x.kode})</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Nilai saat ini — muncul setelah pilih */}
        {o && (
          <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Nilai Saat Ini</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-1 text-xs">
              <div>
                <p className="text-gray-400">D/tahun</p>
                <p className="font-medium text-gray-700">{Math.round(o.demand_tahunan ?? 0).toLocaleString('id-ID')} {o.satuan}</p>
              </div>
              <div>
                <p className="text-gray-400">D/hari</p>
                <p className="font-medium text-gray-700">{o.demand_harian ?? 0} {o.satuan}</p>
              </div>
              <div>
                <p className="text-gray-400">Biaya pesan (S)</p>
                <p className="font-medium text-gray-700">{formatRupiah(o.biaya_pesan ?? 0)}</p>
              </div>
              <div>
                <p className="text-gray-400">Biaya simpan (H)</p>
                <p className="font-medium text-gray-700">{formatRupiah(o.biaya_simpan ?? 0)}</p>
              </div>
              <div>
                <p className="text-gray-400">Lead time</p>
                <p className="font-medium text-gray-700">{o.lead_time ?? 1} hari</p>
              </div>
              <div>
                <p className="text-gray-400">σ (std dev)</p>
                <p className="font-medium text-gray-700">{o.std_dev_demand ?? 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Parameter + Perbandingan — hanya muncul setelah pilih obat ─── */}
      {o && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* KOLOM KIRI — Parameter */}
          <div className="flex flex-col gap-4 h-full">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Parameter Skenario</p>
                <button
                  onClick={() => setShowInfo2((v) => !v)}
                  className={`p-1.5 rounded-lg transition-colors ${showInfo2 ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  title="Penjelasan parameter"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              {showInfo2 && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700 leading-relaxed space-y-2">
                  <p><span className="font-semibold">Perubahan Permintaan.</span> Naikkan jika perkiraan bulan depan penjualan lebih ramai (misal musim hujan), turunkan jika diperkirakan sepi. Misal +10% artinya jika biasanya terjual 100/bulan, jadi 110/bulan. Sistem akan hitung ulang berapa jumlah pesanan dan kapan harus pesan agar stok tidak kurang dan tidak berlebihan.</p>
                  <p><span className="font-semibold">Lead Time.</span> Berapa hari dari pesan ke supplier sampai obat tiba. Kalau supplier pernah telat, coba naikkan angkanya, sistem akan tunjukkan apakah stok pengaman masih cukup.</p>
                  <p><span className="font-semibold">Biaya sekali pesan.</span> Ongkir ditambah biaya admin per pemesanan. Kalau ongkir naik, sistem hitung ulang apakah lebih hemat pesan sedikit-sering atau banyak-jarang.</p>
                  <p><span className="font-semibold">Biaya simpan.</span> Biaya menyimpan 1 unit obat selama setahun (listrik, ruang, dll). Kalau gudang penuh dan ada biaya tambahan, ubah angkanya dan lihat pengaruhnya ke jumlah pesanan paling hemat.</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Perubahan Permintaan (%)
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    → {Math.round((o.demand_tahunan ?? 0) * (1 + (parseFloat(pct) || 0) / 100)).toLocaleString('id-ID')} {o.satuan}/thn
                  </span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    value={pct}
                    onChange={(e) => setPct(e.target.value)}
                    step="5"
                    className={`w-24 ${inputCls}`}
                  />
                  <span className="text-sm text-gray-400">%</span>
                  <div className="flex gap-1 flex-wrap">
                    {[-20, -10, 0, 10, 20, 30].map((v) => (
                      <button
                        key={v}
                        onClick={() => setPct(String(v))}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          pct === String(v)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {v > 0 ? '+' : ''}{v}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Lead Time baru <span className="text-gray-400 font-normal">(hari)</span>
                </label>
                <input
                  type="number"
                  value={ltBaru}
                  onChange={(e) => setLtBaru(e.target.value)}
                  min="1"
                  className={`w-28 ${inputCls}`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Biaya sekali pesan baru <span className="text-gray-400 font-normal">(Rp)</span>
                </label>
                <input
                  type="number"
                  value={bpBaru}
                  onChange={(e) => setBpBaru(e.target.value)}
                  step="any"
                  className={`w-48 ${inputCls}`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Biaya simpan baru <span className="text-gray-400 font-normal">(Rp / unit / tahun)</span>
                </label>
                <input
                  type="number"
                  value={bsBaru}
                  onChange={(e) => setBsBaru(e.target.value)}
                  step="any"
                  className={`w-48 ${inputCls}`}
                />
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset ke nilai aktual
              </button>
            </div>

            {/* Simpan skenario */}
            {hasil && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-3">Simpan Skenario Ini</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama skenario (misal: Penjualan naik 20%)"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className={`flex-1 ${inputCls}`}
                  />
                  <button
                    onClick={handleSimpan}
                    disabled={simpan.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    {simpan.isPending ? 'Menyimpan…' : 'Simpan'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* KOLOM KANAN — Tabel + Chart */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700">Tabel Perbandingan</p>
              <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
                Live update
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Parameter</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Sekarang</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600 uppercase tracking-wide">Simulasi</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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

            {/* Interpretasi singkat — hanya tampil jika ada perubahan bermakna */}
            {hasil && (() => {
              const lines = [
                hasil.selisih.eoq !== null && Math.abs(hasil.selisih.eoq) >= 0.5
                  ? <p key="eoq">Jumlah pesanan optimal <strong>{hasil.selisih.eoq > 0 ? 'naik' : 'turun'} {Math.abs(Math.round(hasil.selisih.eoq))} {o.satuan}</strong> per pemesanan.</p>
                  : null,
                Math.abs(hasil.selisih.rop) >= 0.5
                  ? <p key="rop">Titik pesan ulang (ROP) {hasil.selisih.rop > 0 ? 'naik' : 'turun'} menjadi <strong>{Math.round(hasil.simulasi.rop)} {o.satuan}</strong>.</p>
                  : null,
                hasil.selisih.total_biaya !== null && Math.abs(hasil.selisih.total_biaya) >= 1
                  ? <p key="biaya">Biaya persediaan per tahun <strong>{hasil.selisih.total_biaya > 0 ? 'naik' : 'turun'} {formatRupiah(Math.abs(hasil.selisih.total_biaya))}</strong>.</p>
                  : null,
              ].filter(Boolean)
              return lines.length > 0 ? (
                <div className="mx-4 my-3 rounded-lg bg-orange-100 border border-orange-200 px-3 py-2.5 text-xs text-orange-700 space-y-1">
                  {lines}
                </div>
              ) : null
            })()}

            {/* Chart */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-5 pt-4 pb-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-500">Perbandingan Sekarang vs Skenario</p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-[#94a3b8] inline-block flex-shrink-0" />
                    Sekarang
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-[#2563eb] inline-block flex-shrink-0" />
                    Simulasi
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={chartMetrik} margin={{ top: 4, right: 8, left: -8, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="metrik" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    formatter={(v: number) => [`${v} ${o.satuan}`, '']}
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="Sekarang" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Simulasi"  fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ── Riwayat — selalu full width di bawah ─────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Riwayat Skenario Tersimpan</h2>
          <p className="text-xs text-gray-400 mt-0.5">Klik baris untuk lihat detail</p>
        </div>
        <RiwayatSimulasi />
      </div>

    </div>
  )
}
