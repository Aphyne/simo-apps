'use client'

import { useMemo, useState } from 'react'
import { Package, ReceiptText, Wallet } from 'lucide-react'
import { useLaporanBarangMasuk, type LaporanBarangMasukItem } from '@/hooks/useLaporan'
import { exportPDF, exportExcel } from '@/lib/export'
import { rupiahUbin } from '@/lib/barangKeluar'
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { StatTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import { FilterBar } from '@/components/shared/FilterBar'
import {
  AksiEkspor, alasanEkspor, AturUlang, CatatanKolom, FilterKategori, FilterObat, FilterTanggal, PreviewLaporan, TabelLaporan,
  useFilterLaporan, useIdentitasApotek, type KolomLaporan,
} from './laporanKit'

export default function TabBarangMasuk() {
  // Pembelian adalah uang: khusus admin (backend juga tidak mengirim harga beli ke staf).
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const f = useFilterLaporan()
  const [preview, setPreview] = useState(false)
  const { data, isLoading, isError, refetch } = useLaporanBarangMasuk(f.dari || undefined, f.sampai || undefined, f.kategori || undefined, f.obat || undefined)
  const rows = useMemo(() => data ?? [], [data])
  const { namaApotek, alamatApotek } = useIdentitasApotek()

  const totalDus    = rows.reduce((s, r) => s + Number(r.jumlah_dus), 0)
  const totalSatuan = rows.reduce((s, r) => s + Number(r.jumlah_satuan), 0)
  // Uang (admin): harga beli per satuan sudah sesudah PPN. Pembelian = jumlah satuan x harga beli; baris tanpa harga beli
  // tidak ikut dijumlahkan dan disebut terpisah. Staf tidak menerima harga dari backend dan tidak melihat kolom ini.
  const rp = (n: number | string | null | undefined) => (n != null ? formatRupiah(Number(n)) : '-')
  const subtotal = (r: LaporanBarangMasukItem) => (r.harga_beli != null ? Number(r.harga_beli) * Number(r.jumlah_satuan) : null)
  const pembelian = rows.reduce((sum, r) => sum + (subtotal(r) ?? 0), 0)
  const footerBaris: (string | number)[][] = rows.length > 0
    ? [['TOTAL', '', '', '', '', totalDus, totalSatuan, '', '', ...(isAdmin ? ['', formatRupiah(pembelian)] : []), '']]
    : []

  const keteranganFilter = [
    f.dari && f.sampai ? `Periode: ${formatTanggal(f.dari)} – ${formatTanggal(f.sampai)}` : f.dari ? `Dari: ${formatTanggal(f.dari)}` : f.sampai ? `Sampai: ${formatTanggal(f.sampai)}` : '',
    f.kategori ? `Kategori: ${f.kategori}` : '',
    isAdmin ? 'Harga sudah termasuk PPN' : '',
  ].filter(Boolean).join(' | ') || undefined

  const kolomEkspor = ['Tanggal', 'Kode', 'Nama Obat', 'Kategori', 'Satuan', 'Jml Dus', 'Jml Satuan', 'Supplier', 'No. Faktur', ...(isAdmin ? ['Harga Beli/Satuan', 'Subtotal'] : []), 'Dicatat Oleh']
  const baris = rows.map(r => [
    formatTanggal(r.tanggal), r.kode, r.nama_obat, r.kategori, r.satuan,
    r.jumlah_dus, r.jumlah_satuan,
    r.nama_supplier ?? '-', r.no_faktur ?? '-',
    ...(isAdmin ? [rp(r.harga_beli), rp(subtotal(r))] : []),
    r.nama_user ? `${r.nama_user} (${r.role_user})` : 'Tidak tercatat',
  ])

  function handlePDF() { exportPDF('Laporan Stok Masuk', kolomEkspor, baris, keteranganFilter, footerBaris, namaApotek, alamatApotek) }
  function handleExcel() {
    const kolomXls = [...kolomEkspor, 'Catatan']
    const barisXls = rows.map(r => [
      r.tanggal, r.kode, r.nama_obat, r.kategori, r.satuan,
      r.jumlah_dus, r.jumlah_satuan, r.nama_supplier ?? '', r.no_faktur ?? '',
      ...(isAdmin ? [r.harga_beli != null ? Number(r.harga_beli) : '', subtotal(r) ?? ''] : []),
      r.nama_user ?? 'Tidak tercatat', r.catatan ?? '',
    ])
    const footerXls: (string | number)[][] = rows.length > 0
      ? [['TOTAL', '', '', '', '', totalDus, totalSatuan, '', '', ...(isAdmin ? ['', pembelian] : []), '', '']]
      : []
    exportExcel('Laporan_Stok_Masuk', kolomXls, barisXls, footerXls)
  }

  // Selalu: Tanggal, Obat, Jumlah. md: Supplier dan faktur. 2xl: Dicatat oleh.
  const kolom: KolomLaporan<LaporanBarangMasukItem>[] = [
    { id: 'tanggal', judul: 'Tanggal', skeleton: 'w-24', sel: (r) => <span className="whitespace-nowrap">{formatTanggal(r.tanggal)}</span> },
    {
      id: 'obat', judul: 'Obat', skeleton: 'w-40',
      sel: (r) => (
        <>
          <span className="block font-medium text-foreground">{r.nama_obat}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground"><span className="font-mono">{r.kode}</span> · {r.kategori}</span>
        </>
      ),
    },
    {
      id: 'jumlah', judul: 'Jumlah masuk', kanan: true, skeleton: 'w-16',
      sel: (r) => (
        <>
          <span className="block font-medium tabular-nums text-foreground">+{formatAngka(Number(r.jumlah_satuan), 0)} {r.satuan}</span>
          <span className="block text-xs tabular-nums text-muted-foreground">{formatAngka(Number(r.jumlah_dus), 2)} dus</span>
        </>
      ),
    },
    {
      id: 'supplier', judul: 'Supplier / faktur', kelas: 'hidden md:table-cell', skeleton: 'w-32',
      sel: (r) => (
        <>
          <span className="block">{r.nama_supplier ?? '-'}</span>
          {r.no_faktur && <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{r.no_faktur}</span>}
        </>
      ),
    },
    ...(isAdmin ? [
      { id: 'harga', judul: 'Harga beli', kanan: true, kelas: 'hidden xl:table-cell', skeleton: 'w-20', sel: (r: LaporanBarangMasukItem) => <span className="whitespace-nowrap tabular-nums">{rp(r.harga_beli)}</span> },
      { id: 'subtotal', judul: 'Subtotal', kanan: true, skeleton: 'w-24', sel: (r: LaporanBarangMasukItem) => <span className="whitespace-nowrap font-medium tabular-nums">{rp(subtotal(r))}</span> },
    ] : []),
    {
      id: 'oleh', judul: 'Dicatat oleh', kelas: 'hidden 2xl:table-cell', skeleton: 'w-24',
      sel: (r) => r.nama_user ? <span className="whitespace-nowrap">{r.nama_user}{r.role_user && <span className="ml-1 text-xs text-muted-foreground">({r.role_user})</span>}</span> : <span className="text-xs text-muted-foreground">Tidak tercatat</span>,
    },
  ]

  const adaFilter = Boolean(f.obat || f.dari || f.sampai || f.kategori)
  const angka = (n: number) => (isError ? null : n)
  const jenisObat = new Set(rows.map(r => r.kode)).size
  const jumlahSupplier = new Set(rows.map(r => r.nama_supplier).filter(Boolean)).size
  const jumlahFaktur = new Set(rows.map(r => r.no_faktur).filter(Boolean)).size
  const pembelianTanpaHarga = rows.filter(r => r.harga_beli == null).length
  const aturUlang = () => f.aturUlang('obat', 'dari', 'sampai', 'kategori')

  return (
    <>
      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {isAdmin && (
          <StatTile
            compact icon={Wallet} label="Pembelian" value={null} teks={isError ? '-' : rupiahUbin(pembelian)}
            sublabel={isError ? '' : pembelianTanpaHarga > 0 ? `${pembelianTanpaHarga} belum berharga` : 'sesudah PPN'} isLoading={isLoading}
          />
        )}
        <StatTile compact icon={ReceiptText} label="Faktur" value={angka(jumlahFaktur)} sublabel={`dari ${jumlahSupplier} supplier`} isLoading={isLoading} />
        <StatTile compact icon={Package} label="Jenis obat" value={angka(jenisObat)} sublabel="yang masuk" isLoading={isLoading} />
      </div>

      <Panel title="Laporan stok masuk" count={isLoading || isError ? undefined : rows.length} action={<AksiEkspor onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} alasanNonaktif={alasanEkspor(isLoading, isError, rows.length)} />} bodyClassName="px-0 pb-0">
        <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
          <FilterObat nilai={f.obat} onUbah={(v) => f.ubah({ obat: v || null })} />
          <FilterTanggal dari={f.dari} sampai={f.sampai} onUbah={f.ubah} />
          <FilterKategori nilai={f.kategori} onUbah={(v) => f.ubah({ kategori: v || null })} />
          {adaFilter && <AturUlang onClick={aturUlang} />}
        </FilterBar>
        <TabelLaporan
          kolom={kolom} baris={rows} kunci={(r) => r.id} isLoading={isLoading} isError={isError} onCobaLagi={() => refetch()}
          footer={[{ label: `Total (${formatAngka(rows.length, 0)} catatan)`, nilai: { jumlah: <>{formatAngka(totalSatuan, 0)}<span className="block text-xs font-normal text-muted-foreground">{formatAngka(totalDus, 2)} dus</span></>, ...(isAdmin ? { subtotal: formatRupiah(pembelian) } : {}) } }]}
          kosong={{ judul: 'Tidak ada stok masuk', keterangan: adaFilter ? 'Ubah obat, periode, atau kategori yang dipilih.' : 'Belum ada stok masuk yang tercatat.', aksi: adaFilter ? <AturUlang onClick={aturUlang} /> : undefined }}
          halaman={f.halaman} onHalaman={(n) => f.ubah({ hal: n === 1 ? null : String(n) }, { resetHalaman: false })} noun="catatan"
        />
      </Panel>
      <CatatanKolom />
      {isAdmin && (
        <p className="text-sm text-muted-foreground">
          Harga beli per satuan dan subtotal sudah termasuk PPN. Baris tanpa harga beli tertulis &quot;-&quot; dan tidak ikut dijumlahkan di total pembelian.
        </p>
      )}

      <PreviewLaporan open={preview} onClose={() => setPreview(false)}
        judul="Laporan Stok Masuk" keterangan={keteranganFilter}
        namaApotek={namaApotek} alamatApotek={alamatApotek}
        kolom={kolomEkspor} baris={baris} footerBaris={footerBaris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </>
  )
}
