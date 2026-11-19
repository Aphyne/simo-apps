'use client'

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { AnalitikAktivitas } from '@/hooks/useAktivitas'

interface Props {
  data: AnalitikAktivitas['aksi_jenis']
}

const IRISAN = [
  { kunci: 'tambah', label: 'Menambah data', warna: 'var(--chart-1)' },
  { kunci: 'ubah', label: 'Mengubah data', warna: 'var(--chart-2)' },
  { kunci: 'hapus', label: 'Menghapus data', warna: 'var(--chart-3)' },
  { kunci: 'lainnya', label: 'Lainnya', warna: 'var(--chart-4)' },
] as const

// Komposisi aksi data (tambah, ubah, hapus). Donat dengan legenda bertulis lengkap dengan jumlah dan persen, jadi tidak
// bergantung pada warna. Lainnya = reset password, ubah status aktif, hitung ulang EOQ/ROP.
export default function JenisAksiDonut({ data }: Props) {
  const total = IRISAN.reduce((a, i) => a + data[i.kunci], 0)
  if (total === 0) {
    return <div className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">Belum ada aksi data pada rentang ini</div>
  }
  const tampil = IRISAN.filter((i) => data[i.kunci] > 0)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative size-36 shrink-0" role="img" aria-label={`${total} aksi data: ${tampil.map((i) => `${data[i.kunci]} ${i.label.toLowerCase()}`).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={tampil.map((i) => ({ nama: i.label, nilai: data[i.kunci] }))} dataKey="nilai" nameKey="nama" innerRadius={44} outerRadius={68} paddingAngle={2} stroke="var(--card)" strokeWidth={2} isAnimationActive={false}>
              {tampil.map((i) => <Cell key={i.kunci} fill={i.warna} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className="text-2xl font-semibold leading-none tabular-nums text-foreground">{total}</span>
          <span className="mt-1 text-xs text-muted-foreground">aksi data</span>
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-3">
        {tampil.map((i) => (
          <li key={i.kunci} className="flex items-start gap-2.5 text-sm">
            <span className="mt-1 size-3 shrink-0 rounded-sm" style={{ backgroundColor: i.warna }} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-foreground">{i.label}</span>
              <span className="block tabular-nums text-muted-foreground">
                {data[i.kunci]} aksi <span aria-hidden="true">· {Math.round((data[i.kunci] / total) * 100)}%</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
