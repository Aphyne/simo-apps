'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import ObatForm from '@/components/obat/ObatForm'
import { useObatById, useUpdateObat } from '@/hooks/useObat'
import type { ObatFormData } from '@/types/obat'

export default function EditObatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Kembali"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Obat</h1>
          <p className="text-sm text-gray-500 mt-0.5">{obat.kode} — {obat.nama}</p>
        </div>
      </div>
      <ObatForm
        defaultValues={obat}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        submitLabel="Simpan Perubahan"
      />
    </div>
  )
}
