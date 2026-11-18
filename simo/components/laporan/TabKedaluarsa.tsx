'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, Hourglass, TriangleAlert } from 'lucide-react'
import { useLaporanKedaluarsa, type LaporanKedaluarsaItem } from '@/hooks/useLaporan'
import { exportPDF, exportExcel } from '@/lib/export'
import { formatAngka, formatTanggal } from '@/lib/utils'
import { StatTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import { FilterBar } from '@/components/shared/FilterBar'
import {
  AksiEkspor, alasanEkspor, AturUlang, CatatanKolom, FilterKategori, FilterObat, FilterPilihan, PILIHAN_HARI, PreviewLaporan,
  TabelLaporan, useFilterLaporan, useIdentitasApotek, type KolomLaporan,
} from './laporanKit'

// Sisa hari: 30 hari atau kurang merah, 31 sampai 60 oranye (selalu dengan ikon dan teks), selebihnya netral.
function SisaHari({ hari }: { hari: number }) {
  if (hari <= 60) {
    return (
      <span className={`inline-flex items-center gap-1 font-semibold ${hari <= 30 ? 'text-danger-700' : 'text-warning-700'}`}>
        <TriangleAlert className="size-3.5" aria-hidden="true" />
        {hari} hari
      </span>
    )
  }
  return <span className="text-muted-foreground">{hari} hari</span>
}

export default function TabKedaluarsa() {
  const f = useFilterLaporan()
  const [preview, setPreview] = useState(false)
  const { data, isLoading, isError, refetch } = useLaporanKedaluarsa(f.hari, f.kategori || undefined, f.obat || undefined)
  const rows = useMemo(() => data ?? [], [data])
  const { namaApotek, alamatApotek } = useIdentitasApotek()

  const footerBaris: (string | number)[][] = rows.length > 0
    ? [[`${rows.length} jenis obat akan kedaluarsa`, '', '', '', '', '', '', '']]
    : []

  const keteranganFilter = [`Dalam ${f.hari} hari ke depan`, f.kategori ? `Kategori: ${f.kategori}` : ''].filter(Boolean).join(' | ')
  const kolomEkspor = ['Kode', 'Nama Obat', 'Kategori', 'Satuan', 'No. Batch', 'Stok', 'Tgl. Expired', 'Sisa Hari']
  const baris = rows.map(r => [r.kode, r.nama, r.kategori, r.satuan, r.no_batch ?? '-', r.stok, formatTanggal(r.expired_terdekat), `${r.sisa_hari} hari`])

  function handlePDF() { exportPDF('Laporan Obat Kedaluarsa', kolomEkspor, baris, keteranganFilter, footerBaris, namaApotek, alamatApotek) }
  function handleExcel() {
    const barisXls = rows.map(r => [r.kode, r.nama, r.kategori, r.satuan, r.no_batch ?? '-', r.stok, r.expired_terdekat, r.sisa_hari])
    exportExcel('Laporan_Kedaluarsa', kolomEkspor, barisXls, footerBaris)
  }

  // Selalu: Obat, Stok, Sisa hari. md: Batch dan Tanggal expired (di bawah md, batch ikut di bawah nama obat).
  const kolom: KolomLaporan<LaporanKedaluarsaItem>[] = [
    {
      id: 'obat', judul: 'Obat', skeleton: 'w-40',
      sel: (r) => (
        <>
          <span className="block font-medium text-foreground">{r.nama}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground"><span className="font-mono">{r.kode}</span> · {r.kategori}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">{r.no_batch ? `Batch ${r.no_batch}` : 'Batch tanpa nomor'}</span>
        </>
      ),
    },
    {
      id: 'batch', judul: 'Batch', kelas: 'hidden md:table-cell', skeleton: 'w-24',
      sel: (r) => (r.no_batch ? <span className="font-mono text-xs text-foreground">{r.no_batch}</span> : <span className="text-xs text-muted-foreground">Tanpa nomor</span>),
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
    { id: 'sisa', judul: 'Sisa hari', skeleton: 'w-16', sel: (r) => <SisaHari hari={r.sisa_hari} /> },
    { id: 'tgl', judul: 'Tanggal expired', kelas: 'hidden md:table-cell', skeleton: 'w-24', sel: (r) => <span className="whitespace-nowrap">{formatTanggal(r.expired_terdekat)}</span> },
  ]

  const adaFilter = Boolean(f.obat || f.kategori)
  const angka = (n: number) => (isError ? null : n)
  const dalam30 = rows.filter(r => r.sisa_hari <= 30).length
  const tercepat = rows.length > 0 ? Math.min(...rows.map(r => r.sisa_hari)) : null

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile compact icon={CalendarClock} label="Akan kedaluarsa" value={angka(rows.length)} sublabel={`obat, dalam ${f.hari} hari`} isLoading={isLoading} />
        <StatTile compact icon={TriangleAlert} label="Dalam 30 hari" value={angka(dalam30)} sublabel="paling mendesak" isLoading={isLoading} />
        <StatTile
          compact icon={Hourglass} label="Paling cepat" value={null} teks={isError || tercepat === null ? '-' : String(tercepat)}
          sublabel={isError || tercepat === null ? '' : 'hari lagi'} isLoading={isLoading}
        />
      </div>

      <Panel title="Laporan obat kedaluarsa" count={isLoading || isError ? undefined : rows.length} action={<AksiEkspor onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} alasanNonaktif={alasanEkspor(isLoading, isError, rows.length)} />} bodyClassName="px-0 pb-0">
        <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
          <FilterObat nilai={f.obat} onUbah={(v) => f.ubah({ obat: v || null })} />
          <FilterKategori nilai={f.kategori} onUbah={(v) => f.ubah({ kategori: v || null })} />
          {/* Jangka waktu: 4 pilihan, jadi Select (bukan Segmented). 90 hari adalah bawaan dan tidak ditulis di URL. */}
          <FilterPilihanHari nilai={f.hari} onUbah={(h) => f.ubah({ hari: h === 90 ? null : String(h) })} />
          {adaFilter && <AturUlang onClick={() => f.aturUlang('obat', 'kategori')} />}
        </FilterBar>
        <TabelLaporan
          kolom={kolom} baris={rows} kunci={(r) => r.id} isLoading={isLoading} isError={isError} onCobaLagi={() => refetch()}
          footer={[{ label: `${formatAngka(rows.length, 0)} jenis obat akan kedaluarsa` }]}
          kosong={{ icon: CalendarClock, judul: `Tidak ada obat yang kedaluarsa dalam ${f.hari} hari`, keterangan: adaFilter ? 'Ubah obat atau kategori, atau perpanjang jangka waktunya.' : 'Coba jangka waktu yang lebih panjang.', aksi: adaFilter ? <AturUlang onClick={() => f.aturUlang('obat', 'kategori')} /> : undefined }}
          halaman={f.halaman} onHalaman={(n) => f.ubah({ hal: n === 1 ? null : String(n) }, { resetHalaman: false })} noun="obat"
        />
      </Panel>
      <CatatanKolom />

      <PreviewLaporan open={preview} onClose={() => setPreview(false)}
        judul="Laporan Obat Kedaluarsa" keterangan={keteranganFilter}
        namaApotek={namaApotek} alamatApotek={alamatApotek}
        kolom={kolomEkspor} baris={baris} footerBaris={footerBaris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </>
  )
}

function FilterPilihanHari({ nilai, onUbah }: { nilai: number; onUbah: (h: number) => void }) {
  return (
    <FilterPilihan
      label="Jangka waktu" nilai={nilai === 90 ? "" : String(nilai)} onUbah={(v) => onUbah(Number(v) || 90)}
      semua="Dalam 90 hari"
      opsi={PILIHAN_HARI.filter((d) => d !== 90).map((d) => ({ value: String(d), label: `Dalam ${d} hari` }))}
      className="col-span-2 sm:col-span-1"
    />
  )
}
