'use client'

import { useMemo, useState } from 'react'
import { Package, ReceiptText, Wallet } from 'lucide-react'
import { useLaporanBarangMasuk, type LaporanBarangMasukItem } from '@/hooks/useLaporan'
import { exportPDF, exportExcel } from '@/lib/export'
import { rupiahUbin } from '@/lib/barangKeluar'
import { formatAngka, formatTanggal } from '@/lib/utils'
import { StatTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import { FilterBar } from '@/components/shared/FilterBar'
import {
  AksiEkspor, alasanEkspor, AturUlang, CatatanKolom, FilterKategori, FilterObat, FilterTanggal, PreviewLaporan, TabelLaporan,
  useFilterLaporan, useIdentitasApotek, type KolomLaporan,
} from './laporanKit'

export default function TabBarangMasuk() {
  const f = useFilterLaporan()
  const [preview, setPreview] = useState(false)
  const { data, isLoading, isError, refetch } = useLaporanBarangMasuk(f.dari || undefined, f.sampai || undefined, f.kategori || undefined, f.obat || undefined)
  const rows = useMemo(() => data ?? [], [data])
  const { namaApotek, alamatApotek } = useIdentitasApotek()

  const totalDus    = rows.reduce((s, r) => s + Number(r.jumlah_dus), 0)
  const totalSatuan = rows.reduce((s, r) => s + Number(r.jumlah_satuan), 0)
  const footerBaris: (string | number)[][] = rows.length > 0
    ? [['TOTAL', '', '', '', '', totalDus, totalSatuan, '', '', '']]
    : []

  const keteranganFilter = [
    f.dari && f.sampai ? `Periode: ${formatTanggal(f.dari)} – ${formatTanggal(f.sampai)}` : f.dari ? `Dari: ${formatTanggal(f.dari)}` : f.sampai ? `Sampai: ${formatTanggal(f.sampai)}` : '',
    f.kategori ? `Kategori: ${f.kategori}` : '',
  ].filter(Boolean).join(' | ') || undefined

  const kolomEkspor = ['Tanggal', 'Kode', 'Nama Obat', 'Kategori', 'Satuan', 'Jml Dus', 'Jml Satuan', 'Supplier', 'No. Faktur', 'Dicatat Oleh']
  const baris = rows.map(r => [
    formatTanggal(r.tanggal), r.kode, r.nama_obat, r.kategori, r.satuan,
    r.jumlah_dus, r.jumlah_satuan,
    r.nama_supplier ?? '-', r.no_faktur ?? '-',
    r.nama_user ? `${r.nama_user} (${r.role_user})` : '-',
  ])

  function handlePDF() { exportPDF('Laporan Stok Masuk', kolomEkspor, baris, keteranganFilter, footerBaris, namaApotek, alamatApotek) }
  function handleExcel() {
    const kolomXls = [...kolomEkspor, 'Catatan']
    const barisXls = rows.map(r => [
      r.tanggal, r.kode, r.nama_obat, r.kategori, r.satuan,
      r.jumlah_dus, r.jumlah_satuan, r.nama_supplier ?? '', r.no_faktur ?? '',
      r.nama_user ?? '', r.catatan ?? '',
    ])
    const footerXls: (string | number)[][] = rows.length > 0
      ? [['TOTAL', '', '', '', '', totalDus, totalSatuan, '', '', '', '']]
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
    {
      id: 'oleh', judul: 'Dicatat oleh', kelas: 'hidden 2xl:table-cell', skeleton: 'w-24',
      sel: (r) => <span className="whitespace-nowrap">{r.nama_user ?? '-'}{r.role_user && <span className="ml-1 text-xs text-muted-foreground">({r.role_user})</span>}</span>,
    },
  ]

  const adaFilter = Boolean(f.obat || f.dari || f.sampai || f.kategori)
  const angka = (n: number) => (isError ? null : n)
  const jenisObat = new Set(rows.map(r => r.kode)).size
  const jumlahSupplier = new Set(rows.map(r => r.nama_supplier).filter(Boolean)).size
  const jumlahFaktur = new Set(rows.map(r => r.no_faktur).filter(Boolean)).size
  // Pembelian = jumlah satuan x harga beli per satuan sesudah PPN. Baris tanpa harga beli tidak ikut dijumlahkan dan disebut terpisah.
  const pembelian = rows.reduce((sum, r) => sum + (r.harga_beli != null ? Number(r.harga_beli) * Number(r.jumlah_satuan) : 0), 0)
  const pembelianTanpaHarga = rows.filter(r => r.harga_beli == null).length
  const aturUlang = () => f.aturUlang('obat', 'dari', 'sampai', 'kategori')

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          compact icon={Wallet} label="Pembelian" value={null} teks={isError ? '-' : rupiahUbin(pembelian)}
          sublabel={isError ? '' : pembelianTanpaHarga > 0 ? `${pembelianTanpaHarga} belum berharga` : 'sesudah PPN'} isLoading={isLoading}
        />
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
          footer={[{ label: `Total (${formatAngka(rows.length, 0)} catatan)`, nilai: { jumlah: <>{formatAngka(totalSatuan, 0)}<span className="block text-xs font-normal text-muted-foreground">{formatAngka(totalDus, 2)} dus</span></> } }]}
          kosong={{ judul: 'Tidak ada stok masuk', keterangan: adaFilter ? 'Ubah obat, periode, atau kategori yang dipilih.' : 'Belum ada stok masuk yang tercatat.', aksi: adaFilter ? <AturUlang onClick={aturUlang} /> : undefined }}
          halaman={f.halaman} onHalaman={(n) => f.ubah({ hal: n === 1 ? null : String(n) }, { resetHalaman: false })} noun="catatan"
        />
      </Panel>
      <CatatanKolom />

      <PreviewLaporan open={preview} onClose={() => setPreview(false)}
        judul="Laporan Stok Masuk" keterangan={keteranganFilter}
        namaApotek={namaApotek} alamatApotek={alamatApotek}
        kolom={kolomEkspor} baris={baris} footerBaris={footerBaris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </>
  )
}
