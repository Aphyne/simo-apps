'use client'

import { Check, ListPlus, Plus, X, TriangleAlert, SearchX, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import StatusBadge from '@/components/ui/StatusBadge'
import Panel from '@/components/dashboard/Panel'
import Istilah from '@/components/shared/Istilah'
import { FilterBar, SearchField } from '@/components/shared/FilterBar'
import { TabelData, type KolomData } from '@/components/shared/TabelData'
import { formatAngka } from '@/lib/utils'
import type { ReorderAlertItem } from '@/hooks/useObat'

export interface FilterSupplier {
  key: string // 'semua' | 'none' | id supplier
  label: string
  jumlah: number
}

interface Props {
  items: ReorderAlertItem[] // sudah terfilter sesuai supplier dan kata kunci
  filters: FilterSupplier[]
  filterAktif: string
  onFilter: (key: string) => void
  cari: string
  onCari: (teks: string) => void
  adaFilter: boolean
  onAturUlang: () => void
  diKeranjang: (id: number) => boolean
  onToggle: (item: ReorderAlertItem) => void
  onTambahSemua: (items: ReorderAlertItem[]) => void
  isLoading: boolean
  isError: boolean
  onCobaLagi: () => void
  // Jumlah obat di keranjang; dipakai tautan "Keranjang" yang hanya tampil di layar sempit (keranjang ada di bawah daftar).
  jumlahKeranjang: number
}

// Kolom tampil bertahap menurut lebar konten (bukan lebar layar): sidebar 256px muncul mulai lg, dan daftar berdampingan
// dengan keranjang mulai xl. Selalu: Obat, Saran pesan, Aksi. md: Status (di bawah md ikut di bawah nama). 2xl: Stok dan ROP.
// Isi per dus: md sampai sebelum xl, lalu 2xl.
const KOLOM = {
  status: 'hidden md:table-cell',
  stok: 'hidden 2xl:table-cell',
  // Isi per dus: tampil saat daftar selebar halaman (md sampai sebelum xl) dan lagi di 2xl; disembunyikan di xl saat
  // daftar berdampingan dengan keranjang supaya kolom tidak berdesakan.
  isi: 'hidden md:table-cell xl:hidden 2xl:table-cell',
}

export default function ReorderObatList({
  items,
  filters,
  filterAktif,
  onFilter,
  cari,
  onCari,
  adaFilter,
  onAturUlang,
  diKeranjang,
  onToggle,
  onTambahSemua,
  isLoading,
  isError,
  onCobaLagi,
  jumlahKeranjang,
}: Props) {
  const bisaDitambah = items.filter((it) => it.supplier_id !== null && !diKeranjang(it.id))
  const tautanKeranjang = (
    <a
      href="#keranjang"
      className="inline-flex h-10 items-center rounded-xl px-2 text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
    >
      Keranjang ({jumlahKeranjang})
    </a>
  )

  const kolom: KolomData<ReorderAlertItem>[] = [
    {
      id: 'obat', judul: 'Obat', skeleton: ['w-40', 'w-24'],
      sel: (it) => {
        const supplier = it.supplier_nama ?? it.nama_supplier
        return (
          <>
            <span className="block font-medium text-foreground">{it.nama}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              <span className="font-mono">{it.kode}</span>
              {' · '}
              {supplier ?? 'Supplier belum diatur'}
            </span>
            <span className="mt-1.5 block md:hidden">
              <StatusBadge status="HARUS_REORDER" stok={it.stok} />
            </span>
            {/* Penanda terlihat (ikon + teks, bukan hanya warna latar) supaya jelas obat mana yang sudah dipilih. */}
            {diKeranjang(it.id) && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Check className="size-3.5" aria-hidden="true" />
                Di keranjang
              </span>
            )}
          </>
        )
      },
    },
    {
      id: 'status', judul: 'Status', kelas: KOLOM.status, skeleton: 'w-20',
      sel: (it) => <StatusBadge status="HARUS_REORDER" stok={it.stok} />,
    },
    {
      id: 'stok',
      judul: <>Stok / <Istilah istilah="ROP" arti="Titik pesan ulang: stok di bawah angka ini berarti saatnya memesan" /></>,
      kanan: true, kelas: KOLOM.stok, skeleton: 'w-16',
      sel: (it) => (
        <span className="tabular-nums">
          <span className="block font-medium text-foreground">{formatAngka(it.stok, 0)} / {formatAngka(it.rop, 0)}</span>
          <span className="block text-xs text-muted-foreground">{it.satuan}</span>
        </span>
      ),
    },
    {
      // Isi per dus di kiri Saran pesan, supaya "N dus" bisa langsung dibaca dalam satuan obat (permintaan Boss 26 Nov 2026).
      // Obat yang tidak dipesan per dus (isi 1) ditulis "-" karena sarannya sudah dalam satuan obat.
      id: 'isi', judul: 'Isi per dus', kanan: true, kelas: KOLOM.isi, skeleton: 'w-14',
      sel: (it) => {
        const isi = Number(it.satuan_per_dus) || 1
        if (isi <= 1) {
          return (
            <span className="text-muted-foreground">
              <span aria-hidden="true">-</span>
              <span className="sr-only">Tidak dipesan per dus</span>
            </span>
          )
        }
        return (
          <span className="tabular-nums">
            <span className="block font-medium text-foreground">{formatAngka(isi, 0)}</span>
            <span className="block text-xs text-muted-foreground">{it.satuan}</span>
          </span>
        )
      },
    },
    {
      id: 'saran', judul: 'Saran pesan', kanan: true, skeleton: 'w-14',
      sel: (it) => (
        <span className="tabular-nums">
          <span className="block font-medium text-foreground">{formatAngka(it.saran_jumlah, 0)} {it.satuan_pesan}</span>
          <span className="block text-xs text-muted-foreground">dari {it.basis_saran}</span>
        </span>
      ),
    },
    {
      id: 'aksi', judul: <span className="sr-only">Aksi</span>, kanan: true, aksi: true, skeleton: 'w-24',
      sel: (it) => {
        const ada = diKeranjang(it.id)
        if (it.supplier_id === null) {
          return (
            <span className="inline-flex items-center justify-end gap-1.5 text-xs font-medium text-warning-700">
              <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
              Catat stok masuk dulu
            </span>
          )
        }
        return (
          <Button
            variant="outline"
            size="lg"
            className="h-10 min-w-28 rounded-xl px-3"
            onClick={() => onToggle(it)}
            aria-label={ada ? `Keluarkan ${it.nama} dari keranjang` : `Tambah ${it.nama} ke keranjang`}
          >
            {ada ? <X data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
            {ada ? 'Batalkan' : 'Tambah'}
          </Button>
        )
      },
    },
  ]

  return (
    <Panel title="Obat yang perlu dipesan" count={isLoading || isError ? undefined : items.length} action={tautanKeranjang} bodyClassName="px-0 pb-0">
      <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
        <SearchField value={cari} onChange={onCari} placeholder="Cari nama atau kode obat" label="Cari obat" className="col-span-2 sm:max-w-xs" />
        <PilihanCombobox
          aria-label="Filter supplier"
          className="col-span-2 sm:w-56"
          options={filters.map((f) => ({ value: f.key, label: `${f.key === 'semua' ? 'Semua supplier' : f.label} (${f.jumlah})` }))}
          value={filterAktif}
          onChange={onFilter}
          noun="supplier"
        />
        {adaFilter && (
          <Button variant="ghost" size="lg" className="h-10 rounded-xl px-3 text-muted-foreground" onClick={onAturUlang}>
            Atur ulang
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          className="col-span-2 h-10 rounded-xl px-4 sm:ml-auto"
          onClick={() => onTambahSemua(bisaDitambah)}
          disabled={bisaDitambah.length === 0}
        >
          <ListPlus data-icon="inline-start" />
          Tambah semua ({bisaDitambah.length})
        </Button>
      </FilterBar>

      {/* Semua baris ditampilkan sekaligus (tanpa paginasi): daftar ini dipakai untuk memilih obat ke keranjang. */}
      <TabelData
        kolom={kolom}
        baris={items}
        kunci={(it) => it.id}
        isLoading={isLoading}
        isError={isError}
        onCobaLagi={onCobaLagi}
        judulGagal="Daftar obat belum bisa dimuat"
        keteranganGagal="Ini bukan berarti semua stok aman. Periksa sambungan lalu coba lagi."
        kosong={{
          icon: adaFilter ? SearchX : PackageCheck,
          judul: adaFilter ? 'Tidak ada obat yang cocok' : 'Tidak ada obat yang perlu dipesan',
          keterangan: adaFilter ? 'Ubah kata kunci atau pilih supplier lain.' : 'Semua stok masih di atas titik pesan ulang (ROP).',
          aksi: adaFilter ? <Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={onAturUlang}>Atur ulang filter</Button> : undefined,
        }}
        kelasBaris={(it) => (diKeranjang(it.id) ? 'bg-accent/50' : undefined)}
        halaman={null}
        perHalaman={Infinity}
        onHalaman={() => {}}
        noun="obat perlu dipesan"
      />
    </Panel>
  )
}
