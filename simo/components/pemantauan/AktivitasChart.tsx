'use client'

import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TitikHarian } from '@/hooks/useAktivitas'

interface Props {
  data: TitikHarian[]
  satuan: 'hari' | 'minggu'
  height?: number
}

type Baris = TitikHarian & { label: string }

const TICK = { fontSize: 12, fill: 'var(--muted-foreground)' }

// "2026-11-12" -> tanggal lokal (bukan UTC) supaya harinya tidak bergeser.
function tanggalDari(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function IsiTooltip({ active, payload, satuan }: { active?: boolean; payload?: { payload: Baris }[]; satuan: 'hari' | 'minggu' }) {
  if (!active || !payload?.length) return null
  const t = payload[0].payload
  const judul = satuan === 'minggu' ? `Minggu mulai ${format(tanggalDari(t.awal), 'd MMM yyyy', { locale: localeId })}` : format(tanggalDari(t.awal), 'EEEE, d MMM yyyy', { locale: localeId })
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-[13px] text-foreground">
      <p className="mb-1 text-xs text-muted-foreground">{judul}</p>
      <p className="tabular-nums">Aksi data: <b>{t.aksi}</b></p>
      <p className="tabular-nums">Halaman dibuka: <b>{t.halaman}</b></p>
      <p className="tabular-nums">Login berhasil: <b>{t.login}</b></p>
      <p className="tabular-nums">Pengguna aktif: <b>{t.pengguna_aktif}</b></p>
      {t.login_gagal > 0 && <p className="tabular-nums">Login gagal: <b>{t.login_gagal}</b></p>}
    </div>
  )
}

// Aktivitas per hari (per minggu bila rentang panjang). Dua seri dibedakan warna DAN gaya garis (aksi data penuh,
// halaman dibuka putus-putus), bukan warna saja. Aksi data = bukti pemakaian yang mengubah data, jadi seri utama.
export default function AktivitasChart({ data, satuan, height = 260 }: Props) {
  const ada = data.some((d) => d.aksi > 0 || d.halaman > 0 || d.login > 0)
  if (!ada) {
    return (
      <div className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground">
        Belum ada aktivitas tercatat pada rentang ini
      </div>
    )
  }
  const chartData: Baris[] = data.map((d) => ({ ...d, label: format(tanggalDari(d.awal), 'd MMM', { locale: localeId }) }))

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground">
        <li className="flex items-center gap-2">
          <span className="w-5 border-t-2" style={{ borderColor: 'var(--chart-1)' }} aria-hidden="true" />
          Aksi data
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed" style={{ borderColor: 'var(--chart-2)' }} aria-hidden="true" />
          Halaman dibuka
        </li>
      </ul>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={{ stroke: 'var(--border)' }} minTickGap={24} interval="preserveStartEnd" />
          <YAxis tick={TICK} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
          <Tooltip cursor={{ stroke: 'var(--input)' }} content={(p) => <IsiTooltip active={p.active} payload={p.payload as unknown as { payload: Baris }[]} satuan={satuan} />} />
          <Area
            type="monotone"
            dataKey="halaman"
            name="Halaman dibuka"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.08}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={data.length <= 14 ? { r: 3, fill: 'var(--card)', stroke: 'var(--chart-2)', strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: 'var(--chart-2)', stroke: 'var(--card)', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="aksi"
            name="Aksi data"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.1}
            strokeWidth={2}
            dot={data.length <= 14 ? { r: 3, fill: 'var(--card)', stroke: 'var(--chart-1)', strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {satuan === 'minggu' && (
        <p className="mt-3 text-sm text-muted-foreground">Rentang panjang, jadi tiap titik adalah satu minggu (mulai Senin).</p>
      )}

      {/* Padanan teks grafik untuk pembaca layar. */}
      <div className="sr-only">
      <table>
        <caption>Aktivitas per {satuan}</caption>
        <thead>
          <tr><th>{satuan === 'minggu' ? 'Minggu mulai' : 'Tanggal'}</th><th>Aksi data</th><th>Halaman dibuka</th><th>Login berhasil</th><th>Pengguna aktif</th></tr>
        </thead>
        <tbody>
          {chartData.map((d) => (
            <tr key={d.awal}><td>{d.awal}</td><td>{d.aksi}</td><td>{d.halaman}</td><td>{d.login}</td><td>{d.pengguna_aktif}</td></tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
