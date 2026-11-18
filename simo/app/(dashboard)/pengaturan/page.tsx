'use client'

import { TriangleAlert } from 'lucide-react'
import { usePengaturan } from '@/hooks/usePengaturan'
import PengaturanForm from '@/components/pengaturan/PengaturanForm'
import PageHeader from '@/components/shared/PageHeader'
import StateMessage from '@/components/shared/StateMessage'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import AdminOnly from '@/components/layout/AdminOnly'

function IsiPengaturan() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = usePengaturan()

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Pengaturan"
        description="Identitas apotek untuk kop laporan dan Surat Pesanan, serta nilai bawaan perhitungan persediaan."
      />

      {isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Memuat pengaturan">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-5 rounded-2xl bg-card p-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <div className="grid gap-5 md:grid-cols-2">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : isError || !data ? (
        // Gagal memuat tidak boleh tampil sebagai halaman kosong, dan tidak boleh mengira nilai bawaan adalah nilai tersimpan.
        <div className="rounded-2xl bg-card">
          <StateMessage
            icon={TriangleAlert}
            title="Pengaturan belum bisa dimuat"
            description="Nilai yang tersimpan tidak berubah. Periksa koneksi, lalu coba lagi."
            action={<Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={() => refetch()}>Coba lagi</Button>}
          />
        </div>
      ) : (
        // key = waktu data terakhir dimuat: setelah simpan dan muat ulang, form dibuat ulang dari nilai server.
        <PengaturanForm key={dataUpdatedAt} data={data} />
      )}
    </div>
  )
}

export default function PengaturanPage() {
  return (
    <AdminOnly>
      <IsiPengaturan />
    </AdminOnly>
  )
}
