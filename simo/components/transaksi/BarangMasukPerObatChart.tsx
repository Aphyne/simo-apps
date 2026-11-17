'use client'

import { useState, useMemo } from 'react'
import { PackageOpen, TriangleAlert } from 'lucide-react'
import Panel from '@/components/dashboard/Panel'
import Segmented from '@/components/shared/Segmented'
import StateMessage from '@/components/shared/StateMessage'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatAngka } from '@/lib/utils'
import { useNow } from '@/hooks/useNow'
import type { BarangMasuk } from '@/types/obat'

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

const TOP = 6

interface Props {
  allList: BarangMasuk[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  className?: string
}

type Mode = 'bulanan' | 'tahunan'

// Peringkat obat menurut jumlah masuk: daftar berbatang dengan nama lengkap dan angka tertulis
// (bukan grafik dengan nama terpotong). Batang hanya pembanding; nilainya selalu ada sebagai teks.
export default function BarangMasukPerObatChart({ allList, isLoading, isError, onRetry, className }: Props) {
  const now = useNow()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const [mode, setMode] = useState<Mode>('bulanan')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(currentYear)
    allList.forEach(item => {
      if (item.tanggal) years.add(new Date(item.tanggal).getFullYear())
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [allList, currentYear])

  const { rows, jumlahObat } = useMemo(() => {
    const filtered = allList.filter(item => {
      if (!item.tanggal) return false
      const d = new Date(item.tanggal)
      if (mode === 'bulanan') {
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
      }
      return d.getFullYear() === selectedYear
    })

    const map: Record<string, { nama: string; satuan: string; total: number }> = {}
    filtered.forEach(item => {
      if (!map[item.nama_obat]) map[item.nama_obat] = { nama: item.nama_obat, satuan: item.satuan, total: 0 }
      map[item.nama_obat].total += item.jumlah_satuan ?? 0
    })

    const urut = Object.values(map).sort((a, b) => b.total - a.total)
    return { rows: urut.slice(0, TOP), jumlahObat: urut.length }
  }, [allList, mode, selectedMonth, selectedYear])

  const periodeLabel = mode === 'bulanan'
    ? `${MONTHS[selectedMonth]} ${selectedYear}`
    : `tahun ${selectedYear}`
  const terbesar = rows[0]?.total ?? 0

  return (
    <Panel title="Masuk per obat" className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Periode peringkat"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'bulanan', label: 'Bulanan' },
            { value: 'tahunan', label: 'Tahunan' },
          ]}
        />
        {mode === 'bulanan' && (
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="h-10 w-36 rounded-xl data-[size=default]:h-10" aria-label="Bulan peringkat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, i) => <SelectItem key={name} value={String(i)}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="h-10 w-28 rounded-xl data-[size=default]:h-10" aria-label="Tahun peringkat">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <StateMessage
          icon={TriangleAlert}
          title="Peringkat belum bisa dimuat"
          description="Ini bukan berarti tidak ada stok masuk. Periksa koneksi, lalu coba lagi."
          action={onRetry && <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={onRetry}>Coba lagi</Button>}
          className="py-10"
        />
      ) : isLoading ? (
        <div className="mt-4 space-y-4" aria-hidden="true">
          {Array.from({ length: TOP }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-muted motion-safe:animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <StateMessage
          icon={PackageOpen}
          title={`Belum ada stok masuk di ${periodeLabel}`}
          description="Peringkat muncul setelah ada stok masuk yang dicatat pada periode ini."
          className="py-10"
        />
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            {jumlahObat > TOP ? `${TOP} teratas dari ${jumlahObat} obat` : `${jumlahObat} obat`}, {periodeLabel}
          </p>
          <ol className="mt-3 space-y-3.5">
            {rows.map((d) => (
              <li key={d.nama}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 break-words font-medium text-foreground">{d.nama}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatAngka(d.total, 0)}</span> {d.satuan}
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted" aria-hidden="true">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(2, (d.total / terbesar) * 100)}%`, background: 'var(--chart-1)' }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </Panel>
  )
}
