'use client'

import { Users, UserCheck, UserX } from 'lucide-react'
import { UserItem } from '@/hooks/useUsers'

interface Props {
  users: UserItem[]
}

export default function UserStatCards({ users }: Props) {
  const aktif = users.filter(u => u.is_active).length
  const nonAktif = users.filter(u => !u.is_active).length

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Total User</p>
          <p className="text-2xl font-bold leading-tight text-gray-900">{users.length}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Aktif</p>
          <p className="text-2xl font-bold leading-tight text-gray-900">{aktif}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <UserX className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Non-aktif</p>
          <p className="text-2xl font-bold leading-tight text-gray-900">{nonAktif}</p>
        </div>
      </div>
    </div>
  )
}
