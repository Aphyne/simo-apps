'use client'

import ObatForm from '@/components/obat/ObatForm'
import { useCreateObat } from '@/hooks/useObat'
import type { ObatFormData } from '@/types/obat'

export default function TambahObatPage() {
  const createMutation = useCreateObat()

  async function handleSubmit(data: ObatFormData) {
    await createMutation.mutateAsync(data)
    window.location.href = '/obat'
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tambah Obat</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kode obat akan dibuat otomatis oleh sistem</p>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <ObatForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Tambah Obat"
        />
      </div>
    </div>
  )
}
