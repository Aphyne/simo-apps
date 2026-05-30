'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
    <div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <Link
            href="/supplier"
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Tambah Supplier</h1>
            <p className="text-xs text-gray-400 mt-0.5">Tambahkan pemasok baru ke dalam sistem</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pt-4 pb-6">
          <SupplierForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            submitLabel="Tambah Supplier"
          />
        </div>
      </div>
    </div>
  )
}
