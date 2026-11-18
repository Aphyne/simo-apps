import { Suspense } from 'react'
import UserTable from '@/components/users/UserTable'
import AdminOnly from '@/components/layout/AdminOnly'

// UserTable membaca filter dari URL (useSearchParams), jadi harus dibungkus Suspense agar build produksi tidak gagal.
export default function UsersPage() {
  return (
    <AdminOnly>
      <Suspense fallback={<div className="mx-auto max-w-7xl py-16 text-center text-sm text-muted-foreground" role="status">Memuat user</div>}>
        <UserTable />
      </Suspense>
    </AdminOnly>
  )
}
