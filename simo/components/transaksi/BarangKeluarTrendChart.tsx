'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartColumn, TriangleAlert } from 'lucide-react'
import Panel from '@/components/dashboard/Panel'
import Segmented from '@/components/shared/Segmented'
import StateMessage from '@/components/shared/StateMessage'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { tanggalLokal } from '@/lib/barangKeluar'
import { formatAngka, formatRupiah } from '@/lib/utils'
import type { BarangKeluar } from '@/types/obat'
import { useNow } from '@/hooks/useNow'

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const TICK = { fontSize: 12, fill: 'var(--muted-foreground)' }

interface Props {
  allList: BarangKeluar[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  className?: string
}

type Mode = 'mingguan' | 'bulanan'

// Hanya Penjualan yang dihitung: retur, rusak, kedaluarsa, dan lainnya bukan pendapatan.
export default function BarangKeluarTrendChart({ allList, isLoading, isError, onRetry, className }: Props) {
  const now = useNow()
  const currentYear = now.getFullYear()

  const [mode, setMode] = useState<Mode>('bulanan')
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const salesList = useMemo(() => allList.filter((item) => item.keterangan === 'Penjualan'), [allList])

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(currentYear)
    salesList.forEach((item) => {
      if (item.tanggal) years.add(new Date(item.tanggal).getFullYear())
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [salesList, currentYear])

  // Unit dan nilai Rp dihitung sekaligus; keduanya tampil di tooltip saat hover
  function sumItems(items: BarangKeluar[]) {
    return {
      unit: items.reduce((sum, item) => sum + (item.jumlah ?? 0), 0),
      nilai: items.reduce((sum, item) => sum + ((item.jumlah ?? 0) * (Number(item.harga_jual) || 0)), 0),
    }
  }

  const trendData = useMemo(() => {
    if (mode === 'mingguan') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (6 - i))
        const key = tanggalLokal(d)
        const items = salesList.filter((item) => item.tanggal && tanggalLokal(new Date(item.tanggal)) === key)
        return { label: `${d.getDate()}/${d.getMonth() + 1}`, ...sumItems(items) }
      })
    }
    return Array.from({ length: 12 }, (_, i) => {
      const items = salesList.filter((item) => {
        if (!item.tanggal) return false
        const td = new Date(item.tanggal)
        return td.getFullYear() === selectedYear && td.getMonth() === i
      })
      return { label: MONTHS[i], ...sumItems(items) }
    })
  }, [salesList, mode, selectedYear, now])

  const periodeLabel = mode === 'mingguan' ? '7 hari terakhir' : `tahun ${selectedYear}`
  const total = trendData.reduce((s, d) => s + d.unit, 0)
  // Total penjualan periode ini. Penjualan tanpa harga jual tidak bisa dijumlahkan: dihitung terpisah.
  const totalRupiah = trendData.reduce((s, d) => s + d.nilai, 0)
  const tanpaHarga = useMemo(() => {
    const dari = new Date(now)
    dari.setDate(dari.getDate() - 6)
    const dariYmd = tanggalLokal(dari)
    const sampaiYmd = tanggalLokal(now)
    return salesList.filter((item) => {
      if (!item.tanggal || Number(item.harga_jual) > 0) return false
      const td = new Date(item.tanggal)
      if (mode === 'mingguan') {
        const k = tanggalLokal(td)
        return k >= dariYmd && k <= sampaiYmd
      }
      return td.getFullYear() === selectedYear
    }).length
  }, [salesList, mode, selectedYear, now])

  return (
    <Panel title="Tren stok keluar" className={className}>
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
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="h-10 w-28 rounded-xl data-[size=default]:h-10" aria-label="Tahun grafik">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Khusus penjualan; retur, rusak, dan kedaluarsa tidak dihitung.</p>

      {isError ? (
        <StateMessage
          icon={TriangleAlert}
          title="Grafik belum bisa dimuat"
          description="Ini bukan berarti tidak ada penjualan. Periksa koneksi, lalu coba lagi."
          action={onRetry && <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={onRetry}>Coba lagi</Button>}
          className="py-10"
        />
      ) : isLoading ? (
        <div className="mt-4 h-[240px] rounded-xl bg-muted motion-safe:animate-pulse" aria-hidden="true" />
      ) : total === 0 ? (
        <StateMessage
          icon={ChartColumn}
          title={`Belum ada penjualan di ${periodeLabel}`}
          description="Grafik muncul setelah ada stok keluar berketerangan Penjualan pada periode ini."
          className="py-10"
        />
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="text-base font-semibold tabular-nums text-foreground">{formatRupiah(totalRupiah)}</span> total penjualan dalam {periodeLabel}
            <span className="tabular-nums"> · {formatAngka(total, 0)} satuan keluar</span>
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
                        <p className="text-muted-foreground">Keluar: <span className="font-semibold tabular-nums text-foreground">{formatAngka(d.unit, 0)}</span> satuan</p>
                        <p className="text-muted-foreground">Penjualan: <span className="font-semibold tabular-nums text-foreground">{formatRupiah(d.nilai)}</span></p>
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
            <caption>Penjualan, {periodeLabel}</caption>
            <thead><tr><th scope="col">Periode</th><th scope="col">Satuan keluar</th><th scope="col">Penjualan</th></tr></thead>
            <tbody>
              {trendData.map((d) => (
                <tr key={d.label}><th scope="row">{d.label}</th><td>{formatAngka(d.unit, 0)}</td><td>{formatRupiah(d.nilai)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Panel>
  )
}
