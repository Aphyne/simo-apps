'use client'

import Link from 'next/link'
import { TrendingUp, TriangleAlert } from 'lucide-react'
import { formatAngka, formatRupiah } from '@/lib/utils'
import Panel, { SkeletonRows } from './Panel'

interface Item {
  id: number
  nama: string
  satuan: string
  jumlah: number
  pendapatan: number
}

interface Props {
  data: Item[]
  isLoading: boolean
  isError?: boolean
  className?: string
}

// Obat dengan pendapatan penjualan tertinggi dalam 30 hari terakhir (jendela bergulir, bukan bulan kalender, supaya tidak kosong di awal bulan). Diurutkan menurut Rupiah karena sepadan lintas satuan
// (tablet, botol, dan box tidak bisa dijumlahkan). Penjualan yang belum ber-harga tidak ikut terhitung.
export default function TerlarisCard({ data, isLoading, isError, className }: Props) {
  return (
    <Panel title="Terlaris, 30 hari terakhir" className={className} bodyClassName="flex min-h-0 flex-col">
      {isLoading ? (
        <SkeletonRows rows={5} />
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <TriangleAlert className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Daftar belum bisa dimuat</p>
          <p className="text-sm text-muted-foreground">Muat ulang halaman untuk mencoba lagi.</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <TrendingUp className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Belum ada penjualan ber-harga dalam 30 hari terakhir</p>
        </div>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label="Obat terlaris, bisa digulir"
          className="min-h-0 flex-1 overflow-y-auto rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
        <ol className="divide-y">
          {data.map((o, i) => (
            <li key={o.id}>
              <Link
                href={`/obat/${o.id}/detail`}
                className="group flex items-center gap-3 rounded-sm py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-4 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">{o.nama}</span>
                  <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                    {formatAngka(o.jumlah, 0)} {o.satuan} terjual
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatRupiah(o.pendapatan)}</span>
              </Link>
            </li>
          ))}
        </ol>
        </div>
      )}
    </Panel>
  )
}
