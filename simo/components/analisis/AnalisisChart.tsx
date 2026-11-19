'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AnalisisDetail } from '@/hooks/useAnalisis'
import { formatRupiah } from '@/lib/utils'

interface Props {
  detail: AnalisisDetail[]
}

const TICK = { fontSize: 12, fill: 'var(--muted-foreground)' }
const SINGKAT = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })
const MAKS_OBAT = 10

function potong(teks: string, maks = 20) {
  return teks.length > maks ? `${teks.slice(0, maks - 1)}…` : teks
}

// Biaya per tahun sebelum dan dengan EOQ untuk obat dengan penghematan terbesar, batang mendatar supaya nama obat terbaca.
// Hanya sepuluh obat (urut penghematan) agar grafik tetap terbaca di tangkapan layar; semua obat ada di tabel di bawahnya.
// Dua seri dibedakan warna (abu-biru vs biru) dan posisi (sebelum selalu di atas), legenda dan angka tertulis.
export default function AnalisisChart({ detail }: Props) {
  const data = [...detail].sort((a, b) => b.penghematan - a.penghematan).slice(0, MAKS_OBAT).map((d) => ({
    nama: potong(d.nama),
    namaLengkap: d.nama,
    sebelum: d.tc_tradisional,
    dengan: d.tc_eoq,
    hemat: d.penghematan,
  }))
  if (data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground">Belum ada obat dengan parameter EOQ lengkap</div>
  }
  const tinggi = data.length * 44 + 36

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground">
        <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: 'var(--chart-2)' }} aria-hidden="true" />Sebelum EOQ</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: 'var(--chart-1)' }} aria-hidden="true" />Dengan EOQ</li>
      </ul>

      <ResponsiveContainer width="100%" height={tinggi}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barGap={3} barCategoryGap="22%">
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tick={TICK} tickLine={false} axisLine={{ stroke: 'var(--border)' }} tickFormatter={(v: number) => SINGKAT.format(v)} />
          <YAxis type="category" dataKey="nama" width={138} tick={{ ...TICK, fill: 'var(--foreground)' }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as (typeof data)[number]
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-[13px] text-foreground">
                  <p className="mb-1 font-medium">{p.namaLengkap}</p>
                  <p className="tabular-nums">Sebelum EOQ: <b>{formatRupiah(p.sebelum)}</b></p>
                  <p className="tabular-nums">Dengan EOQ: <b>{formatRupiah(p.dengan)}</b></p>
                  <p className="tabular-nums text-primary">Hemat: <b>{formatRupiah(p.hemat)}</b></p>
                </div>
              )
            }}
          />
          <Bar dataKey="sebelum" name="Sebelum EOQ" fill="var(--chart-2)" radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
          <Bar dataKey="dengan" name="Dengan EOQ" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>

      <p className="mt-3 text-sm text-muted-foreground">
        {data.length < detail.length ? `${data.length} obat dengan penghematan terbesar dari ${detail.length} obat; ` : ''}biaya per tahun dalam Rupiah.
      </p>

      <div className="sr-only">
        <table>
          <caption>Biaya per tahun sebelum dan dengan EOQ, obat dengan penghematan terbesar</caption>
          <thead><tr><th>Obat</th><th>Sebelum EOQ</th><th>Dengan EOQ</th><th>Penghematan</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.namaLengkap}><td>{d.namaLengkap}</td><td>{formatRupiah(d.sebelum)}</td><td>{formatRupiah(d.dengan)}</td><td>{formatRupiah(d.hemat)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
