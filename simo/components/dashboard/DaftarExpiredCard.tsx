'use client'

import Link from 'next/link'
import { CalendarCheck } from 'lucide-react'
import { formatTanggalPendek } from '@/lib/utils'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/utils'
import Panel, { SkeletonRows } from './Panel'

interface Item {
  nama: string
  satuan: string
  stok: number
  expired_terdekat: string
}

interface Props {
  data: Item[]
  isLoading: boolean
  isError?: boolean
  totalUrgent: number
  className?: string
}

function sisaHariLabel(hari: number) {
  if (hari < 0) return 'Sudah lewat'
  if (hari === 0) return 'Hari ini'
  return `${hari} hari lagi`
}

export default function DaftarExpiredCard({ data, isLoading, isError, totalUrgent, className }: Props) {
  const sekarang = useNow().getTime()
  return (
    <Panel
      title="Akan expired"
      action={
        <Link href="/monitoring" className="text-primary hover:underline focus-visible:underline">
          Monitoring
        </Link>
      }
      className={className}
      bodyClassName="flex flex-col"
    >
      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : isError ? (
        <p className="flex-1 py-8 text-center text-sm text-muted-foreground">Daftar expired belum bisa dimuat. Coba lagi lewat tombol di atas.</p>
      ) : data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <CalendarCheck className="size-6 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Tidak ada obat urgent expired dalam 90 hari</p>
        </div>
      ) : (
        <>
          <ul className="-my-1 divide-y">
            {data.map((item, i) => {
              const selisihHari = Math.floor(
                (new Date(item.expired_terdekat).getTime() - sekarang) / (1000 * 60 * 60 * 24)
              )
              const kritis = selisihHari <= 30
              return (
                <li key={i} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.nama}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      Sisa {item.stok} {item.satuan}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn('text-sm font-medium tabular-nums', kritis ? 'text-danger-600' : 'text-foreground')}>
                      {formatTanggalPendek(item.expired_terdekat)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{sisaHariLabel(selisihHari)}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          {totalUrgent > 5 && (
            <Link
              href="/laporan?tab=kedaluarsa"
              className="mt-auto border-t pt-3 text-sm text-primary hover:underline focus-visible:underline"
            >
              Lihat {totalUrgent - 5} obat lainnya
            </Link>
          )}
        </>
      )}
    </Panel>
  )
}
