'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import Panel from './Panel'

interface Props {
  penjualanTanpaHarga: number
  obatTanpaSupplier: number
  batchTanpaNomor: number
  className?: string
}

// Data yang belum lengkap dan membuat angka di Dashboard kurang akurat. Hanya tampil bila ada yang perlu dilengkapi,
// dan tiap hitungan menuju halaman tempat memperbaikinya. Hanya admin (harga dan supplier adalah ranah admin).
export default function PerluDilengkapiCard({ penjualanTanpaHarga, obatTanpaSupplier, batchTanpaNomor, className }: Props) {
  const butir = [
    { jumlah: penjualanTanpaHarga, label: 'penjualan belum ber-harga', petunjuk: 'Pendapatan dan grafik terlihat lebih kecil dari kenyataan.', href: '/barang-keluar' },
    { jumlah: obatTanpaSupplier, label: 'obat belum punya supplier', petunjuk: 'Supplier terisi saat stok masuk dicatat.', href: '/barang-masuk' },
    { jumlah: batchTanpaNomor, label: 'batch tanpa nomor', petunjuk: 'Nomor batch dicatat saat stok masuk.', href: '/barang-masuk' },
  ].filter((b) => b.jumlah > 0)

  if (butir.length === 0) return null

  return (
    <Panel title="Perlu dilengkapi" className={className} bodyClassName="p-0 pb-1">
      <ul className="flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">
        {butir.map((b) => (
          <li key={b.label} className="flex-1">
            <Link
              href={b.href}
              className={cn(
                'group flex h-full flex-col gap-1 px-5 py-3 outline-none transition-colors',
                'hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <span className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold leading-none tabular-nums text-foreground">{b.jumlah.toLocaleString('id-ID')}</span>
                <span className="text-sm font-medium text-foreground group-hover:text-primary">{b.label}</span>
              </span>
              <span className="text-sm text-muted-foreground">{b.petunjuk}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
