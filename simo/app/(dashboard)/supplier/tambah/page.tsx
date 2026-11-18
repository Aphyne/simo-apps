'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import SupplierForm from '@/components/supplier/SupplierForm'
import PageHeader from '@/components/shared/PageHeader'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import { useAsalHalaman } from '@/components/shared/useAsalHalaman'
import { useCreateSupplier } from '@/hooks/useSupplier'
import AdminOnly from '@/components/layout/AdminOnly'
import type { SupplierFormData } from '@/types/supplier'

function IsiTambahSupplierPage() {
  const router = useRouter()
  const createMutation = useCreateSupplier()
  // Halaman asal dibawa tautan yang membuka halaman ini (daftar beserta filternya); cadangannya daftar supplier.
  const { kembali } = useAsalHalaman('/supplier')
  const [kotor, setKotor] = useState(false)
  const [buangTerbuka, setBuangTerbuka] = useState(false)

  async function handleSubmit(data: SupplierFormData) {
    await createMutation.mutateAsync(data)
    // Langsung ke daftar yang difilter ke nama supplier baru, supaya barisnya terlihat di atas.
    router.replace(`/supplier?q=${encodeURIComponent(data.nama)}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Tambah supplier"
        description="Supplier dipilih saat mencatat stok masuk dan menjadi tujuan Surat Pesanan."
        backLabel="Kembali"
        onBack={() => (kotor ? setBuangTerbuka(true) : kembali())}
      />
      <section className="rounded-2xl bg-card p-5 sm:p-6">
        <SupplierForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Tambah supplier"
          onBatal={kembali}
          onDirtyChange={setKotor}
        />
      </section>
      <KonfirmasiBuang open={buangTerbuka} onOpenChange={setBuangTerbuka} onBuang={kembali} />
    </div>
  )
}

export default function TambahSupplierPage() {
  // useSearchParams (lewat useAsalHalaman) wajib dibungkus Suspense agar build produksi tidak gagal.
  return (
    <AdminOnly>
      <Suspense fallback={null}>
        <IsiTambahSupplierPage />
      </Suspense>
    </AdminOnly>
  )
}
