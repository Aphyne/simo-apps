'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PackageMinus, Package, CalendarDays, Wallet, Coins, Eye, Pencil, Trash2, SearchX, PackageOpen, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { StatTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import PageHeader from '@/components/shared/PageHeader'
import { FilterBar, SearchField, FILTER_SELECT } from '@/components/shared/FilterBar'
import Pagination from '@/components/shared/Pagination'
import StateMessage from '@/components/shared/StateMessage'
import IconAction from '@/components/shared/IconAction'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import BarangKeluarTambahDialog from '@/components/transaksi/BarangKeluarTambahDialog'
import BarangKeluarEditForm from '@/components/transaksi/BarangKeluarEditForm'
import BarangKeluarDetailDialog from '@/components/transaksi/BarangKeluarDetailDialog'
import BarangKeluarPerTransaksi from '@/components/transaksi/BarangKeluarPerTransaksi'
import BarangKeluarTransaksiDialog from '@/components/transaksi/BarangKeluarTransaksiDialog'
import Segmented from '@/components/shared/Segmented'
import BarangKeluarTrendChart from '@/components/transaksi/BarangKeluarTrendChart'
import BarangKeluarPerObatChart from '@/components/transaksi/BarangKeluarPerObatChart'
import { useBarangKeluarList, useDeleteBarangKeluar } from '@/hooks/useBarangKeluar'
import { useAuthStore } from '@/store/auth.store'
import { useNow } from '@/hooks/useNow'
import { KETERANGAN_KELUAR, kelompokkanPerTransaksi, nilaiPenjualan, rupiahUbin, tanggalLokal, type KelompokTransaksi } from '@/lib/barangKeluar'
import { formatAngka, formatRupiah, formatTanggal, formatTanggalPendek } from '@/lib/utils'
import type { BarangKeluar } from '@/types/obat'

const KEPALA = 'h-10 text-xs font-medium text-muted-foreground'
const BATAS_HALAMAN = 10
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const FORMAT_TANGGAL = /^\d{4}-\d{2}-\d{2}$/

// Kolom tampil bertahap menurut lebar konten (bukan lebar layar): sidebar 256px muncul mulai lg, jadi konten
// di lg sama sempitnya dengan di md. Selalu: Tanggal, Obat, Jumlah, Aksi. md: Keterangan. xl: Total (rupiah).
// 2xl: Stok berubah dan Dicatat oleh.
const KOLOM = {
  keterangan: 'hidden md:table-cell',
  total: 'hidden xl:table-cell',
  stok: 'hidden 2xl:table-cell',
  oleh: 'hidden 2xl:table-cell',
}

const toLocalYMD = (s: string | null | undefined) => (s ? tanggalLokal(new Date(s)) : '')

function BadgeKeterangan({ nilai }: { nilai: string }) {
  return <Badge variant={nilai === 'Penjualan' ? 'secondary' : 'outline'}>{nilai}</Badge>
}

