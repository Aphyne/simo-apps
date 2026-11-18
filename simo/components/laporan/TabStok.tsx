'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, PackageSearch, PackageX, Wallet } from 'lucide-react'
import { useLaporanStok, type LaporanStokItem } from '@/hooks/useLaporan'
import { exportPDF, exportExcel } from '@/lib/export'
import { useNow } from '@/hooks/useNow'
import { rupiahUbin } from '@/lib/barangKeluar'
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/utils'
import { StatTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import { FilterBar } from '@/components/shared/FilterBar'
import ExpiredCell from '@/components/shared/ExpiredCell'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  AksiEkspor, alasanEkspor, AturUlang, CatatanKolom, FilterKategori, FilterObat, PreviewLaporan, TabelLaporan,
  useFilterLaporan, useIdentitasApotek, type KolomLaporan,
} from './laporanKit'

function nilaiStr(v: number | null | undefined) {
  if (v == null) return '-'
  return Math.round(v).toLocaleString('id-ID')
}

// Perlu reorder = ROP sudah dihitung dan stok sudah sama dengan atau di bawahnya (aturan yang sama dengan backend).
const perluReorder = (r: LaporanStokItem) => Number(r.rop) > 0 && r.stok <= Number(r.rop)

export default function TabStok() {
  const f = useFilterLaporan()
  const [preview, setPreview] = useState(false)
  const { data, isLoading, isError, refetch } = useLaporanStok(f.kategori || undefined, f.obat || undefined)
  const rows = useMemo(() => data ?? [], [data])
  const { namaApotek, alamatApotek } = useIdentitasApotek()
  // Obat yang expired terdekatnya 90 hari lagi atau kurang; yang sudah lewat tanggalnya ikut dihitung dan disebut terpisah.
  const sekarang = useNow().getTime()
  const sisaHari = (r: LaporanStokItem) => (r.expired_terdekat ? Math.floor((new Date(r.expired_terdekat).getTime() - sekarang) / 86400000) : null)
  const segeraExpired = rows.filter((r) => { const h = sisaHari(r); return h !== null && h <= 90 })
  const sudahLewat = segeraExpired.filter((r) => (sisaHari(r) ?? 0) < 0).length
  // Nilai persediaan = stok x harga beli per satuan. Harga beli 0 atau kosong berarti belum diisi dan tidak ikut dijumlahkan.
  const nilaiPersediaan = rows.reduce((sum, r) => sum + (Number(r.harga_beli) > 0 ? r.stok * Number(r.harga_beli) : 0), 0)
  const tanpaHargaBeli = rows.filter((r) => r.stok > 0 && !(Number(r.harga_beli) > 0)).length

  const totalStok  = rows.reduce((s, r) => s + r.stok, 0)
  const totalBiaya = rows.reduce((s, r) => s + (r.total_biaya != null ? Number(r.total_biaya) : 0), 0)
  const footerBaris: (string | number)[][] = rows.length > 0
    ? [['TOTAL', '', '', '', totalStok, '', '', '', totalBiaya > 0 ? formatRupiah(totalBiaya) : '-', '']]
    : []

  const kolomEkspor = ['Kode', 'Nama Obat', 'Kategori', 'Satuan', 'Stok', 'EOQ', 'Safety Stock', 'ROP', 'Total Biaya/Thn', 'Exp. Terdekat']
  const baris = rows.map(r => [
    r.kode, r.nama, r.kategori, r.satuan,
    r.stok, nilaiStr(r.eoq), nilaiStr(r.safety_stock), nilaiStr(r.rop),
    r.total_biaya != null ? formatRupiah(r.total_biaya) : '-',
    r.expired_terdekat ? formatTanggal(r.expired_terdekat) : '-',
  ])
  const keterangan = f.kategori ? `Kategori: ${f.kategori}` : undefined

  function handlePDF() { exportPDF('Laporan Stok Obat', kolomEkspor, baris, keterangan, footerBaris, namaApotek, alamatApotek) }
  function handleExcel() {
    const kolomXls = [...kolomEkspor, 'Demand Harian']
    const barisXls = rows.map(r => [
      r.kode, r.nama, r.kategori, r.satuan,
      r.stok, r.eoq ?? '', r.safety_stock ?? '', r.rop ?? '',
      r.total_biaya ?? '', r.expired_terdekat ?? '', r.demand_harian ?? '',
    ])
    const footerXls: (string | number)[][] = rows.length > 0
      ? [['TOTAL', '', '', '', totalStok, '', '', '', totalBiaya > 0 ? totalBiaya : '-', '', '']]
      : []
    exportExcel('Laporan_Stok_Obat', kolomXls, barisXls, footerXls)
  }

  // Kolom muncul bertahap menurut lebar konten: selalu Obat dan Stok; md Status; xl ROP dan Exp.; 2xl EOQ, Safety Stock, Biaya.
  const kolom: KolomLaporan<LaporanStokItem>[] = [
    {
      id: 'obat', judul: 'Obat', skeleton: 'w-40',
      sel: (r) => (
        <>
          <span className="block font-medium text-foreground">{r.nama}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground"><span className="font-mono">{r.kode}</span> · {r.kategori}</span>
        </>
      ),
    },
    {
      id: 'status', judul: 'Status', kelas: 'hidden md:table-cell', skeleton: 'w-20',
      sel: (r) => r.stok <= 0 || perluReorder(r)
        ? <StatusBadge status="HARUS_REORDER" stok={r.stok} />
        : <span className="text-muted-foreground">-<span className="sr-only"> {Number(r.rop) > 0 ? 'Belum perlu reorder' : 'ROP belum dihitung'}</span></span>,
    },
    {
      id: 'stok', judul: 'Stok', kanan: true, skeleton: 'w-12',
      sel: (r) => (
        <>
          <span className="block font-medium tabular-nums text-foreground">{r.stok.toLocaleString('id-ID')}</span>
          <span className="block text-xs text-muted-foreground">{r.satuan}</span>
        </>
      ),
    },
    { id: 'rop', judul: 'ROP', kanan: true, kelas: 'hidden xl:table-cell', skeleton: 'w-12', sel: (r) => <span className="tabular-nums">{nilaiStr(r.rop)}</span> },
    { id: 'exp', judul: 'Exp. terdekat', kelas: 'hidden xl:table-cell', skeleton: 'w-20', sel: (r) => <ExpiredCell tanggal={r.expired_terdekat} /> },
    { id: 'eoq', judul: 'EOQ', kanan: true, kelas: 'hidden 2xl:table-cell', skeleton: 'w-12', sel: (r) => <span className="tabular-nums">{nilaiStr(r.eoq)}</span> },
    { id: 'ss', judul: 'Safety stock', kanan: true, kelas: 'hidden 2xl:table-cell', skeleton: 'w-12', sel: (r) => <span className="tabular-nums">{nilaiStr(r.safety_stock)}</span> },
    { id: 'biaya', judul: 'Total biaya/thn', kanan: true, kelas: 'hidden 2xl:table-cell', skeleton: 'w-24', sel: (r) => <span className="tabular-nums">{r.total_biaya != null ? formatRupiah(r.total_biaya) : '-'}</span> },
  ]

  const adaFilter = Boolean(f.obat || f.kategori)
  const angka = (n: number) => (isError ? null : n)

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          compact icon={Wallet} label="Nilai persediaan" value={null} teks={isError ? '-' : rupiahUbin(nilaiPersediaan)}
          sublabel={isError ? '' : tanpaHargaBeli > 0 ? `${tanpaHargaBeli} obat belum berharga` : 'stok x harga beli'} isLoading={isLoading}
        />
        <StatTile compact icon={PackageX} label="Stok habis" value={angka(rows.filter(r => r.stok <= 0).length)} sublabel="pesan lebih dulu" isLoading={isLoading} />
        <StatTile compact icon={PackageSearch} label="Perlu reorder" value={angka(rows.filter(perluReorder).length)} sublabel="stok di bawah ROP" isLoading={isLoading} />
        <StatTile compact icon={CalendarClock} label="Expired 90 hari" value={angka(segeraExpired.length)} sublabel={sudahLewat > 0 ? `${sudahLewat} sudah lewat` : 'obat, belum ada yang lewat'} isLoading={isLoading} />
      </div>

      <Panel title="Laporan stok obat" count={isLoading || isError ? undefined : rows.length} action={<AksiEkspor onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} alasanNonaktif={alasanEkspor(isLoading, isError, rows.length)} />} bodyClassName="px-0 pb-0">
        <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
          <FilterObat nilai={f.obat} onUbah={(v) => f.ubah({ obat: v || null })} />
          <FilterKategori nilai={f.kategori} onUbah={(v) => f.ubah({ kategori: v || null })} />
          {adaFilter && <AturUlang onClick={() => f.aturUlang('obat', 'kategori')} />}
        </FilterBar>
        <TabelLaporan
          kolom={kolom} baris={rows} kunci={(r) => r.id} isLoading={isLoading} isError={isError} onCobaLagi={() => refetch()}
          footer={[{ label: `Total (${formatAngka(rows.length, 0)} obat)`, nilai: { stok: totalStok.toLocaleString('id-ID'), biaya: totalBiaya > 0 ? formatRupiah(totalBiaya) : '-' } }]}
          kosong={{ judul: 'Tidak ada obat yang cocok', keterangan: 'Ubah obat atau kategori yang dipilih.', aksi: adaFilter ? <AturUlang onClick={() => f.aturUlang('obat', 'kategori')} /> : undefined }}
          halaman={f.halaman} onHalaman={(n) => f.ubah({ hal: n === 1 ? null : String(n) }, { resetHalaman: false })} noun="obat"
        />
      </Panel>
      <CatatanKolom />

      <PreviewLaporan open={preview} onClose={() => setPreview(false)}
        judul="Laporan Stok Obat" keterangan={keterangan}
        namaApotek={namaApotek} alamatApotek={alamatApotek}
        kolom={kolomEkspor} baris={baris} footerBaris={footerBaris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </>
  )
}
