'use client'

import SupplierForm from '@/components/supplier/SupplierForm'
import { useCreateSupplier } from '@/hooks/useSupplier'
import type { SupplierFormData } from '@/types/supplier'

export default function TambahSupplierPage() {
  const createMutation = useCreateSupplier()

  async function handleSubmit(data: SupplierFormData) {
    await createMutation.mutateAsync(data)
    window.location.href = '/supplier'
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tambah Supplier</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tambahkan pemasok baru ke dalam sistem</p>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <SupplierForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Tambah Supplier"
        />
      </div>
    </div>
  )
}
