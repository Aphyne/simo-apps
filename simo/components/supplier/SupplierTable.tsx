'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Clock, MessageCircle, Pencil, Phone, Plus, SearchX, Trash2, Truck, TriangleAlert, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { StatTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import PageHeader from '@/components/shared/PageHeader'
import { FilterBar, SearchField } from '@/components/shared/FilterBar'
import StateMessage from '@/components/shared/StateMessage'
import Segmented from '@/components/shared/Segmented'
import BarisKontak from '@/components/supplier/BarisKontak'
import KartuSupplier, { KartuSkeleton } from '@/components/supplier/SupplierKartu'
import { TabelData, type KolomData } from '@/components/shared/TabelData'
import { useCariTertunda, useFilterUrl } from '@/components/shared/useFilterUrl'
import IconAction from '@/components/shared/IconAction'
import { denganAsal } from '@/components/shared/useAsalHalaman'
import { useSupplierList, useDeleteSupplier } from '@/hooks/useSupplier'
import { normalisasiWa } from '@/lib/reorder'
import { formatAngka, formatRupiah } from '@/lib/utils'
import type { Supplier } from '@/types/supplier'

// Kolom tampil bertahap menurut lebar konten (sidebar 256px muncul mulai lg): selalu Supplier dan Aksi;
// md Kontak dan Lead time; xl Biaya pesan; 2xl Jenis obat. Di bawah md kontak ikut di bawah nama.
const KOLOM = {
  kontak: 'hidden md:table-cell',
  lead: 'hidden md:table-cell',
  biaya: 'hidden xl:table-cell',
  jenis: 'hidden 2xl:table-cell',
}

const adaWa = (s: Supplier) => !!normalisasiWa(s.whatsapp)

