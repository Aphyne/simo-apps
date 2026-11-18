'use client'

import Link from 'next/link'
import { Pencil, Trash2, Plus, Eye, CalendarX, SearchX, PackageOpen, TriangleAlert, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import Istilah from '@/components/shared/Istilah'
import TabelSkeleton, { type KolomSkeleton } from '@/components/shared/TabelSkeleton'
import { useCariTertunda, useFilterUrl } from '@/components/shared/useFilterUrl'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatTile, ReorderTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import PageHeader from '@/components/shared/PageHeader'
import { FilterBar, SearchField } from '@/components/shared/FilterBar'
import Pagination from '@/components/shared/Pagination'
import StateMessage from '@/components/shared/StateMessage'
import { denganAsal } from '@/components/shared/useAsalHalaman'
import IconAction from '@/components/shared/IconAction'
import ExpiredCell from '@/components/shared/ExpiredCell'
import StatusBadge from '@/components/ui/StatusBadge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useObatList, useObatSemua, useDeleteObat } from '@/hooks/useObat'
import { useAuthStore } from '@/store/auth.store'
import { cn, formatAngka } from '@/lib/utils'
import { useNow } from '@/hooks/useNow'
import { KATEGORI_OBAT } from '@/lib/constants'
import KategoriDonut from '@/components/obat/KategoriDonut'
import StatusStokBar from '@/components/obat/StatusStokBar'
import type { Obat } from '@/types/obat'

const KEPALA = 'h-10 text-xs font-medium text-muted-foreground'
const BATAS_HALAMAN = 10

// ─── Sel: estimasi hari habis ────────────────────────────────────────────────
// Merah/oranye hanya untuk stok yang akan segera habis, dan selalu disertai angka hari.
// Tingkat mendesak ditandai dengan ikon peringatan (bentuk), bukan hanya warna; oranye tanpa ikon.
function EstimasiHabis({ hari }: { hari: number | null }) {
  if (hari === null) return <span className="text-muted-foreground">-<span className="sr-only"> Belum tersedia</span></span>
  if (hari <= 7)
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-danger-700">
        <TriangleAlert className="size-3.5" aria-hidden="true" />
        {hari} hari
        <span className="sr-only">, segera habis</span>
      </span>
    )
  if (hari <= 30)
    return (
      <span className="font-medium text-warning-700">
        {hari} hari
        <span className="sr-only">, habis dalam sebulan</span>
      </span>
    )
  return <span className="text-muted-foreground">{hari} hari</span>
}

// ─── Sel: nilai kalkulasi (ROP, EOQ) ─────────────────────────────────────────
// Nilai kosong atau 0 berarti belum bisa dihitung (mis. belum ada riwayat penjualan), bukan "titik pesan di 0":
// ditulis "-". Nilai yang ada ditampilkan 2 desimal persis (kebijakan pembulatan: tidak dibulatkan di tampilan).
function KalkulasiCell({ value, satuan }: { value: number | null | undefined; satuan?: string }) {
  if (value === null || value === undefined || !(Number(value) > 0)) return <span className="text-muted-foreground">-<span className="sr-only"> Belum dihitung</span></span>
  return (
    <span className="text-foreground">
      {formatAngka(Number(value), 2)}
      {satuan && <span className="ml-1 text-xs text-muted-foreground">{satuan}</span>}
    </span>
  )
}

// Kolom tampil bertahap menurut lebar konten (bukan lebar layar): sidebar 256px muncul mulai lg,
// jadi konten di lg sama sempitnya dengan di md. Selalu: Obat, Stok, Aksi (Status mulai md).
// xl (konten sekitar 960px): + ROP, Est. habis, Expired. 2xl: + Kategori, EOQ.
const KOLOM = {
  status: 'hidden md:table-cell',
  rop: 'hidden xl:table-cell',
  estHabis: 'hidden xl:table-cell',
  expired: 'hidden xl:table-cell',
  kategori: 'hidden 2xl:table-cell',
  eoq: 'hidden 2xl:table-cell',
}

// Urutan dilakukan backend (daftar putih): nama, stok, estimasi (hari habis), expired.
type Urutan = 'nama' | 'stok' | 'estimasi' | 'expired'
const URUTAN_VALID: Urutan[] = ['nama', 'stok', 'estimasi', 'expired']
const STATUS_VALID = ['AMAN', 'MENDEKATI_ROP', 'HARUS_REORDER']
const EXPIRED_VALID = ['akan', 'lewat']

