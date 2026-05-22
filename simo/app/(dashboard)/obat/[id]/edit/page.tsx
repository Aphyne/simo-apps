'use client'

import { use } from 'react'
import ObatForm from '@/components/obat/ObatForm'
import { useObatById, useUpdateObat } from '@/hooks/useObat'
import type { ObatFormData } from '@/types/obat'

export default function EditObatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: obat, isLoading } = useObatById(id)
  const updateMutation = useUpdateObat(id)

  async function handleSubmit(data: ObatFormData) {
    await updateMutation.mutateAsync(data)
    window.location.href = '/obat'
  }

  if (isLoading) {
    return <div className="text-gray-400 py-12 text-center">Memuat data obat...</div>
  }

  if (!obat) {
    return <div className="text-red-500 py-12 text-center">Obat tidak ditemukan</div>
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Edit Obat</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {obat.kode} — {obat.nama}
        </p>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <ObatForm
          defaultValues={obat}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          submitLabel="Simpan Perubahan"
        />
      </div>
    </div>
  )
}
