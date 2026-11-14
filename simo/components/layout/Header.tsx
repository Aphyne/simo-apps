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
    <header className="h-16 bg-background flex items-center justify-between gap-2 px-4 sm:px-8 flex-shrink-0">
      {/* Kiri — tombol menu (HP/tablet) + nama apotek */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          id="tombol-menu"
          type="button"
          onClick={onMenuClick}
          aria-label="Buka menu"
          aria-expanded={menuOpen}
          aria-controls="sidebar-nav"
          className="-ml-2.5 flex size-11 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <p className="truncate text-sm font-medium text-foreground">Apotek Rezky Medika</p>
      </div>

      {/* Kanan — alert + profil */}
      <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-card p-0.5 pr-2">
        <AlertNotification />

        <div className="mx-1 h-5 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex min-h-11 items-center gap-2 rounded-full py-0.5 pl-0.5 pr-1.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {initials}
              </div>
              <p className="hidden sm:block text-sm font-medium text-foreground leading-tight">
                {user?.nama ?? '—'}
              </p>
              <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{user?.nama ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">@{user?.username}</p>
              </div>
            </div>
            <div className="border-t pt-2">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${user?.role === 'staf' ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'}`}>
                {user?.role === 'superadmin' ? 'Peneliti' : user?.role === 'admin' ? 'Admin' : 'Staf'}
              </span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
