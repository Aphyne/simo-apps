'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <div className="flex min-h-screen">
      <ActivityTracker />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <GlobalErrorBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
