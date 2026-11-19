'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleAlert } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useAnalisisPerbandingan, type AnalisisDetail } from '@/hooks/useAnalisis'
import PageHeader from '@/components/shared/PageHeader'
import StateMessage from '@/components/shared/StateMessage'
import Panel from '@/components/dashboard/Panel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import AnalisisStatCards from '@/components/analisis/AnalisisStatCards'
import AnalisisChart from '@/components/analisis/AnalisisChart'
import AnalisisKomposisi from '@/components/analisis/AnalisisKomposisi'
import AnalisisTable from '@/components/analisis/AnalisisTable'
import AnalisisDetailModal from '@/components/analisis/AnalisisDetailModal'
import AnalisisCatatan from '@/components/analisis/AnalisisCatatan'

// Analisis Komparatif (perbandingan biaya sebelum vs sesudah EOQ) khusus akun peneliti (superadmin): bahan skripsi,
// bukan fitur harian apotek. Admin dan staf dialihkan ke Dashboard, dan backend juga menolak mereka (403) di
// GET /api/analisis/*, jadi penjaga di sini hanya soal tampilan, bukan keamanan.
function GagalMuat({ onCobaLagi }: { onCobaLagi: () => void }) {
  return (
    <StateMessage
      icon={CircleAlert}
      title="Perbandingan belum bisa dimuat"
      description="Ini bukan berarti tidak ada penghematan. Periksa koneksi dan pastikan server backend sudah dijalankan ulang, lalu coba lagi."
      action={<Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={onCobaLagi}>Coba lagi</Button>}
      className="py-8"
    />
  )
}

function IsiAnalisis() {
  const { data, isLoading, isError, refetch } = useAnalisisPerbandingan()
  const [terpilih, setTerpilih] = useState<AnalisisDetail | null>(null)

  const r = data?.ringkasan
  const detail = data?.detail ?? []
  const kerangka = (tinggi: string) => <Skeleton className={`${tinggi} w-full rounded-xl`} aria-hidden="true" />

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <PageHeader
        title="Analisis Komparatif"
        description={
          r
            ? `Perbandingan biaya persediaan per tahun: sebelum EOQ (setiap pemesanan ${r.asumsi_dus_tradisional} dus) dan dengan EOQ (jumlah pesan optimal).`
            : 'Perbandingan biaya persediaan per tahun: sebelum EOQ dan dengan EOQ (jumlah pesan optimal).'
        }
      />

      <AnalisisStatCards ringkasan={r} isLoading={isLoading} isError={isError} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel title="Biaya per obat" className="lg:col-span-7" action={<span className="text-sm font-normal text-muted-foreground">per tahun</span>}>
          {isError ? <GagalMuat onCobaLagi={() => refetch()} /> : isLoading ? kerangka('h-96') : <AnalisisChart detail={detail} />}
        </Panel>
        <Panel title="Komposisi biaya" className="lg:col-span-5" action={<span className="text-sm font-normal text-muted-foreground">semua obat</span>}>
          {isError ? <GagalMuat onCobaLagi={() => refetch()} /> : isLoading || !r ? kerangka('h-72') : <AnalisisKomposisi ringkasan={r} />}
        </Panel>
      </div>

      <Panel
        title="Rincian per obat"
        count={detail.length}
        bodyClassName="px-0 pb-0"
        action={<span className="text-sm font-normal text-muted-foreground">Klik nama obat untuk melihat perhitungannya</span>}
      >
        <AnalisisTable detail={detail} ringkasan={r} isLoading={isLoading} isError={isError} onCobaLagi={() => refetch()} onSelectItem={setTerpilih} />
      </Panel>

      {r && (
        <Panel title="Cara menghitung dan batasannya">
          <AnalisisCatatan ringkasan={r} />
        </Panel>
      )}

      <AnalisisDetailModal item={terpilih} onClose={() => setTerpilih(null)} />
    </div>
  )
}

export default function AnalisisPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  useEffect(() => {
    if (isHydrated && user?.role !== 'superadmin') router.replace('/dashboard')
  }, [isHydrated, user, router])

  // Selain superadmin tidak merender apa pun, jadi tidak ada panggilan API yang ikut jalan.
  if (!isHydrated || user?.role !== 'superadmin') return null
  return <IsiAnalisis />
}
