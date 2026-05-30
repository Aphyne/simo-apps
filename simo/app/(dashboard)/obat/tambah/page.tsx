'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import ObatForm from '@/components/obat/ObatForm'
import { useCreateObat } from '@/hooks/useObat'
import type { ObatFormData } from '@/types/obat'

export default function TambahObatPage() {
  const router = useRouter()
  const createMutation = useCreateObat()

  async function handleSubmit(data: ObatFormData) {
    await createMutation.mutateAsync(data)
    window.location.href = '/obat'
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
          <h1 className="text-xl font-bold text-gray-900">Tambah Obat</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kode obat akan dibuat otomatis oleh sistem</p>
        </div>
      </div>
      <ObatForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitLabel="Tambah Obat"
      />
    </div>
  )
}
