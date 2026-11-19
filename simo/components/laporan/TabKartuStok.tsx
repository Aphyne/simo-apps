'use client'

import { useMemo, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Flag, Package, ScrollText } from 'lucide-react'
import { useLaporanKartuStok, type LaporanKartuStokItem } from '@/hooks/useLaporan'
import { useObatSemua } from '@/hooks/useObat'
import { exportKartuStokPDF, exportExcel } from '@/lib/export'
import { formatTanggal } from '@/lib/utils'
import { StatTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import { FilterBar } from '@/components/shared/FilterBar'
import ExpiredCell from '@/components/shared/ExpiredCell'
import StateMessage from '@/components/shared/StateMessage'
import {
  AksiEkspor, alasanEkspor, AturUlang, CatatanKolom, FilterObat, FilterTanggal, PreviewKartuStok, TabelLaporan,
  useFilterLaporan, useIdentitasApotek, type KolomLaporan,
} from './laporanKit'

// Riwayat mutasi stok (masuk + keluar) satu obat, kronologis, dengan saldo berjalan.
// Urutan sengaja lama ke baru (buku kartu); halaman yang terbuka pertama adalah yang terakhir, jadi catatan terbaru langsung terlihat.
export default function TabKartuStok() {
  const f = useFilterLaporan()
  const [preview, setPreview] = useState(false)
  const { data: obatData } = useObatSemua()
  const selectedObat = useMemo(() => (obatData?.data ?? []).find(o => String(o.id) === f.obat), [obatData, f.obat])
  const { namaApotek, alamatApotek } = useIdentitasApotek()

  const { data, isLoading, isError, refetch } = useLaporanKartuStok(f.obat || undefined, f.dari || undefined, f.sampai || undefined)
  const rows = useMemo(() => data?.data ?? [], [data])

  const tanggalFilter = f.dari && f.sampai ? `${formatTanggal(f.dari)} – ${formatTanggal(f.sampai)}`
    : f.dari ? `Sejak ${formatTanggal(f.dari)}`
    : f.sampai ? `Sampai ${formatTanggal(f.sampai)}`
    : 'Semua periode'

  const kolomEkspor = ['Tanggal', 'Keterangan', 'Masuk', 'Keluar', 'Sisa', 'Expired', 'Dicatat Oleh']
  const baris = rows.map(r => [
    formatTanggal(r.tanggal),
    `${r.jenis} - ${r.keterangan}`,
    r.masuk > 0 ? r.masuk : '-',
    r.keluar > 0 ? r.keluar : '-',
    r.sisa,
    r.expired_batch ? formatTanggal(r.expired_batch) : '-',
    r.nama_user ?? 'Tidak tercatat',
  ])

  const satuanKapital = selectedObat ? selectedObat.satuan.charAt(0).toUpperCase() + selectedObat.satuan.slice(1) : ''
  const kartuStokInfo = selectedObat ? {
    namaApotek,
    alamatApotek,
    kodeObat: selectedObat.kode,
    namaObat: selectedObat.nama,
    kemasan: `1 dus = ${selectedObat.satuan_per_dus} ${satuanKapital}`,
    satuan: satuanKapital,
    tanggalFilter,
  } : null

  function handlePDF() {
    if (!kartuStokInfo) return
    exportKartuStokPDF(kartuStokInfo, kolomEkspor, baris)
  }
  function handleExcel() {
    if (!selectedObat) return
    exportExcel(`Kartu_Stok_${selectedObat.kode}`, kolomEkspor, baris)
  }

  // Selalu: Tanggal, Keterangan, Masuk, Keluar, Sisa. xl: Expired batch. 2xl: Dicatat oleh.
  const kolom: KolomLaporan<LaporanKartuStokItem>[] = [
    { id: 'tanggal', judul: 'Tanggal', skeleton: 'w-24', sel: (r) => <span className="whitespace-nowrap">{formatTanggal(r.tanggal)}</span> },
    {
      id: 'ket', judul: 'Keterangan', skeleton: 'w-36',
      sel: (r) => (
        <>
          <span className="font-medium text-foreground">{r.jenis}</span>
          <span className="text-muted-foreground"> · {r.keterangan}</span>
        </>
      ),
    },
    { id: 'masuk', judul: 'Masuk', kanan: true, skeleton: 'w-10', sel: (r) => <span className="tabular-nums">{r.masuk > 0 ? r.masuk : <span className="text-muted-foreground">-</span>}</span> },
    { id: 'keluar', judul: 'Keluar', kanan: true, skeleton: 'w-10', sel: (r) => <span className="tabular-nums">{r.keluar > 0 ? r.keluar : <span className="text-muted-foreground">-</span>}</span> },
    { id: 'sisa', judul: 'Sisa', kanan: true, skeleton: 'w-12', sel: (r) => <span className="font-semibold tabular-nums text-foreground">{r.sisa}</span> },
    { id: 'exp', judul: 'Expired batch', kelas: 'hidden xl:table-cell', skeleton: 'w-20', sel: (r) => <ExpiredCell tanggal={r.expired_batch} /> },
    { id: 'oleh', judul: 'Dicatat oleh', kelas: 'hidden 2xl:table-cell', skeleton: 'w-24', sel: (r) => r.nama_user ?? <span className="text-xs text-muted-foreground">Tidak tercatat</span> },
  ]

  const adaFilter = Boolean(f.dari || f.sampai)
  const angka = (n: number) => (isError ? null : n)
  const totalMasuk = rows.reduce((s, r) => s + r.masuk, 0)
  // Saldo sebelum catatan pertama = sisa pertama dikurangi masuknya dan ditambah keluarnya; saldo akhir = sisa terakhir.
  const saldoAwal = rows.length > 0 ? rows[0].sisa - rows[0].masuk + rows[0].keluar : null
  const saldoAkhir = rows.length > 0 ? rows[rows.length - 1].sisa : null
  const totalKeluar = rows.reduce((s, r) => s + r.keluar, 0)

  return (
    <>
      {selectedObat && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Saldo awal + masuk - keluar = saldo akhir, sehingga kartu bisa dicocokkan. */}
          <StatTile compact icon={Package} label="Saldo awal" value={null} teks={isError || saldoAwal === null ? '-' : String(saldoAwal)} sublabel={isError || saldoAwal === null ? '' : `${selectedObat.satuan}, sebelum ${tanggalFilter === 'Semua periode' ? 'catatan pertama' : 'periode ini'}`} isLoading={isLoading} />
          <StatTile compact icon={ArrowDownToLine} label="Masuk" value={angka(totalMasuk)} sublabel={selectedObat.satuan} isLoading={isLoading} />
          <StatTile compact icon={ArrowUpFromLine} label="Keluar" value={angka(totalKeluar)} sublabel={selectedObat.satuan} isLoading={isLoading} />
          <StatTile
            compact icon={Flag} label="Saldo akhir" value={null} teks={isError || saldoAkhir === null ? '-' : String(saldoAkhir)}
            sublabel={isError || saldoAkhir === null ? '' : saldoAkhir !== selectedObat.stok ? `stok saat ini ${selectedObat.stok} ${selectedObat.satuan}` : selectedObat.satuan}
            isLoading={isLoading}
          />
        </div>
      )}

      <Panel title={selectedObat ? `Kartu stok ${selectedObat.nama}` : 'Kartu stok'} count={selectedObat && !isLoading && !isError ? rows.length : undefined} action={selectedObat ? <AksiEkspor onPreview={() => setPreview(true)} onExcel={handleExcel} onPDF={handlePDF} alasanNonaktif={alasanEkspor(isLoading, isError, rows.length)} /> : undefined} bodyClassName="px-0 pb-0">
        <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
          <FilterObat nilai={f.obat} onUbah={(v) => f.ubah({ obat: v || null })} />
          <FilterTanggal dari={f.dari} sampai={f.sampai} onUbah={f.ubah} />
          {adaFilter && <AturUlang onClick={() => f.aturUlang('dari', 'sampai')} />}
        </FilterBar>
        {!selectedObat ? (
          <StateMessage
            icon={ScrollText}
            title="Pilih obat dulu"
            description="Kartu stok menampilkan semua stok masuk dan keluar satu obat beserta sisanya."
            className="border-t border-border"
          />
        ) : (
          <TabelLaporan
            kolom={kolom} baris={rows} kunci={(_, i) => i} isLoading={isLoading} isError={isError} onCobaLagi={() => refetch()}
            kosong={{ icon: ScrollText, judul: 'Belum ada mutasi', keterangan: adaFilter ? 'Tidak ada stok masuk atau keluar pada periode ini.' : 'Obat ini belum pernah masuk atau keluar.', aksi: adaFilter ? <AturUlang onClick={() => f.aturUlang('dari', 'sampai')} /> : undefined }}
            halaman={f.halamanUrl} awalDiAkhir onHalaman={(n) => f.ubah({ hal: String(n) }, { resetHalaman: false })} noun="mutasi"
          />
        )}
      </Panel>
      {selectedObat && <CatatanKolom />}

      {kartuStokInfo && (
        <PreviewKartuStok open={preview} onClose={() => setPreview(false)}
          info={kartuStokInfo} kolom={kolomEkspor} baris={baris} onDownloadPDF={handlePDF} onDownloadExcel={handleExcel} />
      )}
    </>
  )
}