// Kerangka pemuatan: jumlah kolom dan baris sama dengan isi yang akan datang.
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: BATAS_HALAMAN }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="py-3 pl-5"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="py-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1.5 h-3 w-20" />
          </TableCell>
          <TableCell className="py-3"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
          <TableCell className={`py-3 ${KOLOM.keterangan}`}><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell className={`py-3 ${KOLOM.total}`}><Skeleton className="ml-auto h-4 w-20" /></TableCell>
          <TableCell className={`py-3 ${KOLOM.stok}`}><Skeleton className="ml-auto h-4 w-16" /></TableCell>
          <TableCell className={`py-3 ${KOLOM.oleh}`}><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="py-3 pr-4"><Skeleton className="ml-auto h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default function BarangKeluarTable() {
  const now = useNow()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const deleteMutation = useDeleteBarangKeluar()

  // Pencarian, keterangan, periode, dan halaman disimpan di URL (?q=&keterangan=&tanggal=&rentang=7&hal=) supaya
  // tidak hilang saat halaman dimuat ulang dan bisa dibagikan sebagai tautan. Nilai yang tidak dikenal diabaikan.
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const search = sp.get('q') ?? ''
  const keteranganUrl = sp.get('keterangan') ?? ''
  const keterangan = (KETERANGAN_KELUAR as readonly string[]).includes(keteranganUrl) ? keteranganUrl : ''
  const mingguan = sp.get('rentang') === '7'
  const tanggalUrl = sp.get('tanggal') ?? ''
  const date = !mingguan && FORMAT_TANGGAL.test(tanggalUrl) && !Number.isNaN(new Date(tanggalUrl).getTime()) ? tanggalUrl : ''
  const page = Math.max(1, parseInt(sp.get('hal') ?? '1', 10) || 1)
  // Tampilan riwayat: per obat (bawaan, satu baris per obat) atau per transaksi (?tampil=transaksi, satu baris per pencatatan).
  const perTransaksi = sp.get('tampil') === 'transaksi'

  const ubahParam = useCallback(
    (patch: Record<string, string | null>, opsi: { resetHalaman?: boolean } = {}) => {
      const next = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v)
        else next.delete(k)
      }
      if (opsi.resetHalaman !== false) next.delete('hal')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [sp, router, pathname]
  )

  // Kolom cari memakai state lokal supaya ketikan tidak tertinggal; ke URL (dan ke API) setelah jeda 300 ms.
  const [cari, setCari] = useState(search)
  useEffect(() => {
    if ((cari.trim() ? cari : '') === search) return
    const t = setTimeout(() => ubahParam({ q: cari.trim() ? cari : null }), 300)
    return () => clearTimeout(t)
  }, [cari, search, ubahParam])

  const [bukaTambah, setBukaTambah] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BarangKeluar | null>(null)
  const [transaksiDipilih, setTransaksiDipilih] = useState<KelompokTransaksi | null>(null)
  const [editingItem, setEditingItem] = useState<BarangKeluar | null>(null)
  const [kotorEdit, setKotorEdit] = useState(false)
  // Konfirmasi membuang perubahan di dialog ubah (dialog tambah mengurus konfirmasinya sendiri).
  const [buangEdit, setBuangEdit] = useState(false)

  const today = tanggalLokal(now)
  const tujuhHariLalu = (() => { const d = new Date(now); d.setDate(d.getDate() - 6); return tanggalLokal(d) })()

  // "7 hari terakhir" aktif → rentang 7 hari. Selain itu, tanggal tunggal bebas bila diisi.
  const effectiveDari = mingguan ? tujuhHariLalu : undefined
  const effectiveSampai = mingguan ? today : undefined
  const effectiveTanggal = !mingguan ? (date || undefined) : undefined

  const { data, isLoading, isError, refetch } = useBarangKeluarList({ page, limit: BATAS_HALAMAN, search, keterangan, tanggal: effectiveTanggal, dari: effectiveDari, sampai: effectiveSampai })
  const list: BarangKeluar[] = data?.data ?? []
  const meta = data?.meta

  const { data: allData, isError: gagalAll, refetch: muatUlangAll } = useBarangKeluarList({ semua: true })
  const allList: BarangKeluar[] = useMemo(() => allData?.data ?? [], [allData])
  // Data ringkasan gagal dimuat tidak boleh terbaca sebagai 0: angka jadi "-".
  const ringkasanLoading = !allData && !gagalAll
  // Riwayat lebih banyak dari yang dimuat (batas backend 20.000 baris): angka dan grafik terpotong, jadi diberi tahu.
  const terpotong = !!allData?.meta && allList.length < allData.meta.total
  const angka = (n: number) => (gagalAll ? null : n)

  const bulanIni = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  const isThisMonth = (s: string | null | undefined) => {
    if (!s) return false
    const d = new Date(s)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }
  // "Transaksi" = satu pencatatan (satu keranjang), sama dengan tampilan Per transaksi; "catatan obat" = satu baris per obat.
  const semuaTransaksi = kelompokkanPerTransaksi(allList)
  const transaksiHariIni = semuaTransaksi.filter((k) => toLocalYMD(k.tanggal) === today).length
  const transaksiBulanIni = semuaTransaksi.filter((k) => isThisMonth(k.tanggal)).length
  const catatanHariIni = allList.filter((item) => toLocalYMD(item.tanggal) === today).length
  // Penjualan dalam rupiah. Retur, rusak, kedaluarsa, dan lainnya bukan pendapatan; penjualan tanpa harga jual
  // tidak bisa dijumlahkan dan disebut terpisah.
  const penjualanHariIni = allList.filter((item) => toLocalYMD(item.tanggal) === today && item.keterangan === 'Penjualan')
  const pendapatanHariIni = penjualanHariIni.reduce((sum, item) => sum + (nilaiPenjualan(item) ?? 0), 0)
  const hariIniTanpaHarga = penjualanHariIni.filter((item) => nilaiPenjualan(item) === null).length
  const penjualanBulanIni = allList.filter((item) => isThisMonth(item.tanggal) && item.keterangan === 'Penjualan')
  const pendapatanBulanIni = penjualanBulanIni.reduce((sum, item) => sum + (nilaiPenjualan(item) ?? 0), 0)
  const penjualanTanpaHarga = penjualanBulanIni.filter((item) => nilaiPenjualan(item) === null).length

  // Total penjualan mengikuti pencarian, keterangan, dan periode yang aktif, dihitung dari seluruh riwayat
  // (bukan dari baris di halaman ini) supaya tetap akurat bila hasilnya lebih dari satu halaman.
  const searchLower = search.trim().toLowerCase()
  const cocokFilter = (item: BarangKeluar) => {
    const matchSearch = !searchLower
      || item.nama_obat.toLowerCase().includes(searchLower)
      || item.kode_obat.toLowerCase().includes(searchLower)
    const tgl = toLocalYMD(item.tanggal)
    const matchTanggal = mingguan ? tgl >= tujuhHariLalu && tgl <= today : !date || tgl === date
    const matchKeterangan = !keterangan || item.keterangan === keterangan
    return matchSearch && matchTanggal && matchKeterangan
  }
  const filteredAllList = allList.filter(cocokFilter)
  // Tampilan Per transaksi: transaksi dipertahankan utuh bila ada satu barisnya yang cocok dengan pencarian atau tanggal,
  // supaya jumlah obat dan totalnya adalah total TRANSAKSI, bukan hanya baris yang cocok.
  const kelompok = perTransaksi ? kelompokkanPerTransaksi(allList).filter((k) => k.rows.some(cocokFilter)) : []
  const barisFilter = perTransaksi ? kelompok.flatMap((k) => k.rows) : filteredAllList
  const barisPenjualan = barisFilter.filter((item) => item.keterangan === 'Penjualan')
  const totalPenjualan = barisPenjualan.reduce((sum, item) => sum + (nilaiPenjualan(item) ?? 0), 0)
  const penjualanTanpaHargaFilter = barisPenjualan.filter((item) => nilaiPenjualan(item) === null).length

  const adaFilter = Boolean(search || keterangan || date || mingguan)
  const periode = mingguan ? '7-hari' : date === today ? 'hari-ini' : date ? 'tanggal' : 'semua'
  function aturUlangFilter() {
    setCari('')
    ubahParam({ q: null, keterangan: null, tanggal: null, rentang: null })
  }
  function cobaLagi() {
    refetch()
    muatUlangAll()
  }

  // Menutup dialog ubah yang isiannya sudah diubah meminta konfirmasi dulu (juga lewat Esc, X, dan klik di luar).
  function mintaTutupEdit() {
    if (kotorEdit) setBuangEdit(true)
    else setEditingItem(null)
  }
  function tutupEdit() { setEditingItem(null); setKotorEdit(false); setBuangEdit(false) }

  const pesanKosong = mingguan
    ? 'Belum ada stok keluar dalam 7 hari terakhir.'
    : date === today
      ? 'Belum ada stok keluar hari ini.'
      : date
        ? `Belum ada stok keluar pada ${formatTanggal(date)}.`
        : 'Ubah kata kunci atau longgarkan filter untuk melihat catatan lain.'

  const tombolCatat = (
    <Button size="lg" className="h-10 rounded-xl px-4" onClick={() => setBukaTambah(true)}>
      <PackageMinus data-icon="inline-start" />
      Catat stok keluar
    </Button>
  )

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">

      {/* ── Kepala halaman ──────────────────────────────────────────────── */}
      <PageHeader
        className="col-span-12"
        actions={tombolCatat}
        actionsAlign="end"
        title="Stok keluar"
        description="Riwayat obat yang keluar karena dijual, diretur, rusak, atau kedaluarsa. Setiap catatan mengurangi stok; hanya penjualan yang dihitung sebagai pendapatan."
      />

      {/* ── Peringatan bila riwayat lebih banyak dari yang dimuat (batas 20.000 baris) ── */}
      {terpotong && (
        <p role="status" className="col-span-12 flex items-start gap-2 rounded-xl bg-warning-50 px-4 py-3 text-sm font-medium text-warning-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Ringkasan, grafik, dan tampilan Per transaksi hanya memuat {formatAngka(allList.length, 0)} catatan terbaru dari {formatAngka(allData?.meta?.total ?? 0, 0)}. Angkanya bisa lebih kecil dari sebenarnya.
        </p>
      )}

      {/* ── Ringkasan: empat ubin ringkas ───────────────────────────────── */}
      <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile compact icon={Package} label="Transaksi hari ini" value={angka(transaksiHariIni)} sublabel={`${catatanHariIni} catatan obat`} isLoading={ringkasanLoading} />
        <StatTile compact icon={CalendarDays} label="Transaksi bulan ini" value={angka(transaksiBulanIni)} sublabel={bulanIni} isLoading={ringkasanLoading} />
        <StatTile
          compact
          icon={Coins}
          label="Penjualan hari ini"
          value={null}
          teks={gagalAll ? '-' : rupiahUbin(pendapatanHariIni)}
          sublabel={gagalAll ? '' : hariIniTanpaHarga > 0 ? `${hariIniTanpaHarga} belum berharga` : penjualanHariIni.length === 0 ? 'belum ada penjualan' : `${penjualanHariIni.length} obat`}
          isLoading={ringkasanLoading}
        />
        <StatTile
          compact
          icon={Wallet}
          label="Penjualan bulan ini"
          value={null}
          teks={gagalAll ? '-' : rupiahUbin(pendapatanBulanIni)}
          sublabel={gagalAll ? '' : penjualanTanpaHarga > 0 ? `${penjualanTanpaHarga} belum berharga` : bulanIni}
          isLoading={ringkasanLoading}
        />
      </div>

      {/* ── Grafik: tren dan peringkat obat ─────────────────────────────── */}
      <BarangKeluarTrendChart
        className="col-span-12 lg:col-span-7"
        allList={allList}
        isLoading={ringkasanLoading}
        isError={gagalAll}
        onRetry={() => muatUlangAll()}
      />
      <BarangKeluarPerObatChart
        className="col-span-12 lg:col-span-5"
        allList={allList}
        isLoading={ringkasanLoading}
        isError={gagalAll}
        onRetry={() => muatUlangAll()}
      />

      {/* ── Riwayat stok keluar ─────────────────────────────────────────── */}
      <Panel title="Riwayat stok keluar" count={perTransaksi ? (ringkasanLoading || gagalAll ? undefined : kelompok.length) : meta?.total} className="col-span-12" bodyClassName="px-0 pb-0">
        {/* Satu baris: cari, keterangan, periode, tanggal */}
        <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
          <SearchField
            className="col-span-2 sm:col-span-1 sm:max-w-[18rem]"
            label="Cari stok keluar"
            placeholder="Cari nama atau kode obat"
            value={cari}
            onChange={setCari}
          />
          <Select value={keterangan || 'semua'} onValueChange={(v) => ubahParam({ keterangan: v === 'semua' ? null : v })}>
            <SelectTrigger className={`${FILTER_SELECT} sm:w-48`} aria-label="Filter keterangan">
              <SelectValue placeholder="Semua keterangan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua keterangan</SelectItem>
              {KETERANGAN_KELUAR.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={periode}
            onValueChange={(v) => {
              if (v === 'semua') ubahParam({ tanggal: null, rentang: null })
              else if (v === 'hari-ini') ubahParam({ tanggal: today, rentang: null })
              else if (v === '7-hari') ubahParam({ tanggal: null, rentang: '7' })
            }}
          >
            <SelectTrigger className={`${FILTER_SELECT} sm:w-48`} aria-label="Filter periode">
              <SelectValue placeholder="Semua waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua waktu</SelectItem>
              <SelectItem value="hari-ini">Hari ini</SelectItem>
              <SelectItem value="7-hari">7 hari terakhir</SelectItem>
              {periode === 'tanggal' && <SelectItem value="tanggal">Tanggal {formatTanggalPendek(date)}</SelectItem>}
            </SelectContent>
          </Select>
          <Input
            type="date"
            aria-label="Pilih tanggal stok keluar"
            value={date}
            onChange={(e) => ubahParam({ tanggal: e.target.value || null, rentang: null })}
            className="h-10 rounded-xl sm:w-44"
          />
          {adaFilter && (
            <Button type="button" variant="ghost" className="col-span-2 h-10 rounded-xl px-3 text-primary sm:col-span-1" onClick={aturUlangFilter}>
              Atur ulang
            </Button>
          )}
          <div className="col-span-2 sm:col-span-1 sm:ml-auto">
            <Segmented
              label="Tampilan riwayat"
              value={perTransaksi ? 'transaksi' : 'obat'}
              onChange={(v) => ubahParam({ tampil: v === 'transaksi' ? 'transaksi' : null })}
              options={[
                { value: 'obat', label: 'Per obat' },
                { value: 'transaksi', label: 'Per transaksi' },
              ]}
            />
          </div>
        </FilterBar>

        {perTransaksi ? (
          <BarangKeluarPerTransaksi
            kelompok={kelompok}
            isLoading={ringkasanLoading}
            isError={gagalAll}
            onRetry={() => muatUlangAll()}
            adaFilter={adaFilter}
            onAturUlang={aturUlangFilter}
            page={page}
            onPageChange={(p) => ubahParam({ hal: p > 1 ? String(p) : null }, { resetHalaman: false })}
            onBuka={setTransaksiDipilih}
            aksiKosong={tombolCatat}
          />
        ) : (
          <>
        <div aria-busy={isLoading}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`${KEPALA} pl-5`}>Tanggal</TableHead>
                <TableHead className={KEPALA}>Obat</TableHead>
                <TableHead className={`${KEPALA} text-right`}>Jumlah keluar</TableHead>
                <TableHead className={`${KEPALA} ${KOLOM.keterangan}`}>Keterangan</TableHead>
                <TableHead className={`${KEPALA} text-right ${KOLOM.total}`}>Total penjualan</TableHead>
                <TableHead className={`${KEPALA} text-right ${KOLOM.stok}`}>Stok berubah</TableHead>
                <TableHead className={`${KEPALA} ${KOLOM.oleh}`}>Dicatat oleh</TableHead>
                <TableHead className={`${KEPALA} pr-4 text-right`}>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : isError ? null : (
                list.map((item) => {
                  const nilai = nilaiPenjualan(item)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap py-3 pl-5 tabular-nums text-muted-foreground">
                        {formatTanggalPendek(item.tanggal)}
                      </TableCell>
                      <TableCell className="whitespace-normal py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="group block max-w-[11rem] rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[16rem]"
                        >
                          <span className="block break-words font-medium leading-tight text-foreground group-hover:text-primary">{item.nama_obat}</span>
                          <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{item.kode_obat}</span>
                        </button>
                        {/* Di layar sempit kolom Keterangan disembunyikan, jadi badge ikut di bawah nama */}
                        <span className="mt-1.5 block md:hidden"><BadgeKeterangan nilai={item.keterangan} /></span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-3 text-right tabular-nums">
                        <span className="font-semibold text-foreground"><span aria-hidden="true">−</span><span className="sr-only">minus </span>{formatAngka(item.jumlah, 0)}</span>
                        <span className="ml-1 text-xs text-muted-foreground">{item.satuan}</span>
                      </TableCell>
                      <TableCell className={`py-3 ${KOLOM.keterangan}`}>
                        <BadgeKeterangan nilai={item.keterangan} />
                      </TableCell>
                      <TableCell className={`whitespace-nowrap py-3 text-right tabular-nums ${KOLOM.total}`}>
                        {nilai !== null
                          ? formatRupiah(nilai)
                          : <span className="text-muted-foreground">-<span className="sr-only"> {item.keterangan === 'Penjualan' ? 'Harga jual belum diisi' : 'Bukan penjualan'}</span></span>}
                      </TableCell>
                      <TableCell className={`whitespace-nowrap py-3 text-right tabular-nums ${KOLOM.stok}`}>
                        <span className="text-muted-foreground">{formatAngka(item.stok_sebelum, 0)}</span>
                        <span className="mx-1 text-muted-foreground" aria-hidden="true">→</span>
                        <span className="sr-only"> menjadi </span>
                        <span className="font-medium text-foreground">{formatAngka(item.stok_sesudah, 0)}</span>
                      </TableCell>
                      <TableCell className={`py-3 ${KOLOM.oleh}`}>
                        {item.nama_user ? (
                          <>
                            <span className="block text-foreground">{item.nama_user}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">{item.role_user === 'admin' ? 'Admin' : 'Staf'}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">-<span className="sr-only"> Belum tersedia</span></span>
                        )}
                      </TableCell>
                      <TableCell className="py-1.5 pr-3">
                        <div className="flex justify-end gap-1">
                          {/* Nama obat sudah membuka rincian; tombol mata hanya untuk layar lebar, atau untuk staf yang tidak punya aksi lain */}
                          <IconAction label={`Lihat rincian ${item.nama_obat}`} className={isAdmin ? 'hidden lg:inline-flex' : undefined} onClick={() => setSelectedItem(item)}>
                            <Eye />
                          </IconAction>
                          {isAdmin && (
                            <>
                              <IconAction label={`Ubah stok keluar ${item.nama_obat}`} onClick={() => setEditingItem(item)}>
                                <Pencil />
                              </IconAction>
                              <ConfirmDialog
                                trigger={
                                  <IconAction label={`Hapus stok keluar ${item.nama_obat}`} className="text-destructive hover:text-destructive">
                                    <Trash2 />
                                  </IconAction>
                                }
                                title={`Hapus stok keluar ${item.nama_obat}?`}
                                description="Stok obat ditambah lagi sesuai jumlah di baris ini."
                                onConfirm={() => deleteMutation.mutate(item.id)}
                                loading={deleteMutation.isPending && deleteMutation.variables === item.id}
                              />
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {!isLoading && isError && (
            <StateMessage
              icon={TriangleAlert}
              title="Riwayat stok keluar belum bisa dimuat"
              description="Ini bukan berarti tidak ada stok keluar. Periksa koneksi, lalu coba lagi."
              action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={cobaLagi}>Coba lagi</Button>}
            />
          )}
          {!isLoading && !isError && list.length === 0 && (
            meta && meta.total > 0 ? (
              // Alamat memuat nomor halaman yang melewati halaman terakhir (mis. ?hal=99).
              <StateMessage
                icon={SearchX}
                title="Halaman ini tidak ada"
                description={`Hasilnya hanya sampai halaman ${meta.last_page}.`}
                action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={() => ubahParam({ hal: null }, { resetHalaman: false })}>Ke halaman pertama</Button>}
              />
            ) : adaFilter ? (
              <StateMessage
                icon={SearchX}
                title="Tidak ada stok keluar yang cocok"
                description={pesanKosong}
                action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={aturUlangFilter}>Atur ulang filter</Button>}
              />
            ) : (
              <StateMessage
                icon={PackageOpen}
                title="Belum ada stok keluar"
                description="Catat penjualan atau obat keluar pertama untuk mulai mengurangi stok."
                action={tombolCatat}
              />
            )
          )}
        </div>

        {/* Jumlah hasil diumumkan ke pembaca layar setiap filter berubah (juga bila hanya satu halaman) */}
        <p className="sr-only" role="status" aria-live="polite">
          {meta && !isLoading ? `${meta.total} catatan stok keluar ditemukan` : ''}
        </p>

        {meta && meta.last_page > 1 && (
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} perPage={BATAS_HALAMAN} noun="catatan obat" onPageChange={(p) => ubahParam({ hal: p > 1 ? String(p) : null }, { resetHalaman: false })} />
        )}
          </>
        )}

        {/* Total penjualan: hanya bila ada filter aktif dan hasilnya tidak kosong. Bila ringkasan gagal dimuat, tidak
            ditampilkan (bukan Rp 0). Hanya penjualan yang dijumlahkan. */}
        {adaFilter && !gagalAll && !ringkasanLoading && barisFilter.length > 0 && (
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {perTransaksi ? `Total ${kelompok.length} transaksi` : `Total ${filteredAllList.length} catatan obat`}
              {mingguan ? `, 7 hari terakhir (${formatTanggalPendek(tujuhHariLalu)} sampai ${formatTanggalPendek(today)})` : ''}
              {!mingguan && date ? `, tanggal ${formatTanggalPendek(date)}` : ''}
              {keterangan ? `, ${keterangan}` : ''}
              {search ? `, pencarian "${search}"` : ''}
            </p>
            {barisPenjualan.length > 0 ? (
              <dl>
                <dt className="text-sm text-muted-foreground">
                  Total penjualan
                  {penjualanTanpaHargaFilter > 0 && <span>, {penjualanTanpaHargaFilter} belum berharga</span>}
                </dt>
                <dd className="text-base font-semibold tabular-nums text-foreground">{formatRupiah(totalPenjualan)}</dd>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada penjualan pada hasil ini.</p>
            )}
          </div>
        )}
      </Panel>

      {/* ── Keterangan ───────────────────────────────────────────────────── */}
      <p className="col-span-12 px-1 text-sm text-muted-foreground">
        Total penjualan hanya menjumlahkan catatan berketerangan Penjualan, dari harga jual yang tercatat saat transaksi. Retur, rusak, kedaluarsa, dan lainnya tidak dihitung. Tanda &quot;-&quot; berarti tidak ada nilai penjualan.
      </p>

      {/* ── Dialog ───────────────────────────────────────────────────────── */}
      <BarangKeluarTambahDialog open={bukaTambah} onOpenChange={setBukaTambah} />

      <BarangKeluarDetailDialog item={selectedItem} onClose={() => setSelectedItem(null)} />
      <BarangKeluarTransaksiDialog transaksi={transaksiDipilih} onClose={() => setTransaksiDipilih(null)} />

      {/* Ubah stok keluar (khusus admin) */}
      <Dialog open={!!editingItem} onOpenChange={(o) => { if (!o) mintaTutupEdit() }}>
        <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-xl">
          <DialogHeader className="gap-1.5 pr-8">
            <DialogTitle className="text-lg font-semibold">Ubah stok keluar</DialogTitle>
            <DialogDescription>Perubahan jumlah ikut menyesuaikan stok obat.</DialogDescription>
          </DialogHeader>
          {editingItem && <BarangKeluarEditForm item={editingItem} onSuccess={tutupEdit} onBatal={mintaTutupEdit} onDirtyChange={setKotorEdit} />}
        </DialogContent>
      </Dialog>

      <KonfirmasiBuang open={buangEdit} onOpenChange={setBuangEdit} onBuang={tutupEdit} />
    </div>
  )
}
