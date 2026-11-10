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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <p className="text-xs text-fg-muted font-medium">Total User</p>
          <p className="text-2xl font-bold leading-tight text-fg">{users.length}</p>
        </div>
      </div>
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-5 h-5 text-success-600" />
        </div>
        <div>
          <p className="text-xs text-fg-muted font-medium">Aktif</p>
          <p className="text-2xl font-bold leading-tight text-fg">{aktif}</p>
        </div>
      </div>
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-surface-muted flex items-center justify-center flex-shrink-0">
          <UserX className="w-5 h-5 text-fg-muted" />
        </div>
        <div>
          <p className="text-xs text-fg-muted font-medium">Non-aktif</p>
          <p className="text-2xl font-bold leading-tight text-fg">{nonAktif}</p>
        </div>
      </div>
    </div>
  )
}
