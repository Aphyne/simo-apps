'use client'

import { use } from 'react'
import SupplierForm from '@/components/supplier/SupplierForm'
import { useSupplierById, useUpdateSupplier } from '@/hooks/useSupplier'
import type { SupplierFormData } from '@/types/supplier'

export default function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: supplier, isLoading } = useSupplierById(id)
  const updateMutation = useUpdateSupplier(id)

  async function handleSubmit(data: SupplierFormData) {
    await updateMutation.mutateAsync(data)
    window.location.href = '/supplier'
  }

  if (isLoading) {
    return <div className="text-gray-400 py-12 text-center">Memuat data supplier...</div>
  }

  if (!supplier) {
    return <div className="text-red-500 py-12 text-center">Supplier tidak ditemukan</div>
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Edit Supplier</h1>
        <p className="text-sm text-gray-500 mt-0.5">{supplier.nama}</p>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <SupplierForm
          defaultValues={supplier}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          submitLabel="Simpan Perubahan"
        />
      </div>
    </div>
  )
}
