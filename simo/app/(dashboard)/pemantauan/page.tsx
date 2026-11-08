'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { useRingkasanAktivitas, type LogFilter } from '@/hooks/useAktivitas'
import PemantauanStatCards from '@/components/pemantauan/PemantauanStatCards'
import PenggunaTable from '@/components/pemantauan/PenggunaTable'
import LogAktivitasTable from '@/components/pemantauan/LogAktivitasTable'

function IsiPemantauan() {
  const { data, isLoading } = useRingkasanAktivitas()
  const [filter, setFilter] = useState<LogFilter>({ page: 1, limit: 20 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pemantauan Aktivitas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Bukti pemakaian sistem oleh pengguna: kapan login, halaman yang dibuka, dan aksi data yang dilakukan.
        </p>
      </div>
      <PemantauanStatCards data={data} isLoading={isLoading} />
      <PenggunaTable
        users={data?.users ?? []}
        isLoading={isLoading}
        onPilihUser={(id) => setFilter((f) => ({ ...f, user_id: String(id), page: 1 }))}
      />
      <LogAktivitasTable users={data?.users ?? []} filter={filter} setFilter={setFilter} />
    </div>
  )
}

// Hanya akun peneliti (superadmin) yang boleh melihat halaman ini.
export default function PemantauanPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  useEffect(() => {
    if (isHydrated && user?.role !== 'superadmin') router.replace('/dashboard')
  }, [isHydrated, user, router])

  if (!isHydrated || user?.role !== 'superadmin') return null
  return <IsiPemantauan />
}
