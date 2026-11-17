'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Pill, ShoppingCart, ArrowLeftRight, CalendarX, PackagePlus, PackageMinus, Plus } from 'lucide-react'
import { StatTile, ReorderTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { formatRupiah } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import TrenPermintaanChart from '@/components/dashboard/TrenPermintaanChart'
import DaftarExpiredCard from '@/components/dashboard/DaftarExpiredCard'
import StokMenipisCard from '@/components/dashboard/StokMenipisCard'
import BarangMasukTambahDialog from '@/components/transaksi/BarangMasukTambahDialog'
import BarangKeluarTambahDialog from '@/components/transaksi/BarangKeluarTambahDialog'
import ObatForm from '@/components/obat/ObatForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDashboardSummary, useTrenPermintaan } from '@/hooks/useDashboard'
import AktivitasHariIni from '@/components/dashboard/AktivitasHariIni'
import { useCreateObat } from '@/hooks/useObat'
import type { ObatFormData } from '@/types/obat'

function sapaan(jam: number) {
  if (jam < 11) return 'Selamat pagi'
  if (jam < 15) return 'Selamat siang'
  if (jam < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export default function DashboardPage() {
  const router = useRouter()
  const sekarang = useNow()
  const user = useAuthStore((s) => s.user)

  const { data: summary, isLoading: loadingSummary, isError: gagalSummary } = useDashboardSummary()
  const { data: tren, isLoading: loadingTren, isError: gagalTren } = useTrenPermintaan()
  const createObatMutation = useCreateObat()

  const cards = summary?.cards
  const daftarExpired = summary?.daftar_expired ?? []
  const totalUrgent = summary?.total_urgent ?? 0
  const stokMenipis = summary?.stok_menipis ?? []

  const [openMasuk, setOpenMasuk]           = useState(false)
  const [openKeluar, setOpenKeluar]         = useState(false)
  const [openTambahObat, setOpenTambahObat] = useState(false)

  function handleBarangMasukSuccess() {
    router.push('/barang-masuk')
  }

  function handleBarangKeluarSuccess() {
    router.push('/barang-keluar')
  }

  async function handleTambahObat(data: ObatFormData) {
    await createObatMutation.mutateAsync(data)
    setOpenTambahObat(false)
    router.push('/obat')
  }

  // Data gagal dimuat tidak boleh terbaca sebagai nol atau "aman": angka jadi null dan kalimat jujur.
  const dataGagal = gagalSummary || (!loadingSummary && !cards)
  const reorder = cards?.obat_reorder ?? 0
  const expiring = cards?.obat_expiring ?? 0
  // Dua baris catatan: aktivitas hari ini, lalu hal yang butuh perhatian. Hanya angka yang ada di data.
  const masuk = cards?.masuk_hari_ini
  const keluar = cards?.keluar_hari_ini
  const pendapatan = cards?.pendapatan_hari_ini
  const sebagianTanpaHarga = (cards?.penjualan_tanpa_harga ?? 0) > 0
  const catatanHariIni = [
    masuk !== undefined ? `${masuk} transaksi masuk` : null,
    keluar !== undefined ? `${keluar} transaksi keluar` : null,
    pendapatan !== undefined ? `pendapatan ${formatRupiah(pendapatan)}${sebagianTanpaHarga ? ' (sebagian penjualan belum ber-harga)' : ''}` : null,
  ].filter(Boolean)
  const catatanPerhatian =
    reorder === 0 && expiring === 0
      ? 'semua stok aman dan tidak ada obat yang akan expired dalam 90 hari'
      : [
          reorder > 0 ? `${reorder} obat perlu dipesan ulang` : 'tidak ada obat yang perlu dipesan ulang',
          expiring > 0 ? `${expiring} obat akan expired dalam 90 hari` : 'tidak ada yang akan expired dalam 90 hari',
        ].join(', ')

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">

      {/* ── Sapaan + aksi utama ──────────────────────────────────────── */}
      <section className="col-span-12 flex flex-col justify-between gap-4 rounded-2xl bg-card p-5 lg:col-span-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {format(sekarang, 'EEEE, d MMMM yyyy', { locale: localeId })}
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-foreground">
            {sapaan(sekarang.getHours())}{user?.nama ? `, ${user.nama.split(' ')[0]}` : ''}
          </h1>
          {loadingSummary ? (
            <p className="mt-2 text-[15px] text-muted-foreground">Memuat ringkasan stok</p>
          ) : dataGagal ? (
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Data stok belum bisa dimuat, jadi ringkasannya belum bisa dipercaya. Coba lagi lewat tombol di atas.
            </p>
          ) : (
            <div className="mt-2 space-y-1 text-[15px] leading-relaxed text-muted-foreground">
              {catatanHariIni.length > 0 && (
                <p><span className="font-medium text-foreground">Hari ini:</span> {catatanHariIni.join(', ')}.</p>
              )}
              <p><span className="font-medium text-foreground">Perlu perhatian:</span> {catatanPerhatian}.</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" className="h-10 rounded-xl px-4" onClick={() => setOpenMasuk(true)}>
            <PackagePlus data-icon="inline-start" />
            Catat stok masuk
          </Button>
          <Button size="lg" variant="outline" className="h-10 rounded-xl px-4" onClick={() => setOpenKeluar(true)}>
            <PackageMinus data-icon="inline-start" />
            Catat stok keluar
          </Button>
          <Button size="lg" variant="outline" className="h-10 rounded-xl px-4" onClick={() => setOpenTambahObat(true)}>
            <Plus data-icon="inline-start" />
            Tambah obat
          </Button>
        </div>
      </section>

      <ReorderTile
        className="col-span-12 lg:col-span-4"
        value={dataGagal ? null : reorder}
        total={dataGagal ? null : (cards?.total_obat ?? 0)}
        isLoading={loadingSummary}
        action={
          <Link
            href="/reorder"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary-foreground px-4 text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary-foreground/90 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Lihat daftar reorder
          </Link>
        }
      />

      {/* ── Empat angka ──────────────────────────────────────────────── */}
      <StatTile className="col-span-6 lg:col-span-3" label="Total obat" value={dataGagal ? null : (cards?.total_obat ?? 0)} sublabel="jenis terdaftar" icon={Pill} isLoading={loadingSummary} />
      <StatTile className="col-span-6 lg:col-span-3" label="Penjualan hari ini" value={dataGagal ? null : (cards?.penjualan_hari_ini ?? 0)} sublabel="unit terjual" icon={ShoppingCart} isLoading={loadingSummary} />
      <StatTile className="col-span-6 lg:col-span-3" label="Transaksi hari ini" value={dataGagal ? null : (cards?.transaksi_hari_ini ?? 0)} sublabel="masuk dan keluar" icon={ArrowLeftRight} isLoading={loadingSummary} />
      <StatTile className="col-span-6 lg:col-span-3" label="Akan expired" value={dataGagal ? null : expiring} sublabel="dalam 90 hari" icon={CalendarX} isLoading={loadingSummary} />

      {/* ── Stok menipis + akan expired ──────────────────────────────── */}
      <StokMenipisCard className="col-span-12 lg:col-span-7" data={stokMenipis} isLoading={loadingSummary} isError={dataGagal} totalReorder={cards?.obat_reorder} />
      <DaftarExpiredCard className="col-span-12 lg:col-span-5" data={daftarExpired} isLoading={loadingSummary} isError={dataGagal} totalUrgent={totalUrgent} />

      {/* ── Tren permintaan + keluar hari ini ────────────────────────── */}
      <Panel title="Tren permintaan, 6 bulan terakhir" className="col-span-12 lg:col-span-8">
        {loadingTren ? (
          <div className="h-60 rounded-xl bg-muted motion-safe:animate-pulse" aria-hidden="true" />
        ) : gagalTren ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Grafik belum bisa dimuat. Coba lagi lewat tombol di atas.</p>
        ) : (
          <TrenPermintaanChart data={tren ?? []} />
        )}
      </Panel>
      <AktivitasHariIni className="col-span-12 lg:col-span-4" />

      {/* ── Dialogs ─────────────────────────────────────────────────── */}

      <BarangMasukTambahDialog open={openMasuk} onOpenChange={setOpenMasuk} onSuccess={handleBarangMasukSuccess} />

      <BarangKeluarTambahDialog open={openKeluar} onOpenChange={setOpenKeluar} onSuccess={handleBarangKeluarSuccess} />

      <Dialog open={openTambahObat} onOpenChange={setOpenTambahObat}>
        <DialogContent aria-describedby={undefined} className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Obat Baru</DialogTitle>
          </DialogHeader>
          <ObatForm
            onSubmit={handleTambahObat}
            isLoading={createObatMutation.isPending}
            submitLabel="Tambah Obat"
            onBatal={() => setOpenTambahObat(false)}
          />
        </DialogContent>
      </Dialog>

    </div>
  )
}
