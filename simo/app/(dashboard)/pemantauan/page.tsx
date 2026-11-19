'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, CircleAlert, MousePointerClick, ShieldAlert, Timer, Wifi } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useAnalitikAktivitas, useRingkasanAktivitas, type LogFilter, type RingkasanUser } from '@/hooks/useAktivitas'
import PageHeader from '@/components/shared/PageHeader'
import StateMessage from '@/components/shared/StateMessage'
import { useFilterUrl } from '@/components/shared/useFilterUrl'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Panel from '@/components/dashboard/Panel'
import { StatTile } from '@/components/dashboard/StatTile'
import AktivitasChart from '@/components/pemantauan/AktivitasChart'
import FiturDipakai from '@/components/pemantauan/FiturDipakai'
import JenisAksiDonut from '@/components/pemantauan/JenisAksiDonut'
import LogAktivitasTable, { PER_HALAMAN_LOG } from '@/components/pemantauan/LogAktivitasTable'
import PenggunaDialog from '@/components/pemantauan/PenggunaDialog'
import PenggunaTable from '@/components/pemantauan/PenggunaTable'
import PerluPerhatian from '@/components/pemantauan/PerluPerhatian'
import PetaJam from '@/components/pemantauan/PetaJam'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMenitRingkas } from '@/components/pemantauan/format'
import { PERIODE_PILIHAN, hitungRentang, labelPeriode, periodeValid } from '@/components/pemantauan/periode'

// Satu kalimat jujur untuk panel yang gagal dimuat: gagal bukan berarti tidak ada aktivitas.
function GagalMuat({ onCobaLagi }: { onCobaLagi: () => void }) {
  return (
    <StateMessage
      icon={CircleAlert}
      title="Belum bisa dimuat"
      description="Ini bukan berarti tidak ada aktivitas. Bila baru memperbarui aplikasi, pastikan server backend sudah dijalankan ulang."
      action={<Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={onCobaLagi}>Coba lagi</Button>}
      className="py-8"
    />
  )
}

function Kerangka({ tinggi = 'h-48' }: { tinggi?: string }) {
  return <Skeleton className={`${tinggi} w-full rounded-xl`} aria-hidden="true" />
}

