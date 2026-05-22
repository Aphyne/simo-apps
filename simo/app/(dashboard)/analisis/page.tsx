'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Package, X } from 'lucide-react'
import { useAnalisisPerbandingan, AnalisisDetail } from '@/hooks/useAnalisis'
import { formatRupiah } from '@/lib/utils'

// ── Modal detail perhitungan ──────────────────────────────────────────────────
function DetailModal({ item, onClose }: { item: AnalisisDetail; onClose: () => void }) {
  const D = item.demand_tahunan
  const S = item.biaya_pesan
  const H = item.biaya_simpan
  const Q_trad = item.q_tradisional
  const Q_eoq = item.q_eoq

  const frek_trad     = D / Q_trad
  const bp_trad       = Math.round(frek_trad * S)
  const rata_trad     = Math.round(Q_trad / 2)
  const bs_trad       = Math.round(rata_trad * H)

  const frek_eoq      = D / Q_eoq
  const bp_eoq        = Math.round(frek_eoq * S)
  const rata_eoq      = Math.round(Q_eoq / 2)
  const bs_eoq        = Math.round(rata_eoq * H)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">{item.nama}</h3>
            <p className="text-xs text-gray-400">{item.kode} · {item.satuan}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Parameter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Parameter</p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Demand per tahun</span>
                <span className="font-medium">{D.toLocaleString('id-ID')} {item.satuan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Biaya sekali pesan</span>
                <span className="font-medium">{formatRupiah(S)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Biaya simpan per {item.satuan}/tahun</span>
                <span className="font-medium">{formatRupiah(H)}</span>
              </div>
            </div>
          </div>

          {/* Sebelum EOQ */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Sebelum EOQ — pesan per isi dus ({Q_trad} {item.satuan}/pesan)
            </p>
            <div className="border rounded-lg overflow-hidden text-sm">
              <div className="flex justify-between px-3 py-2 bg-gray-50 border-b">
                <span className="text-gray-600">Berapa kali pesan/tahun</span>
                <span>{D.toLocaleString('id-ID')} ÷ {Q_trad} = <strong>{frek_trad.toFixed(1)} kali</strong></span>
              </div>
              <div className="flex justify-between px-3 py-2 border-b">
                <span className="text-gray-600">Biaya pesan total</span>
                <span>{frek_trad.toFixed(1)} × {formatRupiah(S)} = <strong>{formatRupiah(bp_trad)}</strong></span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-gray-50 border-b">
                <span className="text-gray-600">Rata-rata stok tersimpan</span>
                <span>{Q_trad} ÷ 2 = <strong>{rata_trad} {item.satuan}</strong></span>
              </div>
              <div className="flex justify-between px-3 py-2 border-b">
                <span className="text-gray-600">Biaya simpan total</span>
                <span>{rata_trad} × {formatRupiah(H)} = <strong>{formatRupiah(bs_trad)}</strong></span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-red-50 font-semibold text-red-700">
                <span>Total biaya / tahun</span>
                <span>{formatRupiah(item.tc_tradisional)}</span>
              </div>
            </div>
          </div>

          {/* Dengan EOQ */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Dengan EOQ — pesan optimal ({Q_eoq} {item.satuan}/pesan)
            </p>
            <div className="border rounded-lg overflow-hidden text-sm">
              <div className="flex justify-between px-3 py-2 bg-gray-50 border-b">
                <span className="text-gray-600">Berapa kali pesan/tahun</span>
                <span>{D.toLocaleString('id-ID')} ÷ {Q_eoq} = <strong>{frek_eoq.toFixed(1)} kali</strong></span>
              </div>
              <div className="flex justify-between px-3 py-2 border-b">
                <span className="text-gray-600">Biaya pesan total</span>
                <span>{frek_eoq.toFixed(1)} × {formatRupiah(S)} = <strong>{formatRupiah(bp_eoq)}</strong></span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-gray-50 border-b">
                <span className="text-gray-600">Rata-rata stok tersimpan</span>
                <span>{Q_eoq} ÷ 2 = <strong>{rata_eoq} {item.satuan}</strong></span>
              </div>
              <div className="flex justify-between px-3 py-2 border-b">
                <span className="text-gray-600">Biaya simpan total</span>
                <span>{rata_eoq} × {formatRupiah(H)} = <strong>{formatRupiah(bs_eoq)}</strong></span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-blue-50 font-semibold text-blue-700">
                <span>Total biaya / tahun</span>
                <span>{formatRupiah(item.tc_eoq)}</span>
              </div>
            </div>
          </div>

          {/* Penghematan */}
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-green-800">Penghematan per tahun</span>
            <div className="text-right">
              <div className="text-lg font-bold text-green-700">{formatRupiah(item.penghematan)}</div>
              <div className="text-xs text-green-500">lebih hemat {item.persen_hemat}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Halaman utama ─────────────────────────────────────────────────────────────
export default function AnalisisPage() {
  const { data, isLoading } = useAnalisisPerbandingan()
  const [selectedItem, setSelectedItem] = useState<AnalisisDetail | null>(null)

  const ringkasan = data?.ringkasan
  const detail = data?.detail ?? []

  const chartData = detail.slice(0, 10).map((d) => ({
    nama: d.nama.length > 14 ? d.nama.substring(0, 14) + '…' : d.nama,
    nama_lengkap: d.nama,
    tc_tradisional: d.tc_tradisional,
    tc_eoq: d.tc_eoq,
  }))

  return (
    <div className="space-y-6">
      {/* Modal */}
      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Analisis Komparatif
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Perbandingan total biaya persediaan per tahun: sebelum vs sesudah menerapkan EOQ
        </p>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">Bagaimana cara halaman ini menghitung biaya?</p>
        <p>
          <span className="font-medium">Sebelum EOQ</span> — diasumsikan apotek memesan obat sebanyak
          jumlah isi per dus setiap kali pesan (kebiasaan lama). Semakin sedikit jumlah per pesan,
          semakin sering memesan → biaya pesan lebih besar.
        </p>
        <p>
          <span className="font-medium">Dengan EOQ</span> — sistem menghitung jumlah pesan yang
          paling efisien sehingga total biaya pesan + biaya simpan menjadi seminimal mungkin.
        </p>
        <p className="text-blue-600 text-xs">
          Kolom "Isi per Dus" = data yang sudah Anda isi di halaman Edit Obat (jumlah satuan dalam 1 dus).
          Klik tombol <strong>Detail</strong> di setiap baris untuk melihat rincian perhitungan.
        </p>
      </div>

      {/* Ringkasan cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-gray-50 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Obat Dihitung</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {ringkasan?.total_obat_dihitung ?? 0}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">jenis obat</div>
          </div>

          <div className="rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Biaya Sebelum EOQ</span>
            </div>
            <div className="text-lg font-bold text-gray-700">
              {ringkasan ? formatRupiah(ringkasan.total_tc_tradisional) : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">per tahun</div>
          </div>

          <div className="rounded-xl border p-5 border-blue-200 bg-blue-50/40">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600">Biaya Dengan EOQ</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {ringkasan ? formatRupiah(ringkasan.total_tc_eoq) : '—'}
            </div>
            <div className="text-xs text-blue-400 mt-0.5">per tahun</div>
          </div>

          <div className="rounded-xl border p-5 border-green-200 bg-green-50/40">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600">Total Penghematan</span>
            </div>
            <div className="text-lg font-bold text-green-700">
              {ringkasan ? formatRupiah(ringkasan.total_penghematan) : '—'}
            </div>
            <div className="text-xs text-green-500 mt-0.5">
              {ringkasan ? `${ringkasan.persen_hemat_total}% lebih hemat` : ''}
            </div>
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div className="bg-white rounded-xl border p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Grafik Perbandingan Biaya — Top 10 Obat
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Abu-abu = biaya sebelum EOQ (pesan per isi dus) · Biru = biaya dengan EOQ. Biru seharusnya lebih rendah.
          </p>
        </div>
        {isLoading ? (
          <div className="h-64 bg-gray-50 animate-pulse rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Belum ada obat dengan parameter EOQ lengkap (isi biaya pesan, biaya simpan, dan demand).
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="nama" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                width={65}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatRupiah(value),
                  name === 'tc_eoq' ? 'Biaya Dengan EOQ' : 'Biaya Sebelum EOQ',
                ]}
                labelFormatter={(label) => {
                  const item = chartData.find((d) => d.nama === label)
                  return item?.nama_lengkap ?? label
                }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend
                formatter={(v) => (v === 'tc_eoq' ? 'Biaya Dengan EOQ' : 'Biaya Sebelum EOQ')}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="tc_tradisional" fill="#d1d5db" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tc_eoq" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detail table */}
      <div className="bg-white rounded-xl border">
        <div className="px-5 py-3 border-b">
          <h2 className="text-sm font-semibold text-gray-700">Detail Perbandingan per Obat</h2>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 animate-pulse rounded" />
            ))}
          </div>
        ) : detail.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Belum ada data. Lengkapi parameter biaya pada data obat terlebih dahulu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Obat</th>
                  <th className="px-4 py-3 font-medium text-right">Demand/Thn</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Isi per Dus
                    <div className="text-gray-400 font-normal normal-case">jumlah pesan lama</div>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">
                    EOQ
                    <div className="text-gray-400 font-normal normal-case">jumlah pesan optimal</div>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Biaya Sebelum EOQ</th>
                  <th className="px-4 py-3 font-medium text-right">Biaya Dengan EOQ</th>
                  <th className="px-4 py-3 font-medium text-right">Penghematan</th>
                  <th className="px-4 py-3 font-medium text-right">% Hemat</th>
                  <th className="px-4 py-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.nama}</div>
                      <div className="text-xs text-gray-400">{item.kode} · {item.satuan}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.demand_tahunan.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.q_tradisional}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">
                      {item.q_eoq}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatRupiah(item.tc_tradisional)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-700 font-medium">
                      {formatRupiah(item.tc_eoq)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      {formatRupiah(item.penghematan)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.persen_hemat > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {item.persen_hemat > 0 ? '+' : ''}{item.persen_hemat}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {ringkasan && (
                <tfoot>
                  <tr className="border-t-2 bg-gray-50 font-semibold text-gray-800">
                    <td className="px-4 py-3" colSpan={4}>Total</td>
                    <td className="px-4 py-3 text-right">{formatRupiah(ringkasan.total_tc_tradisional)}</td>
                    <td className="px-4 py-3 text-right text-blue-700">{formatRupiah(ringkasan.total_tc_eoq)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatRupiah(ringkasan.total_penghematan)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        +{ringkasan.persen_hemat_total}%
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
