'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import AlertNotification from '@/components/ui/AlertNotification'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
      {/* Kiri — kosong, bisa diisi breadcrumb nanti */}
      <div />

      {/* Kanan — alert + info user + logout */}
      <div className="flex items-center gap-3">
        <AlertNotification />
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 leading-tight">
            {user?.nama ?? '—'}
          </p>
          <p className="text-xs text-gray-400">@{user?.username}</p>
        </div>

        <Badge
          className={
            user?.role === 'admin'
              ? 'bg-blue-600 hover:bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
          }
        >
          {user?.role === 'admin' ? 'Admin' : 'Staf'}
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Keluar
        </Button>
      </div>
    </header>
  )
}
