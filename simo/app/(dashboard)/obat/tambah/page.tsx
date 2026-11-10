'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import ObatForm from '@/components/obat/ObatForm'
import { useCreateObat } from '@/hooks/useObat'
import type { ObatFormData } from '@/types/obat'
import AdminOnly from '@/components/layout/AdminOnly'

function IsiTambahObatPage() {
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
          className="p-1.5 rounded-lg text-fg-subtle hover:text-fg-secondary hover:bg-surface-muted transition-colors"
          title="Kembali"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-fg">Tambah Obat</h1>
          <p className="text-sm text-fg-muted mt-0.5">Kode obat akan dibuat otomatis oleh sistem</p>
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

export default function TambahObatPage() {
  return (<AdminOnly><IsiTambahObatPage /></AdminOnly>)
}
