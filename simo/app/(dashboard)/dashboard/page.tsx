'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Banknote, CalendarX, Hourglass, PackagePlus, PackageMinus, Plus } from 'lucide-react'
import { StatTile, ReorderTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import { Button } from '@/components/ui/button'
import { useNow, useSudahDiBrowser } from '@/hooks/useNow'
import { formatRupiah } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import PembelianPenjualanChart from '@/components/dashboard/PembelianPenjualanChart'
import DaftarExpiredCard from '@/components/dashboard/DaftarExpiredCard'
import TerlarisCard from '@/components/dashboard/TerlarisCard'
import PerluDilengkapiCard from '@/components/dashboard/PerluDilengkapiCard'
import BarangMasukTambahDialog from '@/components/transaksi/BarangMasukTambahDialog'
import BarangKeluarTambahDialog from '@/components/transaksi/BarangKeluarTambahDialog'
import ObatForm from '@/components/obat/ObatForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDashboardSummary, usePembelianPenjualan } from '@/hooks/useDashboard'
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
  const diBrowser = useSudahDiBrowser()
  const user = useAuthStore((s) => s.user)

  const { data: summary, isLoading: loadingSummary, isError: gagalSummary } = useDashboardSummary()
  // Halaman Reorder dan semua angka uang (pendapatan, harga beli, terlaris) khusus admin; staf melihat angka stok saja.
  // Backend juga tidak mengirim angka uang ke staf, jadi ini bukan sekadar menyembunyikan tampilan.
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const { data: grafik, isLoading: loadingGrafik, isError: gagalGrafik } = usePembelianPenjualan(isAdmin)
  const createObatMutation = useCreateObat()

  const cards = summary?.cards
  const daftarExpired = summary?.daftar_expired ?? []
  const daftarLewat = summary?.daftar_lewat ?? []
  const terlaris = summary?.terlaris_30_hari ?? []
  const perlu = summary?.perlu_dilengkapi
  const totalUrgent = summary?.total_urgent ?? 0

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
  // Admin: tiga ubin (4 kolom tiap ubin). Staf: dua ubin (6 kolom tiap ubin).
  const kolomUbin = isAdmin ? 'col-span-12 sm:col-span-6 lg:col-span-4' : 'col-span-12 sm:col-span-6'
  const lewat = cards?.kedaluwarsa_lewat ?? 0
  const tanpaHarga = cards?.penjualan_tanpa_harga ?? 0

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">

      {/* ── Sapaan + aksi utama ──────────────────────────────────────── */}
      <section className="col-span-12 flex flex-col justify-between gap-4 rounded-2xl bg-card p-5 lg:col-span-8">
        <div>
          {/* Tanggal dan sapaan bergantung zona waktu setempat: baru ditampilkan di browser (lihat useSudahDiBrowser).
              Spasi tak terputus menjaga tinggi baris sebelum itu, supaya tata letak tidak bergeser. */}
          <p className="text-sm font-medium text-muted-foreground">
            {diBrowser ? format(sekarang, 'EEEE, d MMMM yyyy', { locale: localeId }) : ' '}
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-foreground">
            {diBrowser
              ? `${sapaan(sekarang.getHours())}${user?.nama ? `, ${user.nama.split(' ')[0]}` : ''}`
              : ' '}
          </h1>
          {dataGagal && !loadingSummary && (
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Data stok belum bisa dimuat, jadi ringkasannya belum bisa dipercaya. Muat ulang halaman untuk mencoba lagi.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Admin: stok masuk (biru) lebih dulu. Staf: stok keluar (penjualan) paling sering dipakai, jadi tombol utama;
              "Tambah obat" hanya admin (backend menolak staf). */}
          {isAdmin ? (
            <>
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
            </>
          ) : (
            <>
              <Button size="lg" className="h-10 rounded-xl px-4" onClick={() => setOpenKeluar(true)}>
                <PackageMinus data-icon="inline-start" />
                Catat stok keluar
              </Button>
              <Button size="lg" variant="outline" className="h-10 rounded-xl px-4" onClick={() => setOpenMasuk(true)}>
                <PackagePlus data-icon="inline-start" />
                Catat stok masuk
              </Button>
            </>
          )}
        </div>
      </section>

      <ReorderTile
        className="col-span-12 lg:col-span-4"
        value={dataGagal ? null : reorder}
        total={dataGagal ? null : (cards?.total_obat ?? 0)}
        isLoading={loadingSummary}
        judul={isAdmin ? 'Perlu reorder' : 'Perlu dilaporkan ke admin'}
        action={
          // Admin memesan lewat Reorder. Staf tidak memesan: dia melihat obatnya di Data Obat (filter status yang sama) untuk dilaporkan.
          <Link
            href={isAdmin ? '/reorder' : '/obat?status=HARUS_REORDER'}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary-foreground px-4 text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary-foreground/90 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            {isAdmin ? 'Lihat daftar reorder' : 'Lihat obatnya'}
          </Link>
        }
      />

      {/* ── Angka berbeda; tiap ubin menuju halaman asalnya. Staf tanpa ubin uang, jadi tiga ubin selebar sepertiga. ── */}
      {isAdmin && (
        <StatTile
          className={kolomUbin}
          href="/barang-keluar"
          label="Pendapatan hari ini"
          value={dataGagal ? null : (cards?.pendapatan_hari_ini ?? null)}
          teks={cards?.pendapatan_hari_ini !== undefined && !dataGagal ? formatRupiah(cards.pendapatan_hari_ini) : undefined}
          sublabel={
            <>
              {cards?.penjualan_transaksi ?? 0} penjualan
              {tanpaHarga > 0 && <span className="block">{tanpaHarga} belum ber-harga</span>}
            </>
          }
          icon={Banknote}
          isLoading={loadingSummary}
        />
      )}
      <StatTile
        className={kolomUbin}
        href="/laporan?tab=kedaluarsa"
        label="Akan kedaluwarsa"
        value={dataGagal ? null : expiring}
        sublabel={
          <>
            dalam 90 hari
            {lewat > 0 && <span className="block font-medium text-danger-700">{lewat} batch sudah lewat</span>}
          </>
        }
        icon={CalendarX}
        isLoading={loadingSummary}
      />
      <StatTile
        className={kolomUbin}
        href={isAdmin ? '/reorder?kondisi=segera' : '/obat?status=HARUS_REORDER'}
        label="Habis dalam 7 hari"
        value={dataGagal ? null : (cards?.obat_segera_habis ?? null)}
        sublabel="belum habis, stok tinggal sedikit"
        icon={Hourglass}
        isLoading={loadingSummary}
      />

      {/* ── Kedaluwarsa + yang baru terjadi hari ini ─────────────────── */}
      {/* Kartu bertinggi tetap; isinya yang bisa digulir. */}
      <DaftarExpiredCard
        className="col-span-12 h-[27rem] lg:col-span-7"
        lewat={daftarLewat}
        totalLewat={lewat}
        akan={daftarExpired}
        totalAkan={totalUrgent}
        isLoading={loadingSummary}
        isError={dataGagal}
      />
      <AktivitasHariIni className="col-span-12 h-[27rem] lg:col-span-5" />

      {/* ── Uang: hanya admin ────────────────────────────────────────── */}
      {isAdmin && (
        <>
          <Panel title="Pembelian dan penjualan, 6 bulan terakhir" className="col-span-12 lg:col-span-8">
            {loadingGrafik ? (
              <div className="h-60 rounded-xl bg-muted motion-safe:animate-pulse" aria-hidden="true" />
            ) : gagalGrafik ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Grafik belum bisa dimuat. Muat ulang halaman untuk mencoba lagi.</p>
            ) : (
              <PembelianPenjualanChart data={grafik ?? []} />
            )}
          </Panel>
          {/* Di layar lebar tinggi kartu mengikuti grafik di sebelahnya (absolute), bukan isinya; di bawah lg tingginya tetap. */}
          <div className="relative col-span-12 h-[27rem] lg:col-span-4 lg:h-auto">
            <TerlarisCard className="h-full lg:absolute lg:inset-0" data={terlaris} isLoading={loadingSummary} isError={dataGagal} />
          </div>
          {perlu && (
            <PerluDilengkapiCard
              className="col-span-12"
              penjualanTanpaHarga={perlu.penjualan_tanpa_harga}
              obatTanpaSupplier={perlu.obat_tanpa_supplier}
              batchTanpaNomor={perlu.batch_tanpa_nomor}
            />
          )}
        </>
      )}

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