// Kepala kolom yang bisa diurut: tombol dengan ikon panah dan aria-sort pada selnya.
// Klik pertama menaik, kedua menurun, ketiga kembali ke urutan bawaan (nama A-Z).
function KepalaUrut({
  label, kunci, urutan, arah, onUrut, className,
}: { label: string; kunci: Urutan; urutan: string; arah: 'asc' | 'desc'; onUrut: (k: Urutan) => void; className?: string }) {
  const bawaan = kunci === 'nama' && urutan === ''
  const aktif = urutan === kunci || bawaan
  const turun = urutan === kunci && arah === 'desc'
  const Ikon = !aktif ? ChevronsUpDown : turun ? ChevronDown : ChevronUp
  return (
    <TableHead aria-sort={aktif ? (turun ? 'descending' : 'ascending') : 'none'} className={cn(KEPALA, className)}>
      <button
        type="button"
        onClick={() => onUrut(kunci)}
        aria-label={`Urutkan menurut ${label}`}
        className={cn('-mx-1 inline-flex h-8 items-center gap-1 rounded-md px-1 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring', aktif && 'text-foreground')}
      >
        {label}
        <Ikon className="size-3.5" aria-hidden="true" />
      </button>
    </TableHead>
  )
}

const KOLOM_SKELETON: KolomSkeleton[] = [
  { garis: ['w-40', 'w-20'] },
  { garis: ['w-20'], kelas: KOLOM.kategori },
  { garis: ['w-16'], kanan: true },
  { garis: ['w-14'], kanan: true, kelas: KOLOM.rop },
  { garis: ['w-14'], kanan: true, kelas: KOLOM.eoq },
  { garis: ['w-14'], kanan: true, kelas: KOLOM.estHabis },
  { garis: ['w-16'], kelas: KOLOM.expired },
  { garis: ['w-24'], bentuk: 'badge', kelas: KOLOM.status },
  { garis: ['w-20'], bentuk: 'tombol' },
]

