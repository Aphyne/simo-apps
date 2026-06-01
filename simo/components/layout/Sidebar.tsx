'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard,
  Pill,
  PackagePlus,
  PackageMinus,
  Calculator,
  FlaskConical,
  TrendingUp,
  FileText,
  Truck,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Data Obat', href: '/obat', icon: Pill },
  { label: 'Barang Masuk', href: '/barang-masuk', icon: PackagePlus },
  { label: 'Barang Keluar', href: '/barang-keluar', icon: PackageMinus },
  { label: 'Perhitungan EOQ/ROP', href: '/perhitungan', icon: Calculator },
  { label: 'Simulasi Skenario', href: '/simulasi', icon: FlaskConical, adminOnly: true },
  { label: 'Analisis Komparatif', href: '/analisis', icon: TrendingUp, adminOnly: true },
  { label: 'Laporan', href: '/laporan', icon: FileText },
  { label: 'Supplier', href: '/supplier', icon: Truck },
  { label: 'Manajemen User', href: '/users', icon: Users, adminOnly: true },
  { label: 'Pengaturan', href: '/pengaturan', icon: Settings, adminOnly: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  )

  return (
    <aside className="sticky top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="px-6 h-14 flex items-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">SIMO</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: logout + versi */}
      <div className="px-6 py-3 border-t border-gray-200 space-y-1">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Keluar
        </button>
        <p className="text-xs text-gray-400">SIMO v1.0 · 2026</p>
      </div>
    </aside>
  )
}
