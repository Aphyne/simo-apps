'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import ActivityTracker from '@/components/layout/ActivityTracker'
import GlobalErrorBanner from '@/components/layout/GlobalErrorBanner'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { hydrate } = useAuth()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pathMenu, setPathMenu] = useState(pathname)

  // Drawer menu (layar kecil) ikut tertutup saat pindah halaman
  if (pathMenu !== pathname) {
    setPathMenu(pathname)
    setMenuOpen(false)
  }

  const tutupMenu = useCallback(() => {
    setMenuOpen(false)
    document.getElementById('tombol-menu')?.focus()
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <div className="flex min-h-screen bg-background">
      <ActivityTracker />
      <Sidebar open={menuOpen} onClose={tutupMenu} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 px-4 pb-8 pt-2 sm:px-8 bg-background overflow-x-clip">
          <GlobalErrorBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
