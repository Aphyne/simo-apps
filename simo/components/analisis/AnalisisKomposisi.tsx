'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { AnalisisRingkasan } from '@/hooks/useAnalisis'
import { formatRupiah } from '@/lib/utils'

const TICK = { fontSize: 12, fill: 'var(--muted-foreground)' }
const SINGKAT = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })

// Dua kolom bertumpuk: biaya pemesanan dan biaya penyimpanan, sebelum vs dengan EOQ (jumlah semua obat). Menunjukkan
// MENGAPA EOQ lebih murah: biaya pesan dan biaya simpan diseimbangkan, bukan salah satunya ditekan. Angkanya ditulis
// di tabel kecil di bawah grafik, jadi tidak bergantung pada warna.
export default function AnalisisKomposisi({ ringkasan: r }: { ringkasan: AnalisisRingkasan }) {
  const data = [
    { nama: 'Sebelum EOQ', pesan: r.total_bp_tradisional, simpan: r.total_bs_tradisional },
    { nama: 'Dengan EOQ', pesan: r.total_bp_eoq, simpan: r.total_bs_eoq },
  ]
  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground">
        <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: 'var(--chart-1)' }} aria-hidden="true" />Biaya pemesanan</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: 'var(--chart-3)' }} aria-hidden="true" />Biaya penyimpanan</li>
      </ul>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="32%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="nama" tick={{ ...TICK, fill: 'var(--foreground)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
          <YAxis tick={TICK} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => SINGKAT.format(v)} />
          <Bar dataKey="pesan" name="Biaya pemesanan" stackId="a" fill="var(--chart-1)" isAnimationActive={false} />
          <Bar dataKey="simpan" name="Biaya penyimpanan" stackId="a" fill="var(--chart-3)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>

      <table className="mt-3 w-full text-sm">
        <caption className="sr-only">Biaya pemesanan dan penyimpanan per tahun, sebelum dan dengan EOQ</caption>
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-1.5 text-left font-medium"><span className="sr-only">Komponen</span></th>
            <th scope="col" className="pb-1.5 text-right font-medium">Sebelum EOQ</th>
            <th scope="col" className="pb-1.5 text-right font-medium">Dengan EOQ</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          <tr className="border-t"><th scope="row" className="py-2 text-left font-normal text-muted-foreground">Pemesanan</th><td className="py-2 text-right">{formatRupiah(r.total_bp_tradisional)}</td><td className="py-2 text-right">{formatRupiah(r.total_bp_eoq)}</td></tr>
          <tr className="border-t"><th scope="row" className="py-2 text-left font-normal text-muted-foreground">Penyimpanan</th><td className="py-2 text-right">{formatRupiah(r.total_bs_tradisional)}</td><td className="py-2 text-right">{formatRupiah(r.total_bs_eoq)}</td></tr>
          <tr className="border-t font-semibold text-foreground"><th scope="row" className="py-2 text-left font-semibold">Total</th><td className="py-2 text-right">{formatRupiah(r.total_tc_tradisional)}</td><td className="py-2 text-right">{formatRupiah(r.total_tc_eoq)}</td></tr>
        </tbody>
      </table>
    </div>
  )
}
