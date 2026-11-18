'use client'

import { Suspense, use, useState } from 'react'
import Link from 'next/link'
import { SearchX, TriangleAlert } from 'lucide-react'
import SupplierForm from '@/components/supplier/SupplierForm'
import PageHeader from '@/components/shared/PageHeader'
import StateMessage from '@/components/shared/StateMessage'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import { useAsalHalaman } from '@/components/shared/useAsalHalaman'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSupplierById, useUpdateSupplier } from '@/hooks/useSupplier'
import AdminOnly from '@/components/layout/AdminOnly'
import type { SupplierFormData } from '@/types/supplier'

function IsiEditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: supplier, isLoading, isError, refetch } = useSupplierById(id)
  const updateMutation = useUpdateSupplier(id)

  // Kembali ke halaman ASAL (daftar beserta filternya, dibawa lewat ?dari=); cadangannya daftar supplier.
  const { kembali } = useAsalHalaman('/supplier')
  const [kotor, setKotor] = useState(false)
  const [buangTerbuka, setBuangTerbuka] = useState(false)

  async function handleSubmit(data: SupplierFormData) {
    await updateMutation.mutateAsync(data)
    kembali()
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true" aria-label="Memuat data supplier">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-5 rounded-2xl bg-card p-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid gap-5 md:grid-cols-2">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // Gagal memuat dibedakan dari "tidak ditemukan": yang pertama bukan berarti supplier-nya tidak ada.
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl bg-card">
        <StateMessage
          icon={TriangleAlert}
          title="Data supplier belum bisa dimuat"
          description="Ini bukan berarti supplier-nya tidak ada. Periksa koneksi, lalu coba lagi."
          action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={() => refetch()}>Coba lagi</Button>}
        />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl bg-card">
        <StateMessage
          icon={SearchX}
          title="Supplier tidak ditemukan"
          description="Supplier ini mungkin sudah dihapus. Kembali ke daftar untuk memilih supplier lain."
          action={<Button variant="outline" className="h-10 rounded-xl px-4" asChild><Link href="/supplier">Ke daftar supplier</Link></Button>}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={`Ubah ${supplier.nama}`}
        backLabel="Kembali"
        onBack={() => (kotor ? setBuangTerbuka(true) : kembali())}
        description="Lead time dan biaya pesan dipakai untuk menghitung ROP dan EOQ obat dari supplier ini."
      />
      <section className="rounded-2xl bg-card p-5 sm:p-6">
        <SupplierForm
          defaultValues={supplier}
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

export default function EditSupplierPage(props: { params: Promise<{ id: string }> }) {
  // useSearchParams (lewat useAsalHalaman) wajib dibungkus Suspense agar build produksi tidak gagal.
  return (
    <AdminOnly>
      <Suspense fallback={null}>
        <IsiEditSupplierPage {...props} />
      </Suspense>
    </AdminOnly>
  )
}
