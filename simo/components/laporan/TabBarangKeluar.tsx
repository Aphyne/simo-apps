'use client'

import { useMemo, useState } from 'react'
import { PackageX, ShoppingCart, Wallet } from 'lucide-react'
import { useLaporanBarangKeluar, type LaporanBarangKeluarItem } from '@/hooks/useLaporan'
import { exportPDF, exportExcel } from '@/lib/export'
import { rupiahUbin } from '@/lib/barangKeluar'
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { Badge } from '@/components/ui/badge'
import { StatTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import { FilterBar } from '@/components/shared/FilterBar'
import {
  AksiEkspor, alasanEkspor, AturUlang, CatatanKolom, FilterKategori, FilterObat, FilterPilihan, FilterTanggal, KETERANGAN_KELUAR,
  PreviewLaporan, TabelLaporan, useFilterLaporan, useIdentitasApotek, type BarisPenutup, type KolomLaporan,
} from './laporanKit'

// Keterangan berupa badge netral (Penjualan secondary, lainnya outline); merah dan oranye milik status stok.
function BadgeKeterangan({ nilai }: { nilai: string }) {
  return <Badge variant={nilai === 'Penjualan' ? 'secondary' : 'outline'}>{nilai}</Badge>
}

export default function TabBarangKeluar() {
  // Pendapatan adalah uang: khusus admin (backend juga tidak mengirim harga jual ke staf).
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const f = useFilterLaporan()
  const [preview, setPreview] = useState(false)
  const { data, isLoading, isError, refetch } = useLaporanBarangKeluar(f.dari || undefined, f.sampai || undefined, f.keterangan || undefined, f.kategori || undefined, f.obat || undefined)
  const rows = useMemo(() => data ?? [], [data])
  const { namaApotek, alamatApotek } = useIdentitasApotek()

  const totalKeluar = rows.reduce((s, r) => s + Number(r.jumlah), 0)
  // Uang (admin): pendapatan hanya dari Penjualan, jumlah x harga jual saat dicatat. Harga 0 atau kosong berarti belum ada
  // harga dan tidak ikut dijumlahkan. Staf tidak menerima harga dari backend di laporan dan tidak melihat kolom ini.
  const penjualan = rows.filter(r => r.keterangan === 'Penjualan')
  const rp = (n: number | string | null | undefined) => (n != null ? formatRupiah(Number(n)) : '-')
  const hargaAda = (r: LaporanBarangKeluarItem) => r.keterangan === 'Penjualan' && Number(r.harga_jual) > 0
  const totalBaris = (r: LaporanBarangKeluarItem) => (hargaAda(r) ? Number(r.jumlah) * Number(r.harga_jual) : null)
  const pendapatan = penjualan.reduce((sum, r) => sum + (totalBaris(r) ?? 0), 0)
  const breakdown = KETERANGAN_KELUAR
    .map(k => ({ k, total: rows.filter(r => r.keterangan === k).reduce((s, r) => s + Number(r.jumlah), 0) }))
    .filter(x => x.total > 0)
  const footerBaris: (string | number)[][] = rows.length > 0 ? [
    ['TOTAL', '', '', '', '', totalKeluar, '', '', '', ...(isAdmin ? ['', formatRupiah(pendapatan)] : []), ''],
    ...breakdown.map(x => [`  ↳ ${x.k}`, '', '', '', '', x.total, x.k, '', '', ...(isAdmin ? ['', ''] : []), '']),
  ] : []

  const keteranganFilter = [
    f.dari && f.sampai ? `Periode: ${formatTanggal(f.dari)} – ${formatTanggal(f.sampai)}` : f.dari ? `Dari: ${formatTanggal(f.dari)}` : f.sampai ? `Sampai: ${formatTanggal(f.sampai)}` : '',
    f.keterangan ? `Keterangan: ${f.keterangan}` : '',
    f.kategori ? `Kategori: ${f.kategori}` : '',
    isAdmin ? 'Total hanya menjumlahkan Penjualan' : '',
  ].filter(Boolean).join(' | ') || undefined

  const kolomEkspor = ['Tanggal', 'Kode', 'Nama Obat', 'Kategori', 'Satuan', 'Jumlah', 'Keterangan', 'Stok Sebelum', 'Stok Sesudah', ...(isAdmin ? ['Harga Jual', 'Total'] : []), 'Dicatat Oleh']
  const baris = rows.map(r => [
    formatTanggal(r.tanggal), r.kode, r.nama_obat, r.kategori, r.satuan,
    r.jumlah, r.keterangan, r.stok_sebelum, r.stok_sesudah,
    ...(isAdmin ? [hargaAda(r) ? rp(r.harga_jual) : '-', rp(totalBaris(r))] : []),
    r.nama_user ? `${r.nama_user} (${r.role_user})` : 'Tidak tercatat',
  ])

  function handlePDF() { exportPDF('Laporan Stok Keluar', kolomEkspor, baris, keteranganFilter, footerBaris, namaApotek, alamatApotek) }
  function handleExcel() {
    const kolomXls = [...kolomEkspor, 'Catatan']
    const barisXls = rows.map(r => [
      r.tanggal, r.kode, r.nama_obat, r.kategori, r.satuan,
      r.jumlah, r.keterangan, r.stok_sebelum, r.stok_sesudah,
      ...(isAdmin ? [hargaAda(r) ? Number(r.harga_jual) : '', totalBaris(r) ?? ''] : []),
      r.nama_user ?? 'Tidak tercatat', r.catatan ?? '',
    ])
    const footerXls: (string | number)[][] = rows.length > 0 ? [
      ['TOTAL', '', '', '', '', totalKeluar, '', '', '', ...(isAdmin ? ['', pendapatan] : []), '', ''],
      ...breakdown.map(x => [`  ↳ ${x.k}`, '', '', '', '', x.total, x.k, '', '', ...(isAdmin ? ['', ''] : []), '', '']),
    ] : []
    exportExcel('Laporan_Stok_Keluar', kolomXls, barisXls, footerXls)
  }

  // Selalu: Tanggal, Obat, Jumlah keluar. md: Keterangan (di bawah md ikut di bawah nama). xl: Stok sebelum dan sesudah.
  // 2xl: Dicatat oleh.
  const kolom: KolomLaporan<LaporanBarangKeluarItem>[] = [
    { id: 'tanggal', judul: 'Tanggal', skeleton: 'w-24', sel: (r) => <span className="whitespace-nowrap">{formatTanggal(r.tanggal)}</span> },
    {
      id: 'obat', judul: 'Obat', skeleton: 'w-40',
      sel: (r) => (
        <>
          <span className="block font-medium text-foreground">{r.nama_obat}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground"><span className="font-mono">{r.kode}</span> · {r.kategori}</span>
          <span className="mt-1.5 block md:hidden"><BadgeKeterangan nilai={r.keterangan} /></span>
        </>
      ),
    },
    { id: 'ket', judul: 'Keterangan', kelas: 'hidden md:table-cell', skeleton: 'w-20', sel: (r) => <BadgeKeterangan nilai={r.keterangan} /> },
    {
      id: 'jumlah', judul: 'Jumlah keluar', kanan: true, skeleton: 'w-16',
      sel: (r) => (
        <>
          <span className="block font-medium tabular-nums text-foreground"><span aria-hidden="true">−</span><span className="sr-only">minus </span>{formatAngka(Number(r.jumlah), 0)}</span>
          <span className="block text-xs text-muted-foreground">{r.satuan}</span>
        </>
      ),
    },
    { id: 'stok', judul: 'Stok sebelum → sesudah', kanan: true, kelas: 'hidden xl:table-cell', skeleton: 'w-24', sel: (r) => <span className="whitespace-nowrap tabular-nums">{r.stok_sebelum} → {r.stok_sesudah}</span> },
    ...(isAdmin ? [
      { id: 'harga', judul: 'Harga jual', kanan: true, kelas: 'hidden xl:table-cell', skeleton: 'w-20', sel: (r: LaporanBarangKeluarItem) => <span className="whitespace-nowrap tabular-nums">{hargaAda(r) ? rp(r.harga_jual) : <span className="text-muted-foreground">-</span>}</span> },
      { id: 'total', judul: 'Total', kanan: true, skeleton: 'w-24', sel: (r: LaporanBarangKeluarItem) => <span className="whitespace-nowrap font-medium tabular-nums">{totalBaris(r) !== null ? rp(totalBaris(r)) : <span className="font-normal text-muted-foreground">-</span>}</span> },
    ] : []),
    {
      id: 'oleh', judul: 'Dicatat oleh', kelas: 'hidden 2xl:table-cell', skeleton: 'w-24',
      sel: (r) => r.nama_user ? <span className="whitespace-nowrap">{r.nama_user}{r.role_user && <span className="ml-1 text-xs text-muted-foreground">({r.role_user})</span>}</span> : <span className="text-xs text-muted-foreground">Tidak tercatat</span>,
    },
  ]

  const adaFilter = Boolean(f.obat || f.dari || f.sampai || f.keterangan || f.kategori)
  const angka = (n: number) => (isError ? null : n)
  const jenisObatPenjualan = new Set(penjualan.map(r => r.kode)).size
  const penjualanTanpaHarga = penjualan.filter(r => !(Number(r.harga_jual) > 0)).length
  const aturUlang = () => f.aturUlang('obat', 'dari', 'sampai', 'keterangan', 'kategori')

  const footer: BarisPenutup[] = [
    { label: `Total (${formatAngka(rows.length, 0)} catatan)`, nilai: { jumlah: formatAngka(totalKeluar, 0), ...(isAdmin ? { total: formatRupiah(pendapatan) } : {}) } },
    ...breakdown.map(x => ({ label: `↳ ${x.k}`, nilai: { jumlah: formatAngka(x.total, 0) }, ringan: true })),
  ]

  return (
    <>
      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {isAdmin && (
          <StatTile
            compact icon={Wallet} label="Pendapatan penjualan" value={null} teks={isError ? '-' : rupiahUbin(pendapatan)}
            sublabel={isError ? '' : penjualanTanpaHarga > 0 ? `${penjualanTanpaHarga} belum berharga` : 'jumlah x harga jual'} isLoading={isLoading}
          />
        )}
        <StatTile compact icon={ShoppingCart} label="Penjualan" value={angka(penjualan.length)} sublabel={`catatan, ${jenisObatPenjualan} jenis obat`} isLoading={isLoading} />
        <StatTile compact icon={PackageX} label="Keluar bukan penjualan" value={angka(rows.length - penjualan.length)} sublabel="retur, rusak, kedaluarsa, lainnya" isLoading={isLoading} />
      </div>

      <Panel title="Laporan stok keluar" count={isLoading || isError ? undefined : rows.length} action={<AksiEkspor onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} alasanNonaktif={alasanEkspor(isLoading, isError, rows.length)} />} bodyClassName="px-0 pb-0">
        <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
          <FilterObat nilai={f.obat} onUbah={(v) => f.ubah({ obat: v || null })} />
          <FilterTanggal dari={f.dari} sampai={f.sampai} onUbah={f.ubah} />
          <FilterPilihan
            label="Filter keterangan" nilai={f.keterangan} onUbah={(v) => f.ubah({ keterangan: v || null })}
            semua="Semua keterangan" opsi={KETERANGAN_KELUAR.map((k) => ({ value: k, label: k }))} className="col-span-2 sm:col-span-1"
          />
          <FilterKategori nilai={f.kategori} onUbah={(v) => f.ubah({ kategori: v || null })} />
          {adaFilter && <AturUlang onClick={aturUlang} />}
        </FilterBar>
        <TabelLaporan
          kolom={kolom} baris={rows} kunci={(r) => r.id} isLoading={isLoading} isError={isError} onCobaLagi={() => refetch()} footer={footer}
          kosong={{ judul: 'Tidak ada stok keluar', keterangan: adaFilter ? 'Ubah obat, periode, keterangan, atau kategori yang dipilih.' : 'Belum ada stok keluar yang tercatat.', aksi: adaFilter ? <AturUlang onClick={aturUlang} /> : undefined }}
          halaman={f.halaman} onHalaman={(n) => f.ubah({ hal: n === 1 ? null : String(n) }, { resetHalaman: false })} noun="catatan"
        />
      </Panel>
      <CatatanKolom />
      {isAdmin && (
        <p className="text-sm text-muted-foreground">
          Harga jual adalah harga saat dicatat. Kolom Total hanya diisi untuk Penjualan; retur, rusak, dan lainnya bukan pendapatan. Penjualan tanpa harga jual tertulis &quot;-&quot; dan tidak ikut total.
        </p>
      )}

      <PreviewLaporan open={preview} onClose={() => setPreview(false)}
        judul="Laporan Stok Keluar" keterangan={keteranganFilter}
        namaApotek={namaApotek} alamatApotek={alamatApotek}
        kolom={kolomEkspor} baris={baris} footerBaris={footerBaris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </>
  )
}

