'use client'

import { useMemo, useState } from 'react'
import { PackagePlus, ReceiptText, Wallet, Clock, Eye, Pencil, Trash2, Undo2, SearchX, PackageOpen, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import TabelSkeleton, { type KolomSkeleton } from '@/components/shared/TabelSkeleton'
import { useCariTertunda, useFilterUrl } from '@/components/shared/useFilterUrl'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { StatTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import PageHeader from '@/components/shared/PageHeader'
import { FilterBar, SearchField } from '@/components/shared/FilterBar'
import Pagination from '@/components/shared/Pagination'
import StateMessage from '@/components/shared/StateMessage'
import IconAction from '@/components/shared/IconAction'
import ExpiredCell from '@/components/shared/ExpiredCell'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import BarangMasukTambahDialog from '@/components/transaksi/BarangMasukTambahDialog'
import BarangMasukEditForm from '@/components/transaksi/BarangMasukEditForm'
import BarangMasukDetailDialog from '@/components/transaksi/BarangMasukDetailDialog'
import BarangMasukPerFaktur from '@/components/transaksi/BarangMasukPerFaktur'
import BarangMasukFakturDialog from '@/components/transaksi/BarangMasukFakturDialog'
import Segmented from '@/components/shared/Segmented'
import BarangMasukTrendChart from '@/components/transaksi/BarangMasukTrendChart'
import BarangMasukPerObatChart from '@/components/transaksi/BarangMasukPerObatChart'
import { useBarangMasukList, useDeleteBarangMasuk } from '@/hooks/useBarangMasuk'
import { useAuthStore } from '@/store/auth.store'
import { useNow } from '@/hooks/useNow'
import { isRiwayatFaktur, kelompokkanPerFaktur, type KelompokFaktur } from '@/lib/barangMasuk'
import { Badge } from '@/components/ui/badge'
import { formatAngka, formatRupiah, formatTanggal, formatTanggalPendek } from '@/lib/utils'
import { rupiahUbin } from '@/lib/barangKeluar'
import type { BarangMasuk } from '@/types/obat'

const KEPALA = 'h-10 text-xs font-medium text-muted-foreground'
const BATAS_HALAMAN = 10
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const FORMAT_TANGGAL = /^\d{4}-\d{2}-\d{2}$/

// Kolom tampil bertahap menurut lebar konten (bukan lebar layar): sidebar 256px muncul mulai lg, jadi konten
// di lg sama sempitnya dengan di md. Selalu: Tanggal, Obat, Jumlah, Aksi. md: Supplier. xl: Batch dan expired.
// 2xl: Perubahan stok (Subtotal mulai xl supaya harga terlihat di laptop 1366px).
const KOLOM = {
  supplier: 'hidden md:table-cell',
  batch: 'hidden xl:table-cell',
  stok: 'hidden 2xl:table-cell',
  subtotal: 'hidden xl:table-cell',
}

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const toLocalYMD = (s: string | null | undefined) => (s ? ymd(new Date(s)) : '')

const KOLOM_SKELETON: KolomSkeleton[] = [
  { garis: ['w-20'] },
  { garis: ['w-40', 'w-20'] },
  { garis: ['w-16'], kanan: true },
  { garis: ['w-28', 'w-20'], kelas: KOLOM.supplier },
  { garis: ['w-20', 'w-16'], kelas: KOLOM.batch },
  { garis: ['w-16'], kanan: true, kelas: KOLOM.stok },
  { garis: ['w-20'], kanan: true, kelas: KOLOM.subtotal },
  { garis: ['w-20'], bentuk: 'tombol' },
]

export default function BarangMasukTable() {
  const now = useNow()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const deleteMutation = useDeleteBarangMasuk()

  // Pencarian, periode, dan halaman disimpan di URL (?q=&tanggal=&rentang=7&hal=) supaya tidak hilang
  // saat halaman dimuat ulang dan bisa dibagikan sebagai tautan. Nilai yang tidak dikenal diabaikan.
  const { sp, ubahParam } = useFilterUrl()
  const search = sp.get('q') ?? ''
  const mingguan = sp.get('rentang') === '7'
  const tanggalUrl = sp.get('tanggal') ?? ''
  const date = !mingguan && FORMAT_TANGGAL.test(tanggalUrl) && !Number.isNaN(new Date(tanggalUrl).getTime()) ? tanggalUrl : ''
  const page = Math.max(1, parseInt(sp.get('hal') ?? '1', 10) || 1)
  // Tampilan riwayat: per obat (bawaan, satu baris per catatan) atau per faktur (?tampil=faktur).
  const perFaktur = sp.get('tampil') === 'faktur'

  // Kolom cari memakai state lokal supaya ketikan tidak tertinggal; ke URL (dan ke API) setelah jeda 300 ms.
  const [cari, setCari] = useCariTertunda(search, ubahParam)

  const [bukaTambah, setBukaTambah] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BarangMasuk | null>(null)
  const [fakturDipilih, setFakturDipilih] = useState<KelompokFaktur | null>(null)
  const [editingItem, setEditingItem] = useState<BarangMasuk | null>(null)
  const [kotorEdit, setKotorEdit] = useState(false)
  // Konfirmasi membuang perubahan di dialog ubah (dialog tambah mengurus konfirmasinya sendiri).
  const [buangEdit, setBuangEdit] = useState(false)

  const today = ymd(now)
  const tujuhHariLalu = (() => { const d = new Date(now); d.setDate(d.getDate() - 6); return ymd(d) })()

  // Tombol "7 hari terakhir" aktif → rentang 7 hari. Selain itu, tanggal tunggal bebas bila diisi.
  const effectiveDari = mingguan ? tujuhHariLalu : undefined
  const effectiveSampai = mingguan ? today : undefined
  const effectiveTanggal = !mingguan ? (date || undefined) : undefined

  const { data, isLoading, isError, refetch } = useBarangMasukList({ page, limit: BATAS_HALAMAN, search, tanggal: effectiveTanggal, dari: effectiveDari, sampai: effectiveSampai })
  const list: BarangMasuk[] = data?.data ?? []
  const meta = data?.meta

  const { data: allData, isError: gagalAll, refetch: muatUlangAll } = useBarangMasukList({ semua: true })
  const allList: BarangMasuk[] = useMemo(() => allData?.data ?? [], [allData])
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
  // Pembelian bulan ini: jumlah satuan x harga beli sesudah PPN. Baris tanpa harga beli tidak bisa dijumlahkan dan disebut terpisah.
  const barisBulanIni = allList.filter((item) => isThisMonth(item.tanggal))
  const pembelianBulanIni = barisBulanIni.reduce((sum, item) => sum + (item.harga_beli != null ? item.harga_beli * item.jumlah_satuan : 0), 0)
  const pembelianTanpaHarga = barisBulanIni.filter((item) => item.harga_beli == null).length
  const fakturBulanIni = kelompokkanPerFaktur(allList).filter((g) => isThisMonth(g.tanggal))
  const jenisObatBulanIni = new Set(barisBulanIni.map((item) => item.kode_obat)).size

  const terakhir = allList[0]
  const selisihHari = terakhir?.tanggal
    ? Math.round((new Date(today).getTime() - new Date(toLocalYMD(terakhir.tanggal)).getTime()) / 86400000)
    : null
  const terakhirTeks =
    selisihHari === null ? '-' :
    selisihHari <= 0 ? 'Hari ini' :
    selisihHari === 1 ? 'Kemarin' :
    `${selisihHari} hari lalu`

  // Total pengeluaran mengikuti pencarian dan periode yang aktif, dihitung dari seluruh riwayat
  // (bukan dari baris di halaman ini) supaya tetap akurat bila hasilnya lebih dari satu halaman.
  const searchLower = search.trim().toLowerCase()
  const cocokFilter = (item: BarangMasuk) => {
    const matchSearch = !searchLower
      || item.nama_obat.toLowerCase().includes(searchLower)
      || item.kode_obat.toLowerCase().includes(searchLower)
      || (item.no_faktur ?? '').toLowerCase().includes(searchLower)
      || (item.no_batch ?? '').toLowerCase().includes(searchLower)
      || (item.nama_supplier ?? '').toLowerCase().includes(searchLower)
    const tgl = toLocalYMD(item.tanggal)
    const matchTanggal = mingguan
      ? tgl >= tujuhHariLalu && tgl <= today
      : !date || tgl === date
    return matchSearch && matchTanggal
  }
  const filteredAllList = allList.filter(cocokFilter)
  // Tampilan Per faktur: faktur dipertahankan utuh bila ada satu barisnya yang cocok dengan pencarian atau tanggal,
  // supaya jumlah obat dan totalnya adalah total FAKTUR, bukan hanya baris yang cocok (dicocokkan dengan faktur kertas).
  const kelompok = perFaktur ? kelompokkanPerFaktur(allList).filter((k) => k.rows.some(cocokFilter)) : []
  const barisTotal = perFaktur ? kelompok.flatMap((k) => k.rows) : filteredAllList
  const totalSesudahPPN = barisTotal.reduce(
    (sum, item) => sum + (item.harga_beli != null ? item.harga_beli * item.jumlah_satuan : 0),
    0
  )
  const totalSebelumPPN = barisTotal.reduce((sum, item) => {
    if (item.harga_beli == null) return sum
    const ppnPct = Number(item.ppn_pct) || 0
    return sum + (item.harga_beli / (1 + ppnPct / 100)) * item.jumlah_satuan
  }, 0)

  const adaFilter = Boolean(search || date || mingguan)
  const periode = mingguan ? '7-hari' : date === today ? 'hari-ini' : date ? 'tanggal' : 'semua'
  function aturUlangFilter() {
    setCari('')
    ubahParam({ q: null, tanggal: null, rentang: null })
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
    ? 'Belum ada stok masuk dalam 7 hari terakhir.'
    : date === today
      ? 'Belum ada stok masuk hari ini.'
      : date
        ? `Belum ada stok masuk pada ${formatTanggal(date)}.`
        : 'Ubah kata kunci atau longgarkan filter untuk melihat catatan lain.'

  const tombolCatat = (
    <Button size="lg" className="h-10 rounded-xl px-4" onClick={() => setBukaTambah(true)}>
      <PackagePlus data-icon="inline-start" />
      Catat stok masuk
    </Button>
  )

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">

      {/* ── Kepala halaman ──────────────────────────────────────────────── */}
      <PageHeader
        className="col-span-12"
        actions={tombolCatat}
        actionsAlign="end"
        title="Stok masuk"
        description="Riwayat obat yang diterima dari supplier. Setiap catatan menambah stok dan menyimpan batch serta tanggal expired-nya."
      />

      {/* ── Peringatan bila riwayat lebih banyak dari yang dimuat (batas 20.000 baris) ── */}
      {terpotong && (
        <p role="status" className="col-span-12 flex items-start gap-2 rounded-xl bg-warning-50 px-4 py-3 text-sm font-medium text-warning-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {isAdmin ? 'Ringkasan, grafik, dan tampilan Per faktur' : 'Ringkasan dan tampilan Per faktur'} hanya memuat {formatAngka(allList.length, 0)} catatan terbaru dari {formatAngka(allData?.meta?.total ?? 0, 0)}. Angkanya bisa lebih kecil dari sebenarnya.
        </p>
      )}

      {/* ── Ringkasan: tiga ubin ringkas ────────────────────────────────── */}
      <div className={`col-span-12 grid grid-cols-1 gap-4 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {/* Uang khusus admin: staf tidak melihat ubin pembelian (backend juga tidak mengirim harga). */}
        {isAdmin && (
        <StatTile
          compact
          icon={Wallet}
          label="Pembelian bulan ini"
          value={null}
          teks={gagalAll ? '-' : rupiahUbin(pembelianBulanIni)}
          sublabel={gagalAll ? '' : pembelianTanpaHarga > 0 ? `${pembelianTanpaHarga} belum berharga` : `${bulanIni}, sesudah PPN`}
          isLoading={ringkasanLoading}
        />
        )}
        <StatTile compact icon={ReceiptText} label="Faktur bulan ini" value={angka(fakturBulanIni.length)} sublabel={`${jenisObatBulanIni} jenis obat`} isLoading={ringkasanLoading} />
        <StatTile
          compact
          icon={Clock}
          label="Terakhir masuk"
          value={null}
          teks={gagalAll ? '-' : terakhirTeks}
          sublabel={gagalAll || !terakhir?.tanggal ? '' : formatTanggalPendek(terakhir.tanggal)}
          isLoading={ringkasanLoading}
        />
      </div>

      {/* ── Grafik: tren dan peringkat obat ─────────────────────────────── */}
      {/* Tren dan peringkat adalah analisis, bukan kerja harian staf: hanya admin. */}
      {isAdmin && (
        <>
        <BarangMasukTrendChart
          className="col-span-12 lg:col-span-7"
          allList={allList}
          isLoading={ringkasanLoading}
          isError={gagalAll}
          onRetry={() => muatUlangAll()}
        />
        <BarangMasukPerObatChart
          className="col-span-12 lg:col-span-5"
          allList={allList}
          isLoading={ringkasanLoading}
          isError={gagalAll}
          onRetry={() => muatUlangAll()}
        />
        </>
      )}

      {/* ── Riwayat stok masuk ──────────────────────────────────────────── */}
      <Panel
        title="Riwayat stok masuk"
        count={perFaktur ? (ringkasanLoading || gagalAll ? undefined : kelompok.length) : meta?.total}
        className="col-span-12"
        bodyClassName="px-0 pb-0"
      >
        {/* Satu baris: cari, periode, tanggal, lalu pilihan tampilan (Per obat / Per faktur) di kanan */}
        <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
          <SearchField
            className="col-span-2 sm:col-span-1 sm:max-w-[20rem]"
            label="Cari stok masuk"
            placeholder="Cari obat, kode, faktur, batch, atau supplier"
            value={cari}
            onChange={setCari}
          />
          <PilihanCombobox
            aria-label="Filter periode"
            className="sm:w-48"
            value={periode}
            onChange={(v) => {
              if (v === 'semua') ubahParam({ tanggal: null, rentang: null })
              else if (v === 'hari-ini') ubahParam({ tanggal: today, rentang: null })
              else if (v === '7-hari') ubahParam({ tanggal: null, rentang: '7' })
            }}
            options={[
              { value: 'semua', label: 'Semua waktu' },
              { value: 'hari-ini', label: 'Hari ini' },
              { value: '7-hari', label: '7 hari terakhir' },
              ...(periode === 'tanggal' ? [{ value: 'tanggal', label: `Tanggal ${formatTanggalPendek(date)}` }] : []),
            ]}
            noun="periode"
          />
          <Input
            type="date"
            aria-label="Pilih tanggal stok masuk"
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
              value={perFaktur ? 'faktur' : 'obat'}
              onChange={(v) => ubahParam({ tampil: v === 'faktur' ? 'faktur' : null })}
              options={[
                { value: 'obat', label: 'Per obat' },
                { value: 'faktur', label: 'Per faktur' },
              ]}
            />
          </div>
        </FilterBar>

        {perFaktur ? (
          <BarangMasukPerFaktur
            kelompok={kelompok}
            isLoading={ringkasanLoading}
            isError={gagalAll}
            onRetry={() => muatUlangAll()}
            adaFilter={adaFilter}
            onAturUlang={aturUlangFilter}
            page={page}
            onPageChange={(p) => ubahParam({ hal: p > 1 ? String(p) : null }, { resetHalaman: false })}
            onBuka={setFakturDipilih}
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
                <TableHead className={`${KEPALA} text-right`}>Jumlah masuk</TableHead>
                <TableHead className={`${KEPALA} ${KOLOM.supplier}`}>Supplier dan faktur</TableHead>
                <TableHead className={`${KEPALA} ${KOLOM.batch}`}>Batch dan expired</TableHead>
                <TableHead className={`${KEPALA} text-right ${KOLOM.stok}`}>Stok berubah</TableHead>
                {isAdmin && (
                  <TableHead className={`${KEPALA} text-right ${KOLOM.subtotal}`}>
                    <span className="block leading-tight">Subtotal<span className="block font-normal">sebelum PPN</span></span>
                  </TableHead>
                )}
                <TableHead className={`${KEPALA} pr-4 text-right`}>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TabelSkeleton kolom={isAdmin ? KOLOM_SKELETON : KOLOM_SKELETON.filter((k) => k.kelas !== KOLOM.subtotal)} baris={BATAS_HALAMAN} />
              ) : isError ? null : (
                list.map((item) => (
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
                      {isRiwayatFaktur(item) && <Badge variant="secondary" className="mt-1.5">Riwayat faktur, stok tidak berubah</Badge>}
                      {/* Di layar sempit kolom Supplier disembunyikan, jadi ikut di bawah nama */}
                      {item.nama_supplier && <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">{item.nama_supplier}</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-3 text-right tabular-nums">
                      <span className="font-semibold text-foreground">{isRiwayatFaktur(item) ? '' : '+'}{formatAngka(item.jumlah_satuan, 0)}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{item.satuan}</span>
                      <span className="block text-xs text-muted-foreground">{formatAngka(Number(item.jumlah_dus), 2)} dus</span>
                    </TableCell>
                    <TableCell className={`py-3 ${KOLOM.supplier}`}>
                      <span className="block text-foreground">{item.nama_supplier ?? <span className="text-muted-foreground">-<span className="sr-only"> Belum diisi</span></span>}</span>
                      <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{item.no_faktur ?? '-'}</span>
                    </TableCell>
                    <TableCell className={`py-3 tabular-nums ${KOLOM.batch}`}>
                      <span className="block font-mono text-xs text-muted-foreground">{item.no_batch ?? '-'}</span>
                      <span className="mt-0.5 block"><ExpiredCell tanggal={item.expired_batch} /></span>
                    </TableCell>
                    <TableCell className={`whitespace-nowrap py-3 text-right tabular-nums ${KOLOM.stok}`}>
                      {isRiwayatFaktur(item) ? (
                        <span className="text-muted-foreground">tidak berubah</span>
                      ) : (
                        <>
                          <span className="text-muted-foreground">{formatAngka(item.stok_sebelum, 0)}</span>
                          <span className="mx-1 text-muted-foreground" aria-hidden="true">→</span>
                          <span className="sr-only"> menjadi </span>
                          <span className="font-medium text-foreground">{formatAngka(item.stok_sesudah, 0)}</span>
                        </>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className={`whitespace-nowrap py-3 text-right tabular-nums ${KOLOM.subtotal}`}>
                        {item.harga_beli != null
                          ? formatRupiah((item.harga_beli / (1 + (Number(item.ppn_pct) || 0) / 100)) * item.jumlah_satuan)
                          : <span className="text-muted-foreground">-<span className="sr-only"> Harga belum diisi</span></span>}
                      </TableCell>
                    )}
                    <TableCell className="py-1.5 pr-3">
                      <div className="flex justify-end gap-1">
                        {/* Nama obat sudah membuka rincian; tombol mata hanya untuk layar lebar, atau untuk staf yang tidak punya aksi lain */}
                        <IconAction label={`Lihat rincian ${item.nama_obat}`} className={isAdmin ? 'hidden lg:inline-flex' : undefined} onClick={() => setSelectedItem(item)}>
                          <Eye />
                        </IconAction>
                        {isAdmin && (
                          <>
                            {/* Baris riwayat faktur tidak bisa diubah (ditolak backend); hapus lalu catat ulang bila datanya salah */}
                            {!isRiwayatFaktur(item) && (
                              <IconAction label={`Ubah stok masuk ${item.nama_obat}`} onClick={() => setEditingItem(item)}>
                                <Pencil />
                              </IconAction>
                            )}
                            <ConfirmDialog
                              trigger={
                                <IconAction label={`Hapus stok masuk ${item.nama_obat}`} className="text-destructive hover:text-destructive">
                                  <Trash2 />
                                </IconAction>
                              }
                              title={`Hapus stok masuk ${item.nama_obat}?`}
                              description={isRiwayatFaktur(item)
                                ? 'Baris ini hanya riwayat faktur. Menghapusnya tidak mengubah stok obat.'
                                : 'Stok obat dikurangi sesuai jumlah di baris ini. Ditolak otomatis bila hasilnya membuat stok minus, tanda sebagian sudah terjual.'}
                              onConfirm={() => deleteMutation.mutate(item.id)}
                              loading={deleteMutation.isPending && deleteMutation.variables === item.id}
                            />
                          </>
                        )}
                        {/* Staf: hanya catatan buatannya sendiri yang masih dalam batas waktu (ditentukan backend, 10 menit). */}
                        {!isAdmin && item.bisa_dibatalkan && (
                          <ConfirmDialog
                            trigger={
                              <IconAction label={`Batalkan stok masuk ${item.nama_obat}`}>
                                <Undo2 />
                              </IconAction>
                            }
                            title={`Batalkan stok masuk ${item.nama_obat}?`}
                            description="Stok obat dikurangi lagi sesuai jumlah di baris ini. Pembatalan hanya bisa dalam 10 menit setelah dicatat, dan hanya untuk catatan yang Anda buat sendiri."
                            confirmLabel="Batalkan catatan"
                            loadingLabel="Membatalkan..."
                            onConfirm={() => deleteMutation.mutate(item.id)}
                            loading={deleteMutation.isPending && deleteMutation.variables === item.id}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!isLoading && isError && (
            <StateMessage
              icon={TriangleAlert}
              title="Riwayat stok masuk belum bisa dimuat"
              description="Ini bukan berarti tidak ada stok masuk. Periksa koneksi, lalu coba lagi."
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
                title="Tidak ada stok masuk yang cocok"
                description={pesanKosong}
                action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={aturUlangFilter}>Atur ulang filter</Button>}
              />
            ) : (
              <StateMessage
                icon={PackageOpen}
                title="Belum ada stok masuk"
                description="Catat faktur pertama dari supplier untuk mulai menambah stok."
                action={tombolCatat}
              />
            )
          )}
        </div>

        {/* Jumlah hasil diumumkan ke pembaca layar setiap filter berubah (juga bila hanya satu halaman) */}
        <p className="sr-only" role="status" aria-live="polite">
          {meta && !isLoading ? `${meta.total} catatan stok masuk ditemukan` : ''}
        </p>

        {meta && meta.last_page > 1 && (
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} perPage={BATAS_HALAMAN} noun="transaksi" onPageChange={(p) => ubahParam({ hal: p > 1 ? String(p) : null }, { resetHalaman: false })} />
        )}
          </>
        )}

        {/* Total pengeluaran: hanya bila ada filter aktif dan hasilnya tidak kosong. Bila ringkasan gagal dimuat, tidak ditampilkan (bukan Rp 0). */}
        {isAdmin && adaFilter && !gagalAll && !ringkasanLoading && barisTotal.length > 0 && (
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {perFaktur ? `Total ${kelompok.length} faktur` : `Total ${filteredAllList.length} transaksi`}
              {mingguan ? `, 7 hari terakhir (${formatTanggalPendek(tujuhHariLalu)} sampai ${formatTanggalPendek(today)})` : ''}
              {!mingguan && date ? `, tanggal ${formatTanggalPendek(date)}` : ''}
              {search ? `, pencarian "${search}"` : ''}
            </p>
            <dl className="flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Pengeluaran sebelum PPN</dt>
                <dd className="text-base font-medium tabular-nums text-foreground">{formatRupiah(totalSebelumPPN)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Pengeluaran sesudah PPN</dt>
                <dd className="text-base font-semibold tabular-nums text-foreground">{formatRupiah(totalSesudahPPN)}</dd>
              </div>
            </dl>
          </div>
        )}
      </Panel>

      {/* ── Keterangan warna ─────────────────────────────────────────────── */}
      <p className="col-span-12 px-1 text-sm text-muted-foreground">
        Tanggal expired merah dengan tanda segitiga: kurang dari 3 bulan lagi atau sudah lewat. Oranye: 3 sampai 6 bulan. {isAdmin && 'Subtotal dihitung dari harga beli sebelum PPN. '}{!isAdmin && 'Harga dan subtotal hanya terlihat oleh admin. Tombol Batalkan muncul 10 menit untuk catatan yang Anda buat sendiri. '}Tanda jatuh tempo hanya membaca tanggal; aplikasi belum mencatat apakah faktur sudah dibayar. Tanda &quot;-&quot; berarti data belum diisi.
      </p>

      {/* ── Dialog ───────────────────────────────────────────────────────── */}
      <BarangMasukTambahDialog open={bukaTambah} onOpenChange={setBukaTambah} />

      <BarangMasukDetailDialog item={selectedItem} onClose={() => setSelectedItem(null)} />
      <BarangMasukFakturDialog faktur={fakturDipilih} onClose={() => setFakturDipilih(null)} />

      {/* Ubah stok masuk (khusus admin) */}
      <Dialog open={!!editingItem} onOpenChange={(o) => { if (!o) mintaTutupEdit() }}>
        <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-2xl">
          <DialogHeader className="gap-1.5 pr-8">
            <DialogTitle className="text-lg font-semibold">Ubah stok masuk</DialogTitle>
            <DialogDescription>Perubahan jumlah ikut menyesuaikan stok obat.</DialogDescription>
          </DialogHeader>
          {editingItem && <BarangMasukEditForm item={editingItem} onSuccess={tutupEdit} onBatal={mintaTutupEdit} onDirtyChange={setKotorEdit} />}
        </DialogContent>
      </Dialog>

      <KonfirmasiBuang open={buangEdit} onOpenChange={setBuangEdit} onBuang={tutupEdit} />
    </div>
  )
}
