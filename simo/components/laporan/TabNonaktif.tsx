'use client'

// Dua tab yang saat ini DINONAKTIFKAN di halaman Laporan (lihat TABS di app/(dashboard)/laporan/page.tsx):
// EOQ & ROP (menu Perhitungan nonaktif) dan Skenario Simulasi. Dipindah apa adanya ke pola v2 supaya bisa
// diaktifkan lagi nanti; belum diuji di layar karena tidak tampil.
import { useMemo, useState } from 'react'
import { useLaporanEoqRop, type LaporanEoqRopItem } from '@/hooks/useLaporan'
import { useSimulasiList } from '@/hooks/useSimulasi'
import { exportPDF, exportExcel } from '@/lib/export'
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/utils'
import Panel from '@/components/dashboard/Panel'
import { FilterBar } from '@/components/shared/FilterBar'
import {
  AksiEkspor, alasanEkspor, AturUlang, CatatanKolom, FilterKategori, FilterObat, PreviewLaporan, TabelLaporan,
  useFilterLaporan, useIdentitasApotek, type KolomLaporan,
} from './laporanKit'

function nilaiStr(v: number | null | undefined) {
  if (v == null) return '-'
  return Math.round(v).toLocaleString('id-ID')
}

export function TabEoqRop() {
  const f = useFilterLaporan()
  const [preview, setPreview] = useState(false)
  const { data, isLoading, isError, refetch } = useLaporanEoqRop(f.kategori || undefined, f.obat || undefined)
  const rows = useMemo(() => data ?? [], [data])
  const { namaApotek, alamatApotek } = useIdentitasApotek()

  const kolomEkspor = ['Kode', 'Nama Obat', 'Satuan', 'Demand/Thn', 'B. Pesan', 'B. Simpan', 'Lead Time', 'EOQ', 'Safety Stock', 'ROP', 'Total Biaya/Thn']
  const baris = rows.map(r => [
    r.kode, r.nama, r.satuan,
    nilaiStr(r.demand_tahunan),
    formatRupiah(r.biaya_pesan), formatRupiah(r.biaya_simpan),
    `${r.lead_time} hr`,
    nilaiStr(r.eoq), nilaiStr(r.safety_stock), nilaiStr(r.rop),
    r.total_biaya != null ? formatRupiah(r.total_biaya) : '-',
  ])
  const keterangan = f.kategori ? `Kategori: ${f.kategori}` : undefined

  function handlePDF() { exportPDF('Laporan EOQ & ROP', kolomEkspor, baris, keterangan, undefined, namaApotek, alamatApotek) }
  function handleExcel() {
    const kolomXls = ['Kode', 'Nama Obat', 'Satuan', 'Kategori', 'Demand Harian', 'Demand Tahunan', 'Std Dev', 'Biaya Pesan', 'Biaya Simpan', 'Lead Time (hr)', 'EOQ', 'Safety Stock', 'ROP', 'Total Biaya/Thn']
    const barisXls = rows.map(r => [
      r.kode, r.nama, r.satuan, r.kategori,
      r.demand_harian ?? '', r.demand_tahunan ?? '', r.std_dev_demand ?? '',
      r.biaya_pesan, r.biaya_simpan, r.lead_time,
      r.eoq ?? '', r.safety_stock ?? '', r.rop ?? '', r.total_biaya ?? '',
    ])
    exportExcel('Laporan_EOQ_ROP', kolomXls, barisXls)
  }

  const kolom: KolomLaporan<LaporanEoqRopItem>[] = [
    {
      id: 'obat', judul: 'Obat',
      sel: (r) => (
        <>
          <span className="block font-medium text-foreground">{r.nama}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground"><span className="font-mono">{r.kode}</span> · {r.satuan}</span>
        </>
      ),
    },
    { id: 'eoq', judul: 'EOQ', kanan: true, sel: (r) => <span className="font-medium tabular-nums text-foreground">{nilaiStr(r.eoq)}</span> },
    { id: 'rop', judul: 'ROP', kanan: true, sel: (r) => <span className="font-medium tabular-nums text-foreground">{nilaiStr(r.rop)}</span> },
    { id: 'ss', judul: 'Safety stock', kanan: true, kelas: 'hidden md:table-cell', sel: (r) => <span className="tabular-nums">{nilaiStr(r.safety_stock)}</span> },
    { id: 'demand', judul: 'Demand/thn', kanan: true, kelas: 'hidden xl:table-cell', sel: (r) => <span className="tabular-nums">{nilaiStr(r.demand_tahunan)}</span> },
    { id: 'pesan', judul: 'B. pesan', kanan: true, kelas: 'hidden xl:table-cell', sel: (r) => <span className="tabular-nums">{formatRupiah(r.biaya_pesan)}</span> },
    { id: 'simpan', judul: 'B. simpan', kanan: true, kelas: 'hidden 2xl:table-cell', sel: (r) => <span className="tabular-nums">{formatRupiah(r.biaya_simpan)}</span> },
    { id: 'lt', judul: 'Lead time', kanan: true, kelas: 'hidden 2xl:table-cell', sel: (r) => <span className="tabular-nums">{r.lead_time} hr</span> },
    { id: 'biaya', judul: 'Total biaya/thn', kanan: true, kelas: 'hidden 2xl:table-cell', sel: (r) => <span className="tabular-nums">{r.total_biaya != null ? formatRupiah(r.total_biaya) : '-'}</span> },
  ]
  const adaFilter = Boolean(f.obat || f.kategori)

  return (
    <>
      <Panel title="Laporan EOQ & ROP" count={isLoading || isError ? undefined : rows.length} action={<AksiEkspor onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} alasanNonaktif={alasanEkspor(isLoading, isError, rows.length)} />} bodyClassName="px-0 pb-0">
        <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
          <FilterObat nilai={f.obat} onUbah={(v) => f.ubah({ obat: v || null })} />
          <FilterKategori nilai={f.kategori} onUbah={(v) => f.ubah({ kategori: v || null })} />
          {adaFilter && <AturUlang onClick={() => f.aturUlang('obat', 'kategori')} />}
        </FilterBar>
        <TabelLaporan
          kolom={kolom} baris={rows} kunci={(r) => r.id} isLoading={isLoading} isError={isError} onCobaLagi={() => refetch()}
          kosong={{ judul: 'Tidak ada obat yang cocok', keterangan: 'Ubah obat atau kategori yang dipilih.' }}
          halaman={f.halaman} onHalaman={(n) => f.ubah({ hal: n === 1 ? null : String(n) }, { resetHalaman: false })} noun="obat"
        />
      </Panel>
      <CatatanKolom />
      <PreviewLaporan open={preview} onClose={() => setPreview(false)}
        judul="Laporan EOQ & ROP" keterangan={keterangan} namaApotek={namaApotek} alamatApotek={alamatApotek}
        kolom={kolomEkspor} baris={baris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </>
  )
}

