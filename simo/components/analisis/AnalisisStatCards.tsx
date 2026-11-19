'use client'

import { Banknote, PackageSearch, Wallet } from 'lucide-react'
import { StatTile } from '@/components/dashboard/StatTile'
import type { AnalisisRingkasan } from '@/hooks/useAnalisis'
import { formatRupiah } from '@/lib/utils'

interface Props {
  ringkasan: AnalisisRingkasan | undefined
  isLoading: boolean
  isError: boolean
}

// Empat ubin: tiga angka pembanding dan satu ubin biru (penghematan), hasil yang menjadi inti analisis.
// Biaya sebelum dan dengan EOQ ditulis penuh (Rp), bukan disingkat, karena angka ini dikutip ke skripsi.
export default function AnalisisStatCards({ ringkasan: r, isLoading, isError }: Props) {
  const tanpa = isError ? '-' : undefined
  const hemat = r?.persen_hemat_total ?? 0
  return (
    <section aria-label="Ringkasan perbandingan" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        compact
        label="Obat dibandingkan"
        icon={PackageSearch}
        value={isError ? null : r?.total_obat_dihitung ?? null}
        isLoading={isLoading}
        sublabel={r ? `dari ${r.total_obat} obat` : ' '}
      />
      <StatTile
        compact
        label="Biaya sebelum EOQ"
        icon={Wallet}
        value={null}
        teks={tanpa ?? (r ? formatRupiah(r.total_tc_tradisional) : undefined)}
        isLoading={isLoading}
        sublabel="per tahun"
      />
      <StatTile
        compact
        label="Biaya dengan EOQ"
        icon={Banknote}
        value={null}
        teks={tanpa ?? (r ? formatRupiah(r.total_tc_eoq) : undefined)}
        isLoading={isLoading}
        sublabel="per tahun"
      />

      {/* Satu-satunya ubin biru: hasil analisis. */}
      <div className="flex flex-col justify-between gap-1 rounded-2xl bg-primary p-4 text-primary-foreground">
        <p className="flex min-h-9 items-center text-sm font-medium">Penghematan per tahun</p>
        <div>
          {isLoading ? (
            <span className="block h-8 w-40 rounded-lg bg-primary-foreground/20 motion-safe:animate-pulse" aria-hidden="true" />
          ) : (
            <p className="break-words text-3xl font-semibold leading-none tracking-tight tabular-nums">
              {isError || !r ? <>-<span className="sr-only"> Data tidak tersedia</span></> : formatRupiah(r.total_penghematan)}
            </p>
          )}
          <p className="mt-2 text-sm">{r && !isError ? `${hemat.toLocaleString('id-ID')}% lebih hemat dari sebelum EOQ` : 'Data belum bisa dimuat'}</p>
        </div>
      </div>
    </section>
  )
}
