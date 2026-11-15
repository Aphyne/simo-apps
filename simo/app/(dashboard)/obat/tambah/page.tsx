'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import ObatForm from '@/components/obat/ObatForm'
import PageHeader from '@/components/shared/PageHeader'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import { useAsalHalaman } from '@/components/shared/useAsalHalaman'
import { useCreateObat } from '@/hooks/useObat'
import type { ObatFormData } from '@/types/obat'
import AdminOnly from '@/components/layout/AdminOnly'

function IsiTambahObatPage() {
  const router = useRouter()
  const createMutation = useCreateObat()
  // Halaman asal dibawa tautan yang membuka halaman ini (daftar beserta filternya); cadangannya daftar obat.
  const { kembali } = useAsalHalaman('/obat')
  const [kotor, setKotor] = useState(false)
  const [buangTerbuka, setBuangTerbuka] = useState(false)

  async function handleSubmit(data: ObatFormData) {
    await createMutation.mutateAsync(data)
    // Langsung ke daftar yang difilter ke nama obat baru, supaya barisnya terlihat di atas.
    router.replace(`/obat?q=${encodeURIComponent(data.nama)}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Tambah obat"
        description="Kode obat dibuat otomatis oleh sistem."
        backLabel="Kembali"
        onBack={() => (kotor ? setBuangTerbuka(true) : kembali())}
      />
      <section className="rounded-2xl bg-card p-5 sm:p-6">
        <ObatForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Tambah obat"
          onBatal={kembali}
          onDirtyChange={setKotor}
          onSimpanLagi={async (data) => { await createMutation.mutateAsync(data) }}
        />
      </section>
      <KonfirmasiBuang open={buangTerbuka} onOpenChange={setBuangTerbuka} onBuang={kembali} />
    </div>
  )
}

export default function TambahObatPage() {
  // useSearchParams (lewat useAsalHalaman) wajib dibungkus Suspense agar build produksi tidak gagal.
  return (
    <AdminOnly>
      <Suspense fallback={null}>
        <IsiTambahObatPage />
      </Suspense>
    </AdminOnly>
  )
}
