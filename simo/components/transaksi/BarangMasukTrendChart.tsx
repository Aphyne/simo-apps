'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartColumn, TriangleAlert } from 'lucide-react'
import Panel from '@/components/dashboard/Panel'
import Segmented from '@/components/shared/Segmented'
import StateMessage from '@/components/shared/StateMessage'
import { Button } from '@/components/ui/button'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import { formatAngka, formatRupiah } from '@/lib/utils'
import type { BarangMasuk } from '@/types/obat'
import { useNow } from '@/hooks/useNow'

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const TICK = { fontSize: 12, fill: 'var(--muted-foreground)' }

interface Props {
  allList: BarangMasuk[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  className?: string
}

type Mode = 'mingguan' | 'bulanan'

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function BarangMasukTrendChart({ allList, isLoading, isError, onRetry, className }: Props) {
  const now = useNow()
  const currentYear = now.getFullYear()

  const [mode, setMode] = useState<Mode>('bulanan')
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(currentYear)
    allList.forEach(item => {
      if (item.tanggal) years.add(new Date(item.tanggal).getFullYear())
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [allList, currentYear])

  // Unit dan nilai Rp dihitung sekaligus; keduanya tampil di tooltip saat hover
  function sumItems(items: BarangMasuk[]) {
    return {
      unit: items.reduce((sum, item) => sum + (item.jumlah_satuan ?? 0), 0),
      nilai: items.reduce((sum, item) => sum + ((item.jumlah_satuan ?? 0) * (item.harga_beli ?? 0)), 0),
    }
  }

  const trendData = useMemo(() => {
    if (mode === 'mingguan') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (6 - i))
        const key = ymd(d)
        const items = allList.filter(item => item.tanggal && ymd(new Date(item.tanggal)) === key)
        return { label: `${d.getDate()}/${d.getMonth() + 1}`, ...sumItems(items) }
      })
    }

    return Array.from({ length: 12 }, (_, i) => {
      const items = allList.filter(item => {
        if (!item.tanggal) return false
        const td = new Date(item.tanggal)
        return td.getFullYear() === selectedYear && td.getMonth() === i
      })
      return { label: MONTHS[i], ...sumItems(items) }
    })
  }, [allList, mode, selectedYear, now])

  const periodeLabel = mode === 'mingguan' ? '7 hari terakhir' : `tahun ${selectedYear}`
  const total = trendData.reduce((s, d) => s + d.unit, 0)
  // Total pengeluaran periode ini (harga beli sesudah PPN x jumlah). Baris tanpa harga beli tidak bisa dijumlahkan: dihitung terpisah.
  const totalRupiah = trendData.reduce((s, d) => s + d.nilai, 0)
  const tanpaHarga = useMemo(() => {
    const dari = new Date(now)
    dari.setDate(dari.getDate() - 6)
    const dariYmd = ymd(dari)
    const sampaiYmd = ymd(now)
    return allList.filter((item) => {
      if (!item.tanggal || item.harga_beli != null) return false
      const td = new Date(item.tanggal)
      if (mode === 'mingguan') {
        const k = ymd(td)
        return k >= dariYmd && k <= sampaiYmd
      }
      return td.getFullYear() === selectedYear
    }).length
  }, [allList, mode, selectedYear, now])

  return (
    <Panel title="Tren stok masuk" className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Periode grafik"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'mingguan', label: '7 hari' },
            { value: 'bulanan', label: 'Per bulan' },
          ]}
        />
        {mode === 'bulanan' && (
          <PilihanCombobox
            aria-label="Tahun grafik"
            className="w-28"
            options={availableYears.map((y) => ({ value: String(y), label: String(y) }))}
            value={String(selectedYear)}
            onChange={(v) => setSelectedYear(Number(v))}
            noun="tahun"
          />
        )}
      </div>

      {isError ? (
        <StateMessage
          icon={TriangleAlert}
          title="Grafik belum bisa dimuat"
          description="Ini bukan berarti tidak ada stok masuk. Periksa koneksi, lalu coba lagi."
          action={onRetry && <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={onRetry}>Coba lagi</Button>}
          className="py-10"
        />
      ) : isLoading ? (
        <div className="mt-4 h-[240px] rounded-xl bg-muted motion-safe:animate-pulse" aria-hidden="true" />
      ) : total === 0 ? (
        <StateMessage
          icon={ChartColumn}
          title={`Belum ada stok masuk di ${periodeLabel}`}
          description="Grafik muncul setelah ada stok masuk yang dicatat pada periode ini."
          className="py-10"
        />
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="text-base font-semibold tabular-nums text-foreground">{formatRupiah(totalRupiah)}</span> total pengeluaran sesudah PPN dalam {periodeLabel}
            <span className="tabular-nums"> · {formatAngka(total, 0)} satuan masuk</span>
            {tanpaHarga > 0 && <span> · {tanpaHarga} catatan belum berharga, belum ikut dihitung</span>}
          </p>
          <div className="mt-3" aria-hidden="true">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} barSize={mode === 'bulanan' ? 24 : 32} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={{ stroke: 'var(--border)' }} tickMargin={8} />
                <YAxis tick={TICK} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as { unit: number; nilai: number }
                    return (
                      <div className="rounded-xl bg-popover px-3 py-2 text-sm shadow-md ring-1 ring-foreground/10">
                        <p className="mb-1 font-semibold text-foreground">{label}</p>
                        <p className="text-muted-foreground">Masuk: <span className="font-semibold tabular-nums text-foreground">{formatAngka(d.unit, 0)}</span> satuan</p>
                        <p className="text-muted-foreground">Pengeluaran: <span className="font-semibold tabular-nums text-foreground">{formatRupiah(d.nilai)}</span></p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="unit" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Grafik tidak bisa dibaca pembaca layar; tabel ini memuat angka yang sama */}
          <table className="sr-only">
            <caption>Stok masuk, {periodeLabel}</caption>
            <thead><tr><th scope="col">Periode</th><th scope="col">Satuan masuk</th><th scope="col">Pengeluaran</th></tr></thead>
            <tbody>
              {trendData.map(d => (
                <tr key={d.label}><th scope="row">{d.label}</th><td>{formatAngka(d.unit, 0)}</td><td>{formatRupiah(d.nilai)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Panel>
  )
}
