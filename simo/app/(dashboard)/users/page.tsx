'use client'

import { useUserList } from '@/hooks/useUsers'
import UserStatCards from '@/components/users/UserStatCards'
import UserTable from '@/components/users/UserTable'
import AdminOnly from '@/components/layout/AdminOnly'

function IsiUsers() {
  const { data, isLoading } = useUserList()
  const users = data ?? []

  return (
    <div className="space-y-6">
      <UserStatCards users={users} />
      <UserTable users={users} isLoading={isLoading} />
    </div>
  )
}

export default function UsersPage() {
  return (
    <AdminOnly>
      <IsiUsers />
    </AdminOnly>
  )
}
