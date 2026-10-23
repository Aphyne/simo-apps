'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SupplierForm from '@/components/supplier/SupplierForm'
import { useSupplierById, useUpdateSupplier } from '@/hooks/useSupplier'
import { useAuthStore } from '@/store/auth.store'
import type { SupplierFormData } from '@/types/supplier'

export default function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const { data: supplier, isLoading } = useSupplierById(id)
  const updateMutation = useUpdateSupplier(id)

  useEffect(() => {
    if (isHydrated && !isAdmin) {
      router.replace('/dashboard')
    }
  }, [isHydrated, isAdmin, router])

  async function handleSubmit(data: SupplierFormData) {
    await updateMutation.mutateAsync(data)
    window.location.href = '/supplier'
  }

  if (!isHydrated || !isAdmin) {
    return null
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
            <h1 className="text-sm font-semibold text-gray-900">Edit Supplier</h1>
            <p className="text-xs text-gray-500 mt-0.5">{supplier?.nama ?? 'Memuat data...'}</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-4 pb-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : !supplier ? (
            <p className="text-center py-10 text-gray-500 text-sm">Supplier tidak ditemukan</p>
          ) : (
            <SupplierForm
              defaultValues={supplier}
              onSubmit={handleSubmit}
              isLoading={updateMutation.isPending}
              submitLabel="Simpan Perubahan"
            />
          )}
        </div>
      </div>
    </div>
  )
}
