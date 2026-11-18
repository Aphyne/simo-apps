import { Suspense } from 'react'
import SupplierTable from '@/components/supplier/SupplierTable'
import AdminOnly from '@/components/layout/AdminOnly'

// SupplierTable membaca filter dari URL (useSearchParams), jadi harus dibungkus Suspense agar build produksi tidak gagal.
export default function SupplierPage() {
  return (
    <AdminOnly>
      <Suspense fallback={<div className="mx-auto max-w-7xl py-16 text-center text-sm text-muted-foreground" role="status">Memuat supplier</div>}>
        <SupplierTable />
      </Suspense>
    </AdminOnly>
  )
}
