'use client'

import Link from 'next/link'
import { CalendarCheck, TriangleAlert } from 'lucide-react'
import { formatTanggalPendek } from '@/lib/utils'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/utils'
import Panel, { SkeletonRows } from './Panel'

interface Item {
  kode?: string
  nama: string
  satuan: string
  no_batch?: string | null
  stok: number
  expired_terdekat: string
}

interface Props {
  // Sudah lewat tanggal kedaluwarsa tetapi stoknya masih tercatat (perkiraan per batch; satu baris per batch). Paling atas karena paling mendesak.
  lewat: Item[]
  totalLewat: number
  // Akan kedaluwarsa dalam 90 hari.
  akan: Item[]
  totalAkan: number
  isLoading: boolean
  isError?: boolean
  className?: string
}

const HARI_MS = 1000 * 60 * 60 * 24

function sisaHariLabel(hari: number) {
  if (hari < 0) return `lewat ${Math.abs(hari)} hari`
  if (hari === 0) return 'Hari ini'
  return `${hari} hari lagi`
}

function Baris({ item, sekarang, lewat }: { item: Item; sekarang: number; lewat: boolean }) {
  const selisihHari = Math.floor((new Date(item.expired_terdekat).getTime() - sekarang) / HARI_MS)
  const mendesak = lewat || selisihHari <= 30
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{item.nama}</p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {item.kode && <><span className="font-mono">{item.kode}</span>{' · '}</>}
          {item.no_batch ? `Batch ${item.no_batch}` : 'Batch tanpa nomor'}
          {' · '}
          Sisa {item.stok} {item.satuan}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn('text-sm font-medium tabular-nums', mendesak ? 'text-danger-700' : 'text-foreground')}>
          {formatTanggalPendek(item.expired_terdekat)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sisaHariLabel(selisihHari)}</p>
      </div>
    </li>
  )
}

// Dua kelompok dalam satu panel: yang sudah lewat (stok masih tercatat, harus dikeluarkan) lalu yang akan expired.
export default function DaftarExpiredCard({ lewat, totalLewat, akan, totalAkan, isLoading, isError, className }: Props) {
  const sekarang = useNow().getTime()
  const kosong = lewat.length === 0 && akan.length === 0
  return (
    <Panel
      title="Kedaluwarsa"
      action={
        <Link href="/laporan?tab=kedaluarsa" className="text-primary hover:underline focus-visible:underline">
          Lihat laporan
        </Link>
      }
      className={className}
      bodyClassName="flex min-h-0 flex-col"
    >
      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <TriangleAlert className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Daftar kedaluwarsa belum bisa dimuat</p>
          <p className="text-sm text-muted-foreground">Ini bukan berarti tidak ada yang kedaluwarsa. Muat ulang halaman untuk mencoba lagi.</p>
        </div>
      ) : kosong ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <CalendarCheck className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Tidak ada obat yang sudah lewat atau akan kedaluwarsa dalam 90 hari</p>
        </div>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label="Daftar kedaluwarsa, bisa digulir"
          className="min-h-0 flex-1 overflow-y-auto rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {lewat.length > 0 && (
            <section aria-label="Sudah lewat tanggal kedaluwarsa">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-danger-700">
                <TriangleAlert className="size-4" aria-hidden="true" />
                Sudah lewat, stok masih tercatat
                <span className="font-normal text-muted-foreground">({totalLewat} batch)</span>
              </h3>
              <ul className="mt-1 divide-y">
                {lewat.map((item, i) => (
                  <Baris key={`l-${i}`} item={item} sekarang={sekarang} lewat />
                ))}
              </ul>
            </section>
          )}

          {akan.length > 0 && (
            <section aria-label="Akan kedaluwarsa dalam 90 hari" className={cn(lewat.length > 0 && 'mt-4 border-t pt-4')}>
              <h3 className="text-sm font-semibold text-foreground">
                Akan kedaluwarsa, 90 hari ke depan
                <span className="ml-1.5 font-normal text-muted-foreground">({totalAkan})</span>
              </h3>
              <ul className="mt-1 divide-y">
                {akan.map((item, i) => (
                  <Baris key={`a-${i}`} item={item} sekarang={sekarang} lewat={false} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Panel>
  )
}