export default function SupplierTable() {
  const { data: suppliers = [], isLoading, isError, refetch } = useSupplierList()
  const deleteMutation = useDeleteSupplier()

  // Kata kunci, filter "tanpa WhatsApp", dan halaman disimpan di URL (?q=&wa=kosong&hal=), seperti Data Obat. Nilai tak dikenal diabaikan.
  const { sp, ubahParam } = useFilterUrl()
  const search = sp.get('q') ?? ''
  const tanpaWaSaja = sp.get('wa') === 'kosong'
  const halaman = Math.max(1, parseInt(sp.get('hal') ?? '1', 10) || 1)
  // Tampilan daftar: kartu (bawaan, satu kartu per supplier) atau tabel (?tampil=tabel, untuk membandingkan angka).
  const tabel = sp.get('tampil') === 'tabel'
  const [cari, setCari] = useCariTertunda(search, ubahParam)

  const tampil = useMemo(() => {
    const kata = search.trim().toLowerCase()
    return suppliers.filter((s) => {
      const cocokKata = !kata
        || s.nama.toLowerCase().includes(kata)
        || (s.jenis_obat ?? '').toLowerCase().includes(kata)
        || (s.alamat ?? '').toLowerCase().includes(kata)
      return cocokKata && (!tanpaWaSaja || !adaWa(s))
    })
  }, [suppliers, search, tanpaWaSaja])

  const adaFilter = search.trim() !== '' || tanpaWaSaja
  function aturUlang() {
    setCari('')
    ubahParam({ q: null, wa: null })
  }

  // Ringkasan. Data gagal dimuat tampil "-", bukan 0.
  const tanpaWa = suppliers.filter((s) => !adaWa(s)).length
  const rataLead = suppliers.length > 0 ? suppliers.reduce((sum, s) => sum + s.lead_time_avg, 0) / suppliers.length : null
  const terlama = suppliers.length > 0 ? suppliers.reduce((a, b) => (b.lead_time_avg > a.lead_time_avg ? b : a)) : null
  const biayaTerisi = suppliers.map((s) => Number(s.biaya_pesan)).filter((n) => n > 0)
  const rataBiaya = biayaTerisi.length > 0 ? biayaTerisi.reduce((a, b) => a + b, 0) / biayaTerisi.length : null
  // Bila semua supplier punya biaya yang sama, rata-rata tidak memberi informasi baru: ubin menyebutnya seragam.
  const biayaSeragam = biayaTerisi.length > 0 && biayaTerisi.every((n) => n === biayaTerisi[0])

  // Alamat daftar lengkap dengan filternya dibawa ke halaman ubah (?dari=), supaya Kembali dan Simpan mendarat di sini.
  const alamatDaftar = `/supplier${sp.toString() ? `?${sp.toString()}` : ''}`

  const kolom: KolomData<Supplier>[] = [
    {
      id: 'supplier', judul: 'Supplier', skeleton: ['w-44', 'w-60'],
      sel: (s) => (
        <>
          <Link href={denganAsal(`/supplier/${s.id}/edit`, alamatDaftar)} className="font-medium text-foreground outline-none hover:text-primary focus-visible:underline">
            {s.nama}
          </Link>
          <span className="mt-0.5 block max-w-md text-xs text-muted-foreground">{s.alamat || 'Alamat belum diisi'}</span>
          <span className="mt-1.5 block space-y-1 text-xs md:hidden">
            <BarisKontak ikon={Phone} nilai={s.telepon} kosong="Telepon belum diisi" />
            <BarisKontak ikon={MessageCircle} nilai={s.whatsapp} kosong="WhatsApp belum diisi" peringatan />
          </span>
        </>
      ),
    },
    {
      id: 'kontak', judul: 'Kontak', kelas: KOLOM.kontak, skeleton: ['w-32', 'w-32'],
      sel: (s) => (
        <div className="space-y-1 text-sm">
          <BarisKontak ikon={Phone} nilai={s.telepon} kosong="Telepon belum diisi" />
          <BarisKontak ikon={MessageCircle} nilai={s.whatsapp} kosong="WhatsApp belum diisi" peringatan />
        </div>
      ),
    },
    { id: 'lead', judul: 'Lead time', kanan: true, kelas: KOLOM.lead, skeleton: 'w-14', sel: (s) => <span className="tabular-nums">{s.lead_time_avg} hari</span> },
    {
      id: 'biaya', judul: 'Biaya pesan', kanan: true, kelas: KOLOM.biaya, skeleton: 'w-20',
      sel: (s) => (Number(s.biaya_pesan) > 0 ? <span className="tabular-nums">{formatRupiah(Number(s.biaya_pesan))}</span> : <span className="text-muted-foreground">Belum diisi</span>),
    },
    {
      id: 'jenis', judul: 'Jenis obat', kelas: `max-w-[16rem] ${KOLOM.jenis}`, skeleton: 'w-40',
      sel: (s) => (s.jenis_obat ? <span className="line-clamp-2">{s.jenis_obat}</span> : <span className="text-muted-foreground">-</span>),
    },
    {
      id: 'aksi', judul: <span className="sr-only">Aksi</span>, kanan: true, aksi: true, skeleton: 'w-28',
      sel: (s) => {
        const linkWa = normalisasiWa(s.whatsapp)
        const sedangDihapus = deleteMutation.isPending && deleteMutation.variables === s.id
        return (
          <div className="flex items-center justify-end gap-0.5">
            {linkWa && (
              <IconAction label={`Chat WhatsApp ${s.nama}`} asChild>
                <a href={`https://wa.me/${linkWa}`} target="_blank" rel="noopener noreferrer"><MessageCircle /></a>
              </IconAction>
            )}
            <IconAction label={`Ubah ${s.nama}`} asChild>
              <Link href={denganAsal(`/supplier/${s.id}/edit`, alamatDaftar)}><Pencil /></Link>
            </IconAction>
            <ConfirmDialog
              trigger={
                <IconAction label={`Hapus ${s.nama}`} disabled={sedangDihapus} className="text-destructive hover:text-destructive">
                  <Trash2 />
                </IconAction>
              }
              title={`Hapus ${s.nama}?`}
              description="Supplier yang masih dipakai oleh obat tidak bisa dihapus."
              onConfirm={() => deleteMutation.mutate(s.id)}
              loading={sedangDihapus}
            />
          </div>
        )
      },
    },
  ]

  // Bilah filter yang sama untuk kedua tampilan: di dalam panel (tabel) atau langsung di kanvas (kartu).
  const bilahFilter = (kelas: string) => (
    <FilterBar className={kelas}>
      <SearchField
        className="col-span-2 sm:col-span-1 sm:max-w-[20rem]"
        label="Cari supplier"
        placeholder="Cari nama, jenis obat, atau alamat"
        value={cari}
        onChange={setCari}
      />
      {adaFilter && (
        <Button variant="ghost" size="lg" className="h-10 rounded-xl px-3 text-muted-foreground" onClick={aturUlang}>
          Atur ulang
        </Button>
      )}
      <Segmented
        label="Tampilan daftar"
        value={tabel ? 'tabel' : 'kartu'}
        options={[{ value: 'kartu', label: 'Kartu' }, { value: 'tabel', label: 'Tabel' }]}
        onChange={(v) => ubahParam({ tampil: v === 'tabel' ? 'tabel' : null })}
        className="col-span-2 sm:col-span-1 sm:ml-auto"
      />
      <Button size="lg" className="col-span-2 h-10 rounded-xl px-4 sm:col-span-1" asChild>
        <Link href={denganAsal('/supplier/tambah', alamatDaftar)}>
          <Plus data-icon="inline-start" />
          Tambah supplier
        </Link>
      </Button>
    </FilterBar>
  )

  // Keadaan gagal, kosong, atau tidak cocok; null bila ada yang ditampilkan.
  const keadaan = (kelas: string) =>
    isError ? (
      <StateMessage
        icon={TriangleAlert}
        title="Daftar supplier belum bisa dimuat"
        description="Ini bukan berarti belum ada supplier. Periksa koneksi, lalu coba lagi."
        action={<Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={() => refetch()}>Coba lagi</Button>}
        className={kelas}
      />
    ) : !isLoading && tampil.length === 0 ? (
      <StateMessage
        icon={adaFilter ? SearchX : Truck}
        title={adaFilter ? 'Tidak ada supplier yang cocok' : 'Belum ada supplier'}
        description={adaFilter ? 'Ubah kata kunci atau lepas filter.' : 'Tambahkan supplier supaya bisa dipilih saat mencatat stok masuk dan memesan obat.'}
        action={adaFilter
          ? <Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={aturUlang}>Atur ulang filter</Button>
          : <Button size="lg" className="h-10 rounded-xl px-4" asChild><Link href={denganAsal('/supplier/tambah', alamatDaftar)}><Plus data-icon="inline-start" />Tambah supplier</Link></Button>}
        className={kelas}
      />
    ) : null

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">
      <PageHeader
        className="col-span-12"
        title="Supplier"
        description="Pemasok obat beserta kontak, lama pengiriman, dan biaya pesannya. Data ini dipakai untuk perhitungan ROP dan EOQ dan untuk mengirim Surat Pesanan."
      />

      <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          compact
          icon={TriangleAlert}
          label="Belum ada WhatsApp"
          value={isError ? null : tanpaWa}
          sublabel={tanpaWa > 0 ? 'kontak dipilih manual saat kirim' : 'semua sudah terisi'}
          isLoading={isLoading}
          onSelect={tanpaWa > 0 ? () => ubahParam({ wa: tanpaWaSaja ? null : 'kosong' }) : undefined}
          selected={tanpaWaSaja}
        />
        <StatTile
          compact
          icon={Clock}
          label="Lead time rata-rata"
          value={null}
          teks={isError || rataLead === null ? '-' : `${formatAngka(rataLead, 1)} hari`}
          sublabel={isError || !terlama ? '' : `terlama ${terlama.lead_time_avg} hari, ${terlama.nama}`}
          isLoading={isLoading}
        />
        <StatTile
          compact
          icon={Wallet}
          label={biayaSeragam ? 'Biaya pesan' : 'Biaya pesan rata-rata'}
          value={null}
          teks={isError || rataBiaya === null ? '-' : formatRupiah(rataBiaya)}
          sublabel={isError || rataBiaya === null ? '' : biayaSeragam ? 'per faktur, sama di semua supplier' : `per faktur, ${formatRupiah(Math.min(...biayaTerisi))} sampai ${formatRupiah(Math.max(...biayaTerisi))}`}
          isLoading={isLoading}
        />
      </div>

      {tabel ? (
        <Panel title="Daftar supplier" count={isLoading || isError ? undefined : tampil.length} className="col-span-12" bodyClassName="px-0 pb-0">
          {bilahFilter('grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap')}
          {keadaan('border-t border-border') ?? (
            <TabelData
              kolom={kolom}
              baris={tampil}
              kunci={(s) => s.id}
              isLoading={isLoading}
              isError={false}
              onCobaLagi={() => refetch()}
              kosong={{ judul: 'Tidak ada supplier', keterangan: '' }}
              halaman={halaman}
              onHalaman={(n) => ubahParam({ hal: n > 1 ? String(n) : null }, { resetHalaman: false })}
              barisSkeleton={5}
              noun="supplier"
            />
          )}
        </Panel>
      ) : (
        // Kartu berada langsung di kanvas (bukan di dalam panel): tidak ada kartu di dalam kartu.
        <div className="col-span-12 space-y-4">
          {bilahFilter('grid grid-cols-2 sm:flex sm:flex-wrap')}
          {keadaan('') ? (
            <div className="rounded-2xl bg-card">{keadaan('')}</div>
          ) : (
            <div aria-busy={isLoading} className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <KartuSkeleton key={i} />)
                : tampil.map((s) => (
                    <KartuSupplier
                      key={s.id}
                      supplier={s}
                      hrefUbah={denganAsal(`/supplier/${s.id}/edit`, alamatDaftar)}
                      sedangDihapus={deleteMutation.isPending && deleteMutation.variables === s.id}
                      onHapus={() => deleteMutation.mutate(s.id)}
                    />
                  ))}
            </div>
          )}
          {!isLoading && !isError && <p role="status" className="sr-only">{tampil.length} supplier</p>}
        </div>
      )}
    </div>
  )
}
