'use client'

import { usePengaturan } from '@/hooks/usePengaturan'
import PengaturanForm from '@/components/pengaturan/PengaturanForm'
import AdminOnly from '@/components/layout/AdminOnly'

function IsiPengaturan() {
  const { data, isLoading } = usePengaturan()

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="h-4 w-36 animate-pulse bg-gray-100 rounded-lg" />
            <div className="h-10 animate-pulse bg-gray-100 rounded-lg" />
            <div className="h-10 animate-pulse bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  return <PengaturanForm data={data} />
}

export default function PengaturanPage() {
  return (
    <AdminOnly>
      <IsiPengaturan />
    </AdminOnly>
  )
}
