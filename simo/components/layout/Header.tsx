'use client'

import { ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AlertNotification from '@/components/ui/AlertNotification'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Header() {
  const { user } = useAuth()

  const initials = (user?.nama ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Kiri — nama apotek */}
      <p className="text-sm font-medium text-gray-400">Apotek Rezky Medika</p>

      {/* Kanan — alert + profil */}
      <div className="flex items-center gap-3">
        <AlertNotification />

        <div className="w-px h-5 bg-gray-200" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {initials}
              </div>
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {user?.nama ?? '—'}
              </p>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.nama ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">@{user?.username}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {user?.role === 'admin' ? 'Admin' : 'Staf'}
              </span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
