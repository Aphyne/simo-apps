'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SupplierTable from '@/components/supplier/SupplierTable'
import { useAuthStore } from '@/store/auth.store'

export default function SupplierPage() {
  const router = useRouter()
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const isAdmin = useAuthStore((s) => s.isAdmin())

  useEffect(() => {
    if (isHydrated && !isAdmin) {
      router.replace('/dashboard')
    }
  }, [isHydrated, isAdmin, router])

  if (!isHydrated || !isAdmin) {
    return null
  }

  return (
    <div>
      <SupplierTable />
    </div>
  )
}
