'use client'

import { useCallback, useId, type ReactNode } from 'react'
import { Download, Eye, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ObatCombobox from '@/components/ui/ObatCombobox'
import { TabelData, type BarisPenutup, type KolomData } from '@/components/shared/TabelData'
import { useFilterUrl } from '@/components/shared/useFilterUrl'
import { useObatOpsi, useObatSemua } from '@/hooks/useObat'
import { usePengaturan } from '@/hooks/usePengaturan'
import { KATEGORI_OBAT } from '@/lib/constants'
import { gabungOpsi } from '@/lib/opsiObat'
import { cn } from '@/lib/utils'
import { KertasKartuStok, KertasLaporan } from './KertasPreview'

// ── Filter di URL ────────────────────────────────────────────────────────────
// Semua tab berbagi satu set parameter (?tab=&obat=&dari=&sampai=&kategori=&keterangan=&hari=&hal=), sehingga
// filter tidak hilang saat pindah tab atau memuat ulang halaman dan bisa dibagikan sebagai tautan. Nilai yang
// tidak dikenal diabaikan. Parameter yang tidak dipakai sebuah tab (mis. keterangan di tab Stok) tidak berpengaruh.
const FORMAT_TANGGAL = /^\d{4}-\d{2}-\d{2}$/
export const KETERANGAN_KELUAR = ['Penjualan', 'Retur', 'Rusak', 'Kedaluarsa', 'Lainnya'] as const
export const PILIHAN_HARI = [30, 60, 90, 180] as const

export interface FilterLaporan {
  obat: string
  dari: string
  sampai: string
  kategori: string
  keterangan: string
  hari: number
  halaman: number
  // Nomor halaman persis seperti di URL; null bila belum ada (tab yang memulai dari halaman terakhir memakai ini).
  halamanUrl: number | null
  // patch: nilai kosong/null menghapus parameter. Mengubah filter mengembalikan paginasi ke halaman 1.
  ubah: (patch: Record<string, string | null>, opsi?: { resetHalaman?: boolean }) => void
  aturUlang: (...kunci: string[]) => void
}

const tanggalValid = (s: string | null) => (s && FORMAT_TANGGAL.test(s) && !Number.isNaN(new Date(s).getTime()) ? s : '')

export function useFilterLaporan(): FilterLaporan {
  const { sp, ubahParam: ubah } = useFilterUrl()

  const aturUlang = useCallback((...kunci: string[]) => ubah(Object.fromEntries(kunci.map((k) => [k, null]))), [ubah])

  const kategoriUrl = sp.get('kategori') ?? ''
  const ketUrl = sp.get('keterangan') ?? ''
  const hariUrl = parseInt(sp.get('hari') ?? '', 10)
  return {
    obat: /^\d+$/.test(sp.get('obat') ?? '') ? (sp.get('obat') as string) : '',
    dari: tanggalValid(sp.get('dari')),
    sampai: tanggalValid(sp.get('sampai')),
    // Kategori boleh nilai apa pun yang dipakai obat (bukan hanya daftar baku); panjang dibatasi seperti di server.
    kategori: kategoriUrl.trim().length > 0 && kategoriUrl.length <= 40 ? kategoriUrl : '',
    keterangan: (KETERANGAN_KELUAR as readonly string[]).includes(ketUrl) ? ketUrl : '',
    hari: (PILIHAN_HARI as readonly number[]).includes(hariUrl) ? hariUrl : 90,
    halaman: Math.max(1, parseInt(sp.get('hal') ?? '1', 10) || 1),
    halamanUrl: sp.get('hal') ? Math.max(1, parseInt(sp.get('hal') ?? '1', 10) || 1) : null,
    ubah,
    aturUlang,
  }
}

// Nama dan alamat apotek untuk kop PDF dan pratinjau (dengan nilai bawaan yang sama seperti sebelumnya).
export function useIdentitasApotek() {
  const { data: pengaturan } = usePengaturan()
  return {
    namaApotek: pengaturan?.nama_apotek?.value || 'Apotek Rezky Medika',
    alamatApotek: pengaturan?.alamat_apotek?.value || '',
  }
}

// ── Kontrol filter ───────────────────────────────────────────────────────────

// Kolom pilihan (ketik untuk menyaring) dengan pilihan "semua" di urutan pertama; nilai kosong = semua.
export function FilterPilihan({
  label,
  nilai,
  onUbah,
  semua,
  opsi,
  className,
}: {
  label: string
  nilai: string
  onUbah: (v: string) => void
  semua: string
  opsi: { value: string; label: string }[]
  className?: string
}) {
  return (
    <PilihanCombobox
      aria-label={label}
      className={cn('w-full sm:w-44', className)}
      options={[{ value: '', label: semua }, ...opsi]}
      value={nilai}
      onChange={onUbah}
      noun={label.replace(/^(Filter|Jangka waktu)\s*/i, '').toLowerCase() || 'pilihan'}
    />
  )
}

export function FilterKategori({ nilai, onUbah }: { nilai: string; onUbah: (v: string) => void }) {
  const { data: opsiDb } = useObatOpsi()
  return (
    <FilterPilihan
      label="Filter kategori"
      nilai={nilai}
      onUbah={onUbah}
      semua="Semua kategori"
      opsi={gabungOpsi(KATEGORI_OBAT, opsiDb?.kategori)}
      className="col-span-2 sm:col-span-1"
    />
  )
}

export function FilterObat({ nilai, onUbah }: { nilai: string; onUbah: (v: string) => void }) {
  const { data } = useObatSemua()
  return (
    <div className="col-span-2 w-full sm:col-span-1 sm:w-64">
      <ObatCombobox obatList={data?.data ?? []} value={nilai} onChange={onUbah} placeholder="Semua obat" />
    </div>
  )
}

export function FilterTanggal({ dari, sampai, onUbah }: { dari: string; sampai: string; onUbah: (patch: { dari?: string | null; sampai?: string | null }) => void }) {
  const kelas = 'h-10 min-w-0 flex-1 rounded-xl text-sm sm:w-40 sm:flex-none'
  return (
    <div className="col-span-2 flex items-center gap-2 sm:col-span-1" role="group" aria-label="Rentang tanggal">
      <Input type="date" aria-label="Dari tanggal" value={dari} max={sampai || undefined} onChange={(e) => onUbah({ dari: e.target.value || null })} className={kelas} />
      <span className="text-sm text-muted-foreground" aria-hidden="true">s/d</span>
      <Input type="date" aria-label="Sampai tanggal" value={sampai} min={dari || undefined} onChange={(e) => onUbah({ sampai: e.target.value || null })} className={kelas} />
    </div>
  )
}

export function AturUlang({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="lg" className="col-span-2 h-10 rounded-xl px-3 text-muted-foreground sm:col-span-1" onClick={onClick}>
      Atur ulang
    </Button>
  )
}

// ── Aksi ekspor ──────────────────────────────────────────────────────────────
// Tiga tombol di kepala panel (kanan judul), terpisah dari bilah filter. PDF biru (satu aksi utama), Preview dan
// Excel outline. Di bawah sm hanya ikon 40px supaya judul panel tidak terdesak; labelnya tetap terbaca pembaca layar.
// Bila `alasanNonaktif` diisi, ketiganya mati dan alasannya tertulis (tooltip bawaan dan teks untuk pembaca layar).
export function alasanEkspor(isLoading: boolean, isError: boolean, jumlahBaris: number): string | undefined {
  if (isLoading) return 'Menunggu data selesai dimuat'
  if (isError) return 'Laporan gagal dimuat, jadi belum ada yang bisa diunduh'
  if (jumlahBaris === 0) return 'Tidak ada data untuk diunduh'
  return undefined
}

export function AksiEkspor({ onPreview, onExcel, onPDF, alasanNonaktif }: { onPreview: () => void; onExcel: () => void; onPDF: () => void; alasanNonaktif?: string }) {
  const ikonSaja = 'max-sm:w-10 max-sm:gap-0 max-sm:px-0 max-sm:has-data-[icon=inline-start]:pl-0'
  const idAlasan = useId()
  const mati = Boolean(alasanNonaktif)
  const desc = mati ? idAlasan : undefined
  return (
    <div className="flex gap-2" title={alasanNonaktif}>
      <Button variant="outline" size="lg" className={cn('h-10 rounded-xl px-3', ikonSaja)} onClick={onPreview} disabled={mati} aria-describedby={desc}>
        <Eye data-icon="inline-start" />
        <span className="max-sm:sr-only">Preview</span>
      </Button>
      <Button variant="outline" size="lg" className={cn('h-10 rounded-xl px-3', ikonSaja)} onClick={onExcel} disabled={mati} aria-describedby={desc}>
        <FileSpreadsheet data-icon="inline-start" />
        <span className="max-sm:sr-only">Excel</span>
      </Button>
      <Button size="lg" className={cn('h-10 rounded-xl px-4', ikonSaja)} onClick={onPDF} disabled={mati} aria-describedby={desc}>
        <Download data-icon="inline-start" />
        <span className="max-sm:sr-only">PDF</span>
      </Button>
      {mati && <span id={idAlasan} className="sr-only">{alasanNonaktif}</span>}
    </div>
  )
}

// ── Dialog pratinjau ─────────────────────────────────────────────────────────
// Pembungkus bergaya v2 (Dialog dengan fokus terjebak dan Esc); lembar kertas di dalamnya tidak diubah.
function BingkaiPreview({
  open,
  onClose,
  jumlah,
  onDownloadPDF,
  onDownloadExcel,
  children,
}: {
  open: boolean
  onClose: () => void
  jumlah: number
  onDownloadPDF: () => void
  onDownloadExcel: () => void
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 rounded-2xl p-0 sm:max-w-5xl">
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle className="text-base font-semibold">Preview laporan</DialogTitle>
          <DialogDescription>Pratinjau isi laporan. File PDF dan Excel yang diunduh memuat data yang sama. Gulir ke samping bila layar sempit.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted p-4 sm:p-6">{children}</div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <span className="text-sm tabular-nums text-muted-foreground">{jumlah} data akan diekspor</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={onClose}>Tutup</Button>
            <Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={() => { onDownloadExcel(); onClose() }}>
              <FileSpreadsheet data-icon="inline-start" />
              Download Excel
            </Button>
            <Button size="lg" className="h-10 rounded-xl px-4" onClick={() => { onDownloadPDF(); onClose() }}>
              <Download data-icon="inline-start" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface PreviewLaporanProps {
  open: boolean
  onClose: () => void
  judul: string
  keterangan?: string
  namaApotek: string
  alamatApotek: string
  kolom: string[]
  baris: (string | number)[][]
  footerBaris?: (string | number)[][]
  onDownloadPDF: () => void
  onDownloadExcel: () => void
}

export function PreviewLaporan({ open, onClose, onDownloadPDF, onDownloadExcel, ...kertas }: PreviewLaporanProps) {
  return (
    <BingkaiPreview open={open} onClose={onClose} jumlah={kertas.baris.length} onDownloadPDF={onDownloadPDF} onDownloadExcel={onDownloadExcel}>
      <KertasLaporan {...kertas} />
    </BingkaiPreview>
  )
}

interface PreviewKartuStokProps {
  open: boolean
  onClose: () => void
  info: { namaApotek: string; alamatApotek: string; kodeObat: string; namaObat: string; kemasan: string; satuan: string; tanggalFilter: string }
  kolom: string[]
  baris: (string | number)[][]
  onDownloadPDF: () => void
  onDownloadExcel: () => void
}

export function PreviewKartuStok({ open, onClose, onDownloadPDF, onDownloadExcel, info, kolom, baris }: PreviewKartuStokProps) {
  return (
    <BingkaiPreview open={open} onClose={onClose} jumlah={baris.length} onDownloadPDF={onDownloadPDF} onDownloadExcel={onDownloadExcel}>
      <KertasKartuStok info={info} kolom={kolom} baris={baris} />
    </BingkaiPreview>
  )
}

// ── Tabel laporan ────────────────────────────────────────────────────────────
// Tabel generik ada di components/shared/TabelData.tsx; di sini hanya mengisi teks keadaan gagal khas laporan.
export type KolomLaporan<T> = KolomData<T>
export type { BarisPenutup }

type PropTabelLaporan<T> = Omit<React.ComponentProps<typeof TabelData<T>>, 'judulGagal' | 'keteranganGagal'>

export function TabelLaporan<T>(props: PropTabelLaporan<T>) {
  return <TabelData<T> {...props} judulGagal="Laporan belum bisa dimuat" keteranganGagal="Ini bukan berarti datanya kosong. Periksa sambungan lalu coba lagi." />
}

// Keterangan di bawah panel: tabel di layar hanya memuat kolom yang muat; ekspor memuat semuanya.
export function CatatanKolom() {
  return (
    <p className="text-sm text-muted-foreground">
      Tabel di layar menampilkan kolom yang muat; PDF dan Excel selalu memuat semua kolom dan semua baris, bukan hanya halaman ini.
    </p>
  )
}
