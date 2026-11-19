'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard,
  Pill,
  PackagePlus,
  PackageMinus,
  FileText,
  Truck,
  Users,
  Settings,
  Activity,
  TrendingUp,
  ShoppingCart,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
  superadminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Data Obat', href: '/obat', icon: Pill },
  { label: 'Stok Masuk', href: '/barang-masuk', icon: PackagePlus },
  { label: 'Stok Keluar', href: '/barang-keluar', icon: PackageMinus },
  { label: 'Reorder', href: '/reorder', icon: ShoppingCart, adminOnly: true },
  // Dinonaktifkan — cukup 1 screenshot final untuk lampiran laporan, lihat app/(dashboard)/simulasi/page.tsx
  // (saat diaktifkan kembali, impor ikon FlaskConical dan Calculator dari lucide-react)
  // { label: 'Simulasi Skenario', href: '/simulasi', icon: FlaskConical, adminOnly: true },
  // Dinonaktifkan — cukup 1 screenshot final untuk lampiran laporan, lihat app/(dashboard)/perhitungan/page.tsx
  // { label: 'Perhitungan EOQ/ROP', href: '/perhitungan', icon: Calculator, adminOnly: true },
  { label: 'Laporan', href: '/laporan', icon: FileText },
  { label: 'Supplier', href: '/supplier', icon: Truck, adminOnly: true },
  { label: 'Manajemen User', href: '/users', icon: Users, adminOnly: true },
  { label: 'Pengaturan', href: '/pengaturan', icon: Settings, adminOnly: true },
  // Khusus akun peneliti (superadmin): pemantauan aktivitas pengguna untuk keperluan skripsi
  { label: 'Pemantauan', href: '/pemantauan', icon: Activity, superadminOnly: true },
  // Perbandingan biaya sebelum vs sesudah EOQ: bahan skripsi, jadi juga khusus peneliti
  { label: 'Analisis Komparatif', href: '/analisis', icon: TrendingUp, superadminOnly: true },
]

interface SidebarProps {
  // Hanya dipakai di layar < lg: sidebar menjadi drawer. Di desktop sidebar tetap statis.
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()

  // Superadmin hanya melihat menu Pemantauan; admin/staf tidak pernah melihatnya
  const visibleItems = navItems.filter((item) =>
    user?.role === 'superadmin'
      ? item.superadminOnly
      : !item.superadminOnly && (!item.adminOnly || user?.role === 'admin')
  )

  const asideRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Drawer terbuka: fokus ke tombol tutup, Esc menutup, Tab berputar di dalam drawer.
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
        return
      }
      if (e.key !== 'Tab' || !asideRef.current) return
      const fokusable = asideRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      if (fokusable.length === 0) return
      const pertama = fokusable[0]
      const terakhir = fokusable[fokusable.length - 1]
      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault()
        terakhir.focus()
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault()
        pertama.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Latar gelap drawer (hanya layar kecil) */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-gray-900/40 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />
    <aside
      id="sidebar-nav"
      ref={asideRef}
      aria-label="Menu utama"
      className={cn(
        'fixed inset-y-0 left-0 z-40 h-dvh w-64 bg-background border-r flex flex-col flex-shrink-0 lg:border-r-0',
        'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:visible',
        open
          ? 'translate-x-0 visible [transition:transform_200ms,visibility_0s]'
          : '-translate-x-full invisible [transition:transform_200ms,visibility_0s_200ms]'
      )}
    >
      {/* Brand */}
      {/* px-7 sejajar dengan ikon menu (px-4 wadah + px-3 item). Gambar logo punya tepi kosong sekitar 17% di tiap sisi,
          jadi -ml-1.5 mengembalikan tepi kiri lambangnya ke garis yang sama dengan ikon. */}
      <div className="px-7 h-16 flex items-center gap-2">
        <Image src="/logo.png" alt="" width={40} height={40} className="-ml-1.5 flex-shrink-0" />
        <p className="text-lg font-bold text-foreground tracking-tight">SIMO</p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Tutup menu"
          className="ml-auto flex size-11 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Navigasi utama" className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center gap-3 rounded-xl px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-card font-semibold text-foreground'
                  : 'text-foreground/70 hover:bg-card/60 hover:text-foreground'
              )}
            >
              <Icon className={cn('size-4 flex-shrink-0', isActive && 'text-primary')} aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: logout + versi */}
      <div className="px-4 py-4 space-y-1">
        <button
          onClick={logout}
          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-foreground/70 outline-none transition-colors hover:bg-card/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="size-4 flex-shrink-0" aria-hidden="true" />
          Keluar
        </button>
        <p className="px-3 text-xs text-muted-foreground">SIMO v1.0, 2026</p>
      </div>
    </aside>
    </>
  )
}
