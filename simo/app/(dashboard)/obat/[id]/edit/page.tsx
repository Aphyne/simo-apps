'use client'

import { Suspense, use, useState } from 'react'
import { SearchX, TriangleAlert } from 'lucide-react'
import ObatForm from '@/components/obat/ObatForm'
import PageHeader from '@/components/shared/PageHeader'
import StateMessage from '@/components/shared/StateMessage'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import { useAsalHalaman } from '@/components/shared/useAsalHalaman'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useObatById, useUpdateObat } from '@/hooks/useObat'
import type { ObatFormData } from '@/types/obat'
import AdminOnly from '@/components/layout/AdminOnly'

function IsiEditObatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: obat, isLoading, isError, refetch } = useObatById(id)
  const updateMutation = useUpdateObat(id)

  // Kembali ke halaman ASAL: daftar (beserta filternya) bila dibuka dari ikon pensil, detail bila dibuka dari
  // tombol "Ubah data". Asal dibawa tautan lewat ?dari=; bila tidak ada, jatuh ke detail obat itu.
  const { kembali } = useAsalHalaman(`/obat/${id}/detail`)
  const [kotor, setKotor] = useState(false)
  const [buangTerbuka, setBuangTerbuka] = useState(false)

  async function handleSubmit(data: ObatFormData) {
    await updateMutation.mutateAsync(data)
    kembali()
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true" aria-label="Memuat data obat">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-5 rounded-2xl bg-card p-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid gap-5 md:grid-cols-2">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
      </div>
    )
  }

  // Gagal memuat dibedakan dari "tidak ditemukan": yang pertama bukan berarti obatnya tidak ada.
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl bg-card">
        <StateMessage
          icon={TriangleAlert}
          title="Data obat belum bisa dimuat"
          description="Ini bukan berarti obatnya tidak ada. Periksa koneksi, lalu coba lagi."
          action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={() => refetch()}>Coba lagi</Button>}
        />
      </div>
    )
  }

  if (!obat) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl bg-card">
        <StateMessage
          icon={SearchX}
          title="Obat tidak ditemukan"
          description="Obat ini mungkin sudah dihapus. Kembali ke daftar untuk memilih obat lain."
          action={<Button variant="outline" className="h-10 rounded-xl px-4" asChild><Link href="/obat">Ke data obat</Link></Button>}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={`Ubah ${obat.nama}`}
        backLabel="Kembali"
        onBack={() => (kotor ? setBuangTerbuka(true) : kembali())}
        meta={
          <>
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground/80">{obat.kode}</span>
          </>
        }
        description="Harga, biaya pesan, dan supplier terisi dari Barang masuk; lama pengiriman dari Supplier."
      />
      <section className="rounded-2xl bg-card p-5 sm:p-6">
        <ObatForm
          defaultValues={obat}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          submitLabel="Simpan perubahan"
          onBatal={kembali}
          onDirtyChange={setKotor}
        />
      </section>
      <KonfirmasiBuang open={buangTerbuka} onOpenChange={setBuangTerbuka} onBuang={kembali} />
    </div>
  )
}

export default function EditObatPage(props: { params: Promise<{ id: string }> }) {
  // useSearchParams (lewat useAsalHalaman) wajib dibungkus Suspense agar build produksi tidak gagal.
  return (
    <AdminOnly>
      <Suspense fallback={null}>
        <IsiEditObatPage {...props} />
      </Suspense>
    </AdminOnly>
  )
}
