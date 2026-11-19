'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Bell, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import PerluPerhatian from '@/components/pemantauan/PerluPerhatian'
import { useAnalitikAktivitas } from '@/hooks/useAktivitas'
import { rentangHariIni } from '@/components/pemantauan/periode'

// Lonceng untuk akun peneliti (superadmin). Akun ini tidak mengurus stok, jadi lonceng tidak membaca data obat sama sekali;
// isinya temuan pemantauan yang perlu dilihat: login gagal beruntun dan akun aktif yang lama tidak muncul. Temuan selalu
// dari kondisi sekarang, jadi kita ambil analitik hari ini saja (paling ringan). Akun nonaktif hanya keterangan, tidak
// menaikkan angka merah.
export default function NotifikasiPeneliti() {
  const rentang = useMemo(() => rentangHariIni(), [])
  const { data, isLoading, isError, refetch } = useAnalitikAktivitas(rentang)
  const p = data?.perhatian
  const jumlah = p ? p.login_gagal_beruntun.length + p.akun_lama_diam.length : 0

  const labelLonceng = isError
    ? 'Notifikasi, temuan pemantauan belum bisa dimuat'
    : jumlah > 0
      ? `Notifikasi, ${jumlah} temuan pemantauan perlu dilihat`
      : 'Notifikasi, tidak ada temuan pemantauan'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={labelLonceng}
          className="relative flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-foreground"
        >
          <Bell className="size-5" aria-hidden="true" />
          {jumlah > 0 && (
            <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold tabular-nums text-white">
              {jumlah > 99 ? '99+' : jumlah}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[22rem] max-w-[calc(100vw-2rem)]" aria-label="Notifikasi pemantauan">
        <div className="px-5 pb-3 pt-4">
          <h2 className="text-[15px] font-semibold text-foreground">Perlu diperhatikan</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Temuan pemantauan, dari kondisi sekarang.</p>
        </div>

        <div className="border-t border-border px-5 py-4">
          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Memuat notifikasi">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              ))}
            </div>
          ) : isError || !p ? (
            <div role="alert" className="flex flex-col items-center gap-2 text-center">
              <TriangleAlert className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">Temuan belum bisa dimuat</p>
              <p className="text-sm text-muted-foreground">Ini bukan berarti tidak ada masalah. Periksa koneksi, lalu coba lagi.</p>
              <Button variant="outline" size="lg" className="mt-1 h-10 rounded-xl px-4" onClick={() => refetch()}>Coba lagi</Button>
            </div>
          ) : (
            <PerluPerhatian data={p} />
          )}
        </div>

        <div className="border-t border-border p-3">
          <Button size="lg" className="h-10 w-full rounded-xl px-4" asChild>
            <Link href="/pemantauan">Buka Pemantauan</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