export function TabSimulasi() {
  const f = useFilterLaporan()
  const [preview, setPreview] = useState(false)
  const { data, isLoading, isError, refetch } = useSimulasiList()
  const rows = useMemo(() => data ?? [], [data])
  const { namaApotek, alamatApotek } = useIdentitasApotek()
  type Baris = (typeof rows)[number]

  const kolomEkspor = ['Nama Skenario', 'Obat', 'EOQ Sek.', 'EOQ Sim.', 'SS Sek.', 'SS Sim.', 'ROP Sek.', 'ROP Sim.', 'TC Sek.', 'TC Sim.', 'Dibuat']
  const baris = rows.map(r => [
    r.nama_skenario,
    `${r.nama_obat} (${r.kode_obat})`,
    nilaiStr(r.hasil_simulasi.aktual.eoq),
    nilaiStr(r.hasil_simulasi.simulasi.eoq),
    Math.round(r.hasil_simulasi.aktual.safety_stock).toLocaleString('id-ID'),
    Math.round(r.hasil_simulasi.simulasi.safety_stock).toLocaleString('id-ID'),
    Math.round(r.hasil_simulasi.aktual.rop).toLocaleString('id-ID'),
    Math.round(r.hasil_simulasi.simulasi.rop).toLocaleString('id-ID'),
    r.hasil_simulasi.aktual.total_biaya != null ? formatRupiah(r.hasil_simulasi.aktual.total_biaya) : '-',
    r.hasil_simulasi.simulasi.total_biaya != null ? formatRupiah(r.hasil_simulasi.simulasi.total_biaya) : '-',
    formatTanggal(r.created_at),
  ])

  function handlePDF() { exportPDF('Laporan Skenario Simulasi', kolomEkspor, baris, undefined, undefined, namaApotek, alamatApotek) }
  function handleExcel() {
    const kolomXls = [
      'Nama Skenario', 'Nama Obat', 'Kode', 'Satuan', 'Dibuat Oleh',
      'EOQ Sekarang', 'EOQ Simulasi', 'SS Sekarang', 'SS Simulasi',
      'ROP Sekarang', 'ROP Simulasi', 'TC Sekarang', 'TC Simulasi',
      'Δ Demand (%)', 'Lead Time Baru (hr)', 'B. Pesan Baru', 'B. Simpan Baru', 'Tanggal Dibuat',
    ]
    const barisXls = rows.map(r => [
      r.nama_skenario, r.nama_obat, r.kode_obat, r.satuan, r.nama_user ?? '',
      r.hasil_simulasi.aktual.eoq ?? '', r.hasil_simulasi.simulasi.eoq ?? '',
      Math.round(r.hasil_simulasi.aktual.safety_stock), Math.round(r.hasil_simulasi.simulasi.safety_stock),
      Math.round(r.hasil_simulasi.aktual.rop), Math.round(r.hasil_simulasi.simulasi.rop),
      r.hasil_simulasi.aktual.total_biaya ?? '', r.hasil_simulasi.simulasi.total_biaya ?? '',
      r.parameter_input.demand_perubahan_pct ?? 0,
      r.parameter_input.lead_time_baru ?? '',
      r.parameter_input.biaya_pesan_baru ?? '',
      r.parameter_input.biaya_simpan_baru ?? '',
      r.created_at,
    ])
    exportExcel('Laporan_Simulasi', kolomXls, barisXls)
  }

  const pasangan = (aktual: string, simulasi: string) => (
    <>
      <span className="block text-xs text-muted-foreground">Sekarang: {aktual}</span>
      <span className="block font-medium tabular-nums text-foreground">Simulasi: {simulasi}</span>
    </>
  )
  const kolom: KolomLaporan<Baris>[] = [
    {
      id: 'skenario', judul: 'Skenario',
      sel: (r) => (
        <>
          <span className="block font-medium text-foreground">{r.nama_skenario}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{r.nama_obat} · <span className="font-mono">{r.kode_obat}</span></span>
        </>
      ),
    },
    { id: 'eoq', judul: 'EOQ', sel: (r) => pasangan(nilaiStr(r.hasil_simulasi.aktual.eoq), nilaiStr(r.hasil_simulasi.simulasi.eoq)) },
    { id: 'rop', judul: 'ROP', kelas: 'hidden md:table-cell', sel: (r) => pasangan(Math.round(r.hasil_simulasi.aktual.rop).toLocaleString('id-ID'), Math.round(r.hasil_simulasi.simulasi.rop).toLocaleString('id-ID')) },
    { id: 'ss', judul: 'Safety stock', kelas: 'hidden xl:table-cell', sel: (r) => pasangan(Math.round(r.hasil_simulasi.aktual.safety_stock).toLocaleString('id-ID'), Math.round(r.hasil_simulasi.simulasi.safety_stock).toLocaleString('id-ID')) },
    {
      id: 'biaya', judul: 'Total biaya/thn', kelas: 'hidden xl:table-cell',
      sel: (r) => pasangan(
        r.hasil_simulasi.aktual.total_biaya != null ? formatRupiah(r.hasil_simulasi.aktual.total_biaya) : '-',
        r.hasil_simulasi.simulasi.total_biaya != null ? formatRupiah(r.hasil_simulasi.simulasi.total_biaya) : '-'
      ),
    },
    { id: 'dibuat', judul: 'Dibuat', kelas: 'hidden 2xl:table-cell', sel: (r) => <span className="whitespace-nowrap">{formatTanggal(r.created_at)}</span> },
  ]

  return (
    <>
      <Panel title="Laporan skenario simulasi" count={isLoading || isError ? undefined : rows.length} action={<AksiEkspor onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} alasanNonaktif={alasanEkspor(isLoading, isError, rows.length)} />} bodyClassName="px-0 pb-0">
        <TabelLaporan
          kolom={kolom} baris={rows} kunci={(r) => r.id} isLoading={isLoading} isError={isError} onCobaLagi={() => refetch()}
          footer={[{ label: `${formatAngka(rows.length, 0)} skenario tersimpan` }]}
          kosong={{ judul: 'Belum ada skenario tersimpan', keterangan: 'Skenario dibuat dari halaman Simulasi.' }}
          halaman={f.halaman} onHalaman={(n) => f.ubah({ hal: n === 1 ? null : String(n) }, { resetHalaman: false })} noun="skenario"
        />
      </Panel>
      <PreviewLaporan open={preview} onClose={() => setPreview(false)}
        judul="Laporan Skenario Simulasi" namaApotek={namaApotek} alamatApotek={alamatApotek}
        kolom={kolomEkspor} baris={baris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
    </>
  )
}
