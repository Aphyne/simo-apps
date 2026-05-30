'use client'

import { useUserList } from '@/hooks/useUsers'
import UserStatCards from '@/components/users/UserStatCards'
import UserTable from '@/components/users/UserTable'

export default function UsersPage() {
  const { data, isLoading } = useUserList()
  const users = data ?? []

  return (
    <div className="space-y-6">
      <UserStatCards users={users} />
      <UserTable users={users} isLoading={isLoading} />
    </div>
  )
}
