'use client'

import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Info } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatRupiah } from '@/lib/utils'

interface Titik {
  bulan: string // YYYY-MM-DD (tanggal 1)
  pembelian: number
  penjualan: number
  penjualan_tanpa_harga: number
}

type Baris = Titik & { label: string }

interface Props {
  data: Titik[]
  height?: number
}

const TICK = { fontSize: 12, fill: 'var(--muted-foreground)' }
const SINGKAT = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })

// Label bulan di sumbu X; bulan yang penjualannya tidak lengkap diberi tulisan kedua (bukan hanya warna).
function TickBulan({ x, y, payload, tidakLengkap }: { x?: number; y?: number; payload?: { value: string }; tidakLengkap: Set<string> }) {
  const teks = payload?.value ?? ''
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text x={0} y={0} dy={14} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)">{teks}</text>
      {tidakLengkap.has(teks) && (
        <text x={0} y={0} dy={28} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-warning-700)">tidak lengkap</text>
      )}
    </g>
  )
}

// "2026-10-01" -> tanggal lokal (bukan UTC) supaya bulannya tidak bergeser.
function bulanDari(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Dua area per bulan (6 bulan). Dua seri dibedakan oleh warna DAN gaya garis (putus-putus untuk pembelian), bukan warna saja.
// Pembelian stok dan penjualan per bulan dalam Rupiah (sepadan lintas satuan obat). Dibaca sebagai "belanja stok vs hasil
// jual", bukan laba. Penjualan yang belum ber-harga tidak terhitung dan diberi catatan, supaya penjualan yang rendah tidak
// terbaca sebagai penjualan yang memang kecil.
export default function PembelianPenjualanChart({ data, height = 240 }: Props) {
  const ada = data.some((d) => d.pembelian > 0 || d.penjualan > 0)
  if (!ada) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Belum ada pembelian atau penjualan ber-harga dalam 6 bulan terakhir
      </div>
    )
  }

  // Bulan kosong di awal dibuang (garis datar tidak memberi informasi); bulan kosong sesudah ada data tetap tampil.
  const awal = data.findIndex((d) => d.pembelian > 0 || d.penjualan > 0 || d.penjualan_tanpa_harga > 0)
  const chartData: Baris[] = data.slice(Math.max(awal, 0)).map((d) => ({
    ...d,
    label: format(bulanDari(d.bulan), 'MMM yyyy', { locale: localeId }),
  }))
  const tanpaHarga = chartData.filter((d) => d.penjualan_tanpa_harga > 0)
  const bulanTidakLengkap = new Set(tanpaHarga.map((d) => d.label))

  return (
    <div>
      {/* Legenda ditulis sendiri: contoh garis (putus-putus atau penuh) + teks, bukan warna saja. */}
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground">
        <li className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed" style={{ borderColor: 'var(--chart-2)' }} aria-hidden="true" />
          Pembelian stok
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 border-t-2" style={{ borderColor: 'var(--chart-1)' }} aria-hidden="true" />
          Penjualan
        </li>
      </ul>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            height={bulanTidakLengkap.size > 0 ? 46 : 30}
            tick={(p: { x?: number; y?: number; payload?: { value: string } }) => <TickBulan {...p} tidakLengkap={bulanTidakLengkap} />}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis tick={TICK} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => SINGKAT.format(v)} />
          <Tooltip
            cursor={{ stroke: 'var(--input)' }}
            formatter={(value: number, nama: string) => [formatRupiah(value), nama]}
            labelStyle={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 2 }}
            itemStyle={{ color: 'var(--foreground)' }}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--popover)', boxShadow: 'none' }}
          />
          <Area
            type="monotone"
            dataKey="pembelian"
            name="Pembelian stok"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.1}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={{ r: 3, fill: 'var(--card)', stroke: 'var(--chart-2)', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: 'var(--chart-2)', stroke: 'var(--card)', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="penjualan"
            name="Penjualan"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.1}
            strokeWidth={2}
            dot={(p: { cx?: number; cy?: number; index?: number; payload?: Baris }) => {
              const rusak = (p.payload?.penjualan_tanpa_harga ?? 0) > 0
              if (p.cx === undefined || p.cy === undefined) return <g key={p.index} />
              return (
                <circle
                  key={p.index}
                  cx={p.cx}
                  cy={p.cy}
                  r={rusak ? 5 : 3}
                  fill="var(--card)"
                  stroke={rusak ? 'var(--color-warning-700)' : 'var(--chart-1)'}
                  strokeWidth={2}
                  strokeDasharray={rusak ? '2 2' : undefined}
                />
              )
            }}
            activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {tanpaHarga.length > 0 && (
        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Bulan bertanda &ldquo;tidak lengkap&rdquo; punya penjualan yang belum ber-harga dan tidak terhitung, jadi garis
            penjualannya lebih rendah dari kenyataan:{' '}
            {tanpaHarga.map((d) => `${d.label} (${d.penjualan_tanpa_harga} baris)`).join(', ')}.
          </span>
        </p>
      )}

      {/* Padanan teks grafik untuk pembaca layar. */}
      <table className="sr-only">
        <caption>Pembelian stok dan penjualan per bulan, dalam Rupiah</caption>
        <thead>
          <tr><th>Bulan</th><th>Pembelian stok</th><th>Penjualan</th></tr>
        </thead>
        <tbody>
          {chartData.map((d) => (
            <tr key={d.bulan}><td>{d.label}</td><td>{formatRupiah(d.pembelian)}</td><td>{formatRupiah(d.penjualan)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