function IsiPemantauan() {
  const { sp, ubahParam } = useFilterUrl()
  const periode = periodeValid(sp.get('periode'))
  const dariUrl = sp.get('dari')
  const sampaiUrl = sp.get('sampai')
  const rentang = useMemo(() => hitungRentang(periode, dariUrl, sampaiUrl), [periode, dariUrl, sampaiUrl])
  const halaman = Math.max(1, parseInt(sp.get('hal') ?? '1') || 1)

  const ringkasan = useRingkasanAktivitas(rentang)
  const analitik = useAnalitikAktivitas(rentang)
  const [dialogUser, setDialogUser] = useState<RingkasanUser | null>(null)

  const users = ringkasan.data?.users ?? []
  const a = analitik.data
  const k = a?.kpi
  const akunAktif = users.filter((u) => u.is_active).length
  const online = ringkasan.data?.hari_ini?.user_online ?? null
  const ket = labelPeriode(periode, a?.rentang)

  const filterLog: LogFilter = {
    ...rentang,
    user_id: sp.get('user') ?? undefined,
    jenis: sp.get('jenis') ?? undefined,
    page: halaman,
    limit: PER_HALAMAN_LOG,
  }

  function lihatSemuaDiLog(u: RingkasanUser) {
    setDialogUser(null)
    ubahParam({ user: String(u.id) })
    // Dialog menutup dulu, baru menggulir ke log.
    setTimeout(() => document.getElementById('log-aktivitas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }

  const gagalAnalitik = analitik.isError
  const gagalRingkasan = ringkasan.isError

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <PageHeader
        title="Pemantauan"
        description="Bukti pemakaian sistem oleh pengguna: kapan masuk, fitur yang dipakai, dan aksi data yang dilakukan. Isi data transaksi tidak dicatat."
        actionsAlign="end"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {periode === 'sendiri' && (
              <>
                <Input type="date" aria-label="Dari tanggal" value={dariUrl ?? ''} max={sampaiUrl ?? undefined} onChange={(e) => ubahParam({ dari: e.target.value || null })} className="h-10 w-40 rounded-xl" />
                <span className="text-sm text-muted-foreground" aria-hidden="true">sampai</span>
                <Input type="date" aria-label="Sampai tanggal" value={sampaiUrl ?? ''} min={dariUrl ?? undefined} onChange={(e) => ubahParam({ sampai: e.target.value || null })} className="h-10 w-40 rounded-xl" />
              </>
            )}
            <PilihanCombobox
              aria-label="Periode"
              options={PERIODE_PILIHAN}
              value={periode}
              onChange={(v) => ubahParam({ periode: v === '7' ? null : v, dari: null, sampai: null })}
              noun="periode"
              className="w-52"
            />
          </div>
        }
      />

      {/* Angka ringkas. Online dan akun aktif adalah keadaan sekarang; sisanya mengikuti periode. */}
      <section aria-label="Ringkasan" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile compact label="Online sekarang" icon={Wifi} value={online} isLoading={ringkasan.isLoading} sublabel={gagalRingkasan ? 'belum bisa dimuat' : `dari ${akunAktif} akun aktif`} />
        <StatTile compact label="Hari aktif" icon={CalendarCheck} value={gagalAnalitik ? null : k?.hari_aktif ?? null} isLoading={analitik.isLoading} sublabel={a ? `dari ${a.rentang.hari_total} hari` : ' '} />
        <StatTile compact label="Aksi data" icon={MousePointerClick} value={gagalAnalitik ? null : k?.aksi ?? null} isLoading={analitik.isLoading} sublabel="tambah, ubah, hapus" />
        <StatTile
          compact
          label="Rata-rata sesi"
          icon={Timer}
          value={null}
          teks={gagalAnalitik ? undefined : k ? (k.sesi > 0 ? formatMenitRingkas(k.rata_sesi_menit) : '-') : undefined}
          isLoading={analitik.isLoading}
          sublabel={k && k.sesi > 0 ? `perkiraan, ${k.sesi} sesi` : 'perkiraan'}
        />
        <StatTile compact className="col-span-2 lg:col-span-1" label="Login gagal" icon={ShieldAlert} value={gagalAnalitik ? null : k?.login_gagal ?? null} isLoading={analitik.isLoading} sublabel={k ? `${k.login} login berhasil` : ' '} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel title="Aktivitas per hari" className="lg:col-span-8" action={<span className="text-sm font-normal text-muted-foreground">{ket}</span>}>
          {gagalAnalitik ? <GagalMuat onCobaLagi={() => analitik.refetch()} /> : analitik.isLoading || !a ? <Kerangka tinggi="h-64" /> : <AktivitasChart data={a.harian} satuan={a.rentang.satuan} />}
        </Panel>
        <Panel title="Perlu perhatian" className="lg:col-span-4" action={<span className="text-sm font-normal text-muted-foreground">kondisi sekarang</span>}>
          {gagalAnalitik ? <GagalMuat onCobaLagi={() => analitik.refetch()} /> : analitik.isLoading || !a?.perhatian ? <Kerangka tinggi="h-40" /> : <PerluPerhatian data={a.perhatian} />}
        </Panel>

        <Panel title="Fitur yang dipakai" className="lg:col-span-5" action={<span className="text-sm font-normal text-muted-foreground">{ket}</span>}>
          {gagalAnalitik ? <GagalMuat onCobaLagi={() => analitik.refetch()} /> : analitik.isLoading || !a ? <Kerangka tinggi="h-64" /> : <FiturDipakai modul={a.modul} />}
        </Panel>
        <Panel title="Kapan sistem dipakai" className="lg:col-span-7" action={<span className="text-sm font-normal text-muted-foreground">{ket} · WIB</span>}>
          {gagalAnalitik ? <GagalMuat onCobaLagi={() => analitik.refetch()} /> : analitik.isLoading || !a ? <Kerangka tinggi="h-64" /> : <PetaJam jam={a.jam} />}
        </Panel>

        <Panel title="Jenis aksi data" className="lg:col-span-4">
          {gagalAnalitik ? <GagalMuat onCobaLagi={() => analitik.refetch()} /> : analitik.isLoading || !a ? <Kerangka tinggi="h-40" /> : <JenisAksiDonut data={a.aksi_jenis} />}
        </Panel>
        <Panel title="Pengguna" count={users.length} className="lg:col-span-8" bodyClassName="px-0 pb-0" action={<span className="text-sm font-normal text-muted-foreground">Klik nama untuk melihat rincian</span>}>
          <PenggunaTable users={users} isLoading={ringkasan.isLoading} isError={gagalRingkasan} onCobaLagi={() => ringkasan.refetch()} onPilihUser={setDialogUser} />
        </Panel>
      </div>

      <LogAktivitasTable
        users={users}
        filter={filterLog}
        onUbah={(patch) => ubahParam(patch)}
        onHalaman={(n) => ubahParam({ hal: n > 1 ? String(n) : null }, { resetHalaman: false })}
      />

      <PenggunaDialog user={dialogUser} rentang={rentang} ketRentang={ket} onTutup={() => setDialogUser(null)} onLihatLog={lihatSemuaDiLog} />
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
  return (
    <Suspense fallback={null}>
      <IsiPemantauan />
    </Suspense>
  )
}