export default function ObatTable() {
  const sekarang = useNow().getTime()
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  // Filter, urutan, dan halaman disimpan di URL (?q=&kategori=&status=&expired=&urut=&arah=&hal=)
  // supaya tidak hilang saat kembali dari halaman detail dan bisa dibagikan sebagai tautan.
  const { sp, pathname, ubahParam } = useFilterUrl()
  const search = sp.get('q') ?? ''
  const kategori = sp.get('kategori') ?? ''
  const statusUrl = sp.get('status') ?? ''
  const status = STATUS_VALID.includes(statusUrl) ? statusUrl : ''
  const expiredUrl = sp.get('expired') ?? ''
  const expired = EXPIRED_VALID.includes(expiredUrl) ? expiredUrl : ''
  const urutUrl = sp.get('urut') ?? ''
  const urutan = URUTAN_VALID.includes(urutUrl as Urutan) ? urutUrl : ''
  const arah: 'asc' | 'desc' = sp.get('arah') === 'desc' ? 'desc' : 'asc'
  const page = Math.max(1, parseInt(sp.get('hal') ?? '1', 10) || 1)

  // Kolom cari memakai state lokal supaya ketikan tidak tertinggal; ke URL (dan ke API) setelah jeda 300 ms.
  const [cari, setCari] = useCariTertunda(search, ubahParam)

  function urutPer(kunci: Urutan) {
    if (urutan !== kunci) ubahParam({ urut: kunci, arah: 'asc' })
    else if (arah === 'asc') ubahParam({ urut: kunci, arah: 'desc' })
    else ubahParam({ urut: null, arah: null })
  }

  const { data, isLoading, isError, refetch } = useObatList({
    page,
    limit: BATAS_HALAMAN,
    search,
    kategori,
    status,
    expired,
    sort: urutan || undefined,
    arah: urutan ? arah : undefined,
  })
  const { data: dataAll, isError: gagalAll, refetch: muatUlangAll } = useObatSemua()
  const deleteMutation = useDeleteObat()

  const obatList: Obat[] = data?.data ?? []
  const meta = data?.meta

  const allObat: Obat[] = dataAll?.data ?? []
  const totalObat = dataAll?.meta?.total ?? 0
  const perluReorder = allObat.filter((o) => o.status === 'HARUS_REORDER').length
  // Yang sudah lewat tanggal tidak termasuk hitungan "akan expired", tetapi ditulis terpisah di keterangan ubin.
  const sudahExpired = allObat.filter((o) => {
    if (!o.expired_terdekat) return false
    return new Date(o.expired_terdekat).getTime() < sekarang
  }).length
  const stokHabis = allObat.filter((o) => o.stok <= 0).length
  const akanExpired = allObat.filter((o) => {
    if (!o.expired_terdekat) return false
    const selisih = Math.floor((new Date(o.expired_terdekat).getTime() - sekarang) / (1000 * 60 * 60 * 24))
    return selisih >= 0 && selisih <= 90
  }).length

  // Data ringkasan gagal dimuat tidak boleh terbaca sebagai 0: angka jadi "-".
  const ringkasanLoading = !dataAll && !gagalAll
  const angka = (n: number) => (gagalAll ? null : n)

  // Pilihan kategori: dari data (urut terbanyak, dengan jumlah). Bila data belum ada, pakai daftar baku tanpa jumlah.
  const jumlahPerKategori: Record<string, number> = {}
  allObat.forEach((o) => { jumlahPerKategori[o.kategori] = (jumlahPerKategori[o.kategori] ?? 0) + 1 })
  const kategoriOpsi: { nama: string; jumlah: number | null }[] =
    allObat.length > 0
      ? Object.entries(jumlahPerKategori)
          .map(([nama, jumlah]) => ({ nama, jumlah }))
          .sort((a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama))
      : KATEGORI_OBAT.map((nama) => ({ nama, jumlah: null }))

  // Alamat daftar saat ini (dengan filternya): dibawa tautan ke halaman Tambah dan Ubah agar tombol Kembali,
  // Batal, dan Simpan di sana membawa pengguna tepat ke sini.
  const alamatDaftar = sp.toString() ? `${pathname}?${sp.toString()}` : pathname

  const adaFilter = Boolean(search || kategori || status || expired)
  function aturUlangFilter() {
    setCari('')
    ubahParam({ q: null, kategori: null, status: null, expired: null })
  }
  function cobaLagi() {
    refetch()
    muatUlangAll()
  }

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">

      {/* ── Kepala halaman ──────────────────────────────────────────────── */}
      <PageHeader
        className="col-span-12"
        title="Data obat"
        description="Stok, titik pesan ulang, dan tanggal expired setiap obat di apotek."
      />

      {/* ── Ringkasan: satu baris ringkas, satu ubin biru untuk yang perlu dikerjakan ── */}
      <KategoriDonut
        className="col-span-12 md:col-span-6 lg:col-span-4"
        allObat={allObat}
        isLoading={ringkasanLoading}
        isError={gagalAll}
        kategoriAktif={kategori}
        onPilihKategori={(k) => ubahParam({ kategori: k === kategori ? null : k })}
      />
      <StatusStokBar
        className="col-span-12 md:col-span-6 lg:col-span-4"
        allObat={allObat}
        isLoading={ringkasanLoading}
        isError={gagalAll}
        statusAktif={status}
        onPilihStatus={(s) => ubahParam({ status: s === status ? null : s })}
      />
      <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
        <ReorderTile
          compact
          value={angka(perluReorder)}
          total={gagalAll ? null : totalObat}
          keterangan={`dari ${totalObat} obat${stokHabis > 0 ? `, ${stokHabis} stok sudah habis` : ''}`}
          isLoading={ringkasanLoading}
          action={
            <button
              type="button"
              aria-label="Tampilkan obat yang perlu reorder di tabel"
              onClick={() => ubahParam({ status: 'HARUS_REORDER' })}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary-foreground px-3 text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary-foreground/90 active:translate-y-px active:bg-primary-foreground/80 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Tampilkan obat
            </button>
          }
        />
        <StatTile
          compact
          label="Akan expired"
          value={angka(akanExpired)}
          sublabel={sudahExpired > 0 ? `dalam 90 hari, ${sudahExpired} sudah lewat` : 'dalam 90 hari'}
          icon={CalendarX}
          isLoading={ringkasanLoading}
          onSelect={() => ubahParam({ expired: expired === 'akan' ? null : 'akan' })}
          selected={expired === 'akan'}
        />
      </div>

      {/* ── Daftar obat ──────────────────────────────────────────────────── */}
      <Panel
        title="Daftar obat"
        count={meta?.total}
        className="col-span-12"
        bodyClassName="px-0 pb-0"
      >
        {/* Satu baris: cari, kategori (dengan jumlah), status, lalu aksi utama di kanan */}
        <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
          <SearchField
            className="col-span-2 sm:col-span-1 sm:max-w-[15rem]"
            label="Cari obat"
            placeholder="Cari nama atau kode obat"
            value={cari}
            onChange={setCari}
          />
          <PilihanCombobox
            aria-label="Filter kategori"
            className="col-span-2 sm:col-span-1 sm:w-48"
            options={[
              { value: '', label: `Semua kategori${kategoriOpsi.length > 0 ? ` (${allObat.length})` : ''}` },
              ...kategoriOpsi.map((k) => ({ value: k.nama, label: `${k.nama}${k.jumlah !== null ? ` (${k.jumlah})` : ''}` })),
            ]}
            value={kategori}
            onChange={(v) => ubahParam({ kategori: v || null })}
            noun="kategori"
          />
          <PilihanCombobox
            aria-label="Filter status stok"
            className="sm:w-40"
            options={[
              { value: '', label: 'Semua status' },
              { value: 'AMAN', label: 'Aman' },
              { value: 'MENDEKATI_ROP', label: 'Mendekati ROP' },
              { value: 'HARUS_REORDER', label: 'Harus reorder' },
            ]}
            value={status}
            onChange={(v) => ubahParam({ status: v || null })}
            noun="status"
          />
          <PilihanCombobox
            aria-label="Filter expired"
            className="sm:w-44"
            options={[
              { value: '', label: 'Semua expired' },
              { value: 'akan', label: 'Akan expired (90 hari)' },
              { value: 'lewat', label: 'Sudah expired' },
            ]}
            value={expired}
            onChange={(v) => ubahParam({ expired: v || null })}
            noun="expired"
          />
          {adaFilter && (
            <Button type="button" variant="ghost" className="col-span-2 h-10 rounded-xl px-3 text-primary sm:col-span-1" onClick={aturUlangFilter}>
              Atur ulang
            </Button>
          )}
          {isAdmin && (
            <Button size="lg" className="col-span-2 h-10 rounded-xl px-4 sm:col-span-1 sm:ml-auto" asChild>
              <Link href={denganAsal('/obat/tambah', alamatDaftar)}>
                <Plus data-icon="inline-start" />
                Tambah obat
              </Link>
            </Button>
          )}
        </FilterBar>

        <div aria-busy={isLoading}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <KepalaUrut label="Obat" kunci="nama" urutan={urutan} arah={arah} onUrut={urutPer} className="pl-5" />
                <TableHead className={`${KEPALA} ${KOLOM.kategori}`}>Kategori</TableHead>
                <KepalaUrut label="Stok" kunci="stok" urutan={urutan} arah={arah} onUrut={urutPer} className="text-right" />
                <TableHead className={`${KEPALA} text-right ${KOLOM.rop}`}>
                  <Istilah istilah="ROP" arti="Titik pesan ulang. Pesan obat bila stok sama dengan atau di bawah angka ini." />
                </TableHead>
                <TableHead className={`${KEPALA} text-right ${KOLOM.eoq}`}>
                  <Istilah istilah="EOQ" arti="Jumlah pesanan yang disarankan, agar biaya pesan dan simpan paling hemat." />
                </TableHead>
                <KepalaUrut label="Est. habis" kunci="estimasi" urutan={urutan} arah={arah} onUrut={urutPer} className={`text-right ${KOLOM.estHabis}`} />
                <KepalaUrut label="Expired" kunci="expired" urutan={urutan} arah={arah} onUrut={urutPer} className={KOLOM.expired} />
                <TableHead className={`${KEPALA} ${KOLOM.status}`}>Status</TableHead>
                <TableHead className={`${KEPALA} pr-4 text-right`}>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TabelSkeleton kolom={KOLOM_SKELETON} baris={BATAS_HALAMAN} />
              ) : isError ? null : (
                obatList.map((obat) => (
                  <TableRow key={obat.id}>
                    <TableCell className="whitespace-normal py-3 pl-5">
                      <Link href={`/obat/${obat.id}/detail`} className="group block max-w-[11rem] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[16rem]">
                        <span className="block break-words font-medium leading-tight text-foreground group-hover:text-primary">{obat.nama}</span>
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{obat.kode}</span>
                      </Link>
                      {obat.nama_supplier && <span className="mt-0.5 block text-xs text-muted-foreground">{obat.nama_supplier}</span>}
                      {/* Di layar sempit kolom Status disembunyikan, jadi badge ikut di bawah nama */}
                      <span className="mt-1.5 block md:hidden"><StatusBadge status={obat.status} stok={obat.stok} /></span>
                    </TableCell>
                    <TableCell className={`py-3 text-muted-foreground ${KOLOM.kategori}`}>{obat.kategori}</TableCell>
                    <TableCell className="py-3 text-right tabular-nums">
                      <span className="font-semibold text-foreground">{formatAngka(obat.stok, 0)}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{obat.satuan}</span>
                    </TableCell>
                    <TableCell className={`py-3 text-right tabular-nums ${KOLOM.rop}`}>
                      <KalkulasiCell value={obat.rop} satuan={obat.satuan} />
                    </TableCell>
                    <TableCell className={`py-3 text-right tabular-nums ${KOLOM.eoq}`}>
                      <KalkulasiCell value={obat.eoq} satuan={obat.satuan} />
                    </TableCell>
                    <TableCell className={`py-3 text-right tabular-nums ${KOLOM.estHabis}`}>
                      <EstimasiHabis hari={obat.estimasi_habis_hari} />
                    </TableCell>
                    <TableCell className={`py-3 tabular-nums ${KOLOM.expired}`}>
                      <ExpiredCell tanggal={obat.expired_terdekat} />
                    </TableCell>
                    <TableCell className={`py-3 ${KOLOM.status}`}>
                      <StatusBadge status={obat.status} stok={obat.stok} />
                    </TableCell>
                    <TableCell className="py-1.5 pr-3">
                      <div className="flex justify-end gap-1">
                        {/* Nama obat sudah menjadi tautan ke detail; tombol mata hanya untuk layar lebar, atau untuk staf yang tidak punya aksi lain */}
                        <IconAction label={`Lihat detail ${obat.nama}`} className={isAdmin ? 'hidden lg:inline-flex' : undefined} asChild>
                          <Link href={`/obat/${obat.id}/detail`}><Eye /></Link>
                        </IconAction>
                        {isAdmin && (
                          <>
                            <IconAction label={`Ubah ${obat.nama}`} asChild>
                              <Link href={denganAsal(`/obat/${obat.id}/edit`, alamatDaftar)}><Pencil /></Link>
                            </IconAction>
                            <ConfirmDialog
                              trigger={
                                <IconAction label={`Hapus ${obat.nama}`} className="text-destructive hover:text-destructive">
                                  <Trash2 />
                                </IconAction>
                              }
                              title={`Hapus ${obat.nama}?`}
                              description="Obat yang sudah memiliki riwayat transaksi tidak bisa dihapus."
                              onConfirm={() => deleteMutation.mutate(obat.id)}
                              loading={deleteMutation.isPending}
                            />
                          </>
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
              title="Daftar obat belum bisa dimuat"
              description="Ini bukan berarti tidak ada obat. Periksa koneksi, lalu coba lagi."
              action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={cobaLagi}>Coba lagi</Button>}
            />
          )}
          {!isLoading && !isError && obatList.length === 0 && (
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
                title="Tidak ada obat yang cocok"
                description="Ubah kata kunci atau longgarkan filter untuk melihat obat lain."
                action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={aturUlangFilter}>Atur ulang filter</Button>}
              />
            ) : (
              <StateMessage
                icon={PackageOpen}
                title="Belum ada obat"
                description={isAdmin ? 'Tambah obat pertama untuk mulai memantau stoknya.' : 'Admin belum menambahkan obat.'}
                action={
                  isAdmin && (
                    <Button className="h-10 rounded-xl px-4" asChild>
                      <Link href={denganAsal('/obat/tambah', alamatDaftar)}><Plus data-icon="inline-start" />Tambah obat</Link>
                    </Button>
                  )
                }
              />
            )
          )}
        </div>

        {/* Jumlah hasil diumumkan ke pembaca layar setiap filter berubah (juga bila hanya satu halaman) */}
        <p className="sr-only" role="status" aria-live="polite">
          {meta && !isLoading ? `${meta.total} obat ditemukan` : ''}
        </p>

        {meta && meta.last_page > 1 && (
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} perPage={BATAS_HALAMAN} noun="obat" onPageChange={(p) => ubahParam({ hal: p > 1 ? String(p) : null }, { resetHalaman: false })} />
        )}
      </Panel>

      {/* ── Keterangan warna ─────────────────────────────────────────────── */}
      <p className="col-span-12 px-1 text-sm text-muted-foreground">
        Merah dengan tanda segitiga: stok habis dalam 7 hari atau expired kurang dari 3 bulan (termasuk yang sudah lewat). Oranye: 8 sampai 30 hari atau 3 sampai 6 bulan. Tanda &quot;-&quot; berarti data belum tersedia (menunggu riwayat penjualan).
      </p>

    </div>
  )
}
