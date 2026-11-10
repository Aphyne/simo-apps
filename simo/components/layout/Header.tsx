'use client'

import { ChevronDown, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AlertNotification from '@/components/ui/AlertNotification'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  // Tombol menu hanya tampil di layar < lg (sidebar menjadi drawer)
  menuOpen?: boolean
  onMenuClick?: () => void
}

export default function Header({ menuOpen = false, onMenuClick }: HeaderProps) {
  const { user } = useAuth()

  const initials = (user?.nama ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <header className="h-14 bg-surface border-b border-line flex items-center justify-between gap-2 px-4 sm:px-6 flex-shrink-0">
      {/* Kiri — tombol menu (HP/tablet) + nama apotek */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          id="tombol-menu"
          type="button"
          onClick={onMenuClick}
          aria-label="Buka menu"
          aria-expanded={menuOpen}
          aria-controls="sidebar-nav"
          className="-ml-2 rounded-lg p-2 text-fg-muted hover:bg-surface-muted hover:text-fg-secondary lg:hidden"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <p className="truncate text-sm font-medium text-fg-muted">Apotek Rezky Medika</p>
      </div>

      {/* Kanan — alert + profil */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <AlertNotification />

        <div className="w-px h-5 bg-gray-200" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-muted transition-colors focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {initials}
              </div>
              <p className="hidden sm:block text-sm font-medium text-fg leading-tight">
                {user?.nama ?? '—'}
              </p>
              <ChevronDown className="w-3.5 h-3.5 text-fg-subtle" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-fg leading-tight">{user?.nama ?? '—'}</p>
                <p className="text-xs text-fg-muted mt-0.5">@{user?.username}</p>
              </div>
            </div>
            <div className="border-t border-line-subtle pt-2">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${user?.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : user?.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-fg-tertiary'}`}>
                {user?.role === 'superadmin' ? 'Peneliti' : user?.role === 'admin' ? 'Admin' : 'Staf'}
              </span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
