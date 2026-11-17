'use client'

import { useState } from 'react'
import { CalendarX, Eye, Pencil, PackageOpen, Pill, Plus, RefreshCw, SearchX, Trash2, TrendingDown, TriangleAlert } from 'lucide-react'
import { ReorderTile, StatTile } from '@/components/dashboard/StatTile'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import StatusBadge from '@/components/ui/StatusBadge'
import PageHeaderPola from '@/components/shared/PageHeader'
import { FilterBar, SearchField, FILTER_SELECT } from '@/components/shared/FilterBar'
import Pagination from '@/components/shared/Pagination'
import { Fact, FactList } from '@/components/shared/FactList'
import StateMessage from '@/components/shared/StateMessage'
import IconAction from '@/components/shared/IconAction'
import Segmented from '@/components/shared/Segmented'
import { InputSatuan, Opsional, Wajib } from '@/components/shared/FormParts'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import KategoriDonut from '@/components/obat/KategoriDonut'
import StatusStokBar from '@/components/obat/StatusStokBar'
import type { Obat } from '@/types/obat'
import { PageHeader, Section } from '../_components'

// Data contoh: hanya kategori dan status yang dibaca komponen ringkasan.
const CONTOH_OBAT = [
  ...Array(23).fill(['Lainnya', 'AMAN']),
  ...Array(21).fill(['Flu & Batuk', 'AMAN']),
  ...Array(6).fill(['Alat Kesehatan', 'MENDEKATI_ROP']),
  ...Array(8).fill(['Analgesik', 'AMAN']),
  ...Array(4).fill(['Antijamur', 'HARUS_REORDER']),
  ...Array(14).fill(['Vitamin', 'HARUS_REORDER']),
  ...Array(6).fill(['Antasida', 'AMAN']),
  ...Array(3).fill(['Salep', 'AMAN']),
  ...Array(3).fill(['Vitamin C', 'AMAN']),
  ...Array(2).fill(['Antidiare', 'AMAN']),
  ...Array(2).fill(['Jamu', 'AMAN']),
  ...Array(1).fill(['Antibiotik', 'AMAN']),
  ...Array(1).fill(['Antihistamin', 'AMAN']),
  ...Array(1).fill(['Tetes Mata', 'AMAN']),
  ...Array(1).fill(['Antiinflamasi', 'AMAN']),
].map(([kategori, status], i) => ({ id: i, kategori, status })) as unknown as Obat[]

export function HalamanSection() {
  const [statusDonut, setStatusDonut] = useState('')
  const [cari, setCari] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState('semua')
  const [status, setStatus] = useState('semua')
  const [halaman, setHalaman] = useState(2)
  const [kategoriBatang, setKategoriBatang] = useState('')
  const [periode, setPeriode] = useState<'mingguan' | 'bulanan'>('bulanan')

  return (
    <section id="halaman">
      <PageHeader
        title="Pola halaman"
        desc="Pola yang dipakai ulang oleh halaman daftar, form, dan detail. Komponennya ada di components/shared/. Halaman Data Obat adalah contoh pertamanya."
      />

      <Section title="Kepala halaman, daftar" desc="Berada di kanvas, bukan di dalam ubin. Judul text-2xl dan satu kalimat keterangan. Pada halaman daftar yang punya bilah filter, tombol utama berada di bilah itu (di bawah), bukan di kepala." meta="PageHeader" bare>
        <PageHeaderPola
          title="Data obat"
          description="Stok, titik pesan ulang, dan tanggal expired setiap obat di apotek."
        />
      </Section>

      <Section title="Kepala halaman, detail" desc="Tombol kembali di atas judul (44px). Baris keterangan memuat kode (font-mono), kategori, dan status. Aksi: satu outline, satu biru." meta="PageHeader meta, onBack" bare>
        <PageHeaderPola
          title="Paracetamol 500mg"
          onBack={() => undefined}
          backLabel="Kembali ke data obat"
          meta={
            <>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground/80">OBT-001</span>
              <span>Analgesik</span>
              <StatusBadge status="MENDEKATI_ROP" />
            </>
          }
          actions={
            <>
              <Button variant="outline" size="lg" className="h-10 rounded-xl px-4">
                <RefreshCw data-icon="inline-start" />
                Hitung ulang
              </Button>
              <Button size="lg" className="h-10 rounded-xl px-4">
                <Pencil data-icon="inline-start" />
                Ubah data
              </Button>
            </>
          }
        />
      </Section>

      <Section title="Bilah filter" desc="Satu baris: kolom cari, Select, lalu aksi utama di kanan. Kontrol setinggi 40px, radius xl. Filter dengan banyak nilai memakai Select (jumlah per nilai tertulis di tiap pilihan), bukan deretan chip yang membungkus jadi baris-baris. Tombol Atur ulang muncul hanya saat ada filter aktif. Di layar sempit: cari dan tombol selebar penuh, dua Select berdampingan. Setiap perubahan filter mengembalikan paginasi ke halaman 1." meta="FilterBar, SearchField">
        <FilterBar className="grid grid-cols-2 sm:flex sm:flex-wrap">
          <SearchField className="col-span-2 sm:col-span-1" label="Cari obat" placeholder="Cari nama atau kode obat" value={cari} onChange={setCari} />
          <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
            <SelectTrigger className={`${FILTER_SELECT} sm:w-56`} aria-label="Filter kategori">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua kategori (82)</SelectItem>
              <SelectItem value="Lainnya">Lainnya (23)</SelectItem>
              <SelectItem value="Flu & Batuk">Flu &amp; Batuk (21)</SelectItem>
              <SelectItem value="Analgesik">Analgesik (8)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={FILTER_SELECT} aria-label="Filter status stok">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua status</SelectItem>
              <SelectItem value="aman">Aman</SelectItem>
              <SelectItem value="reorder">Harus reorder</SelectItem>
            </SelectContent>
          </Select>
          {(cari || kategoriFilter !== 'semua' || status !== 'semua') && (
            <Button type="button" variant="ghost" className="col-span-2 h-10 rounded-xl px-3 text-primary sm:col-span-1" onClick={() => { setCari(''); setKategoriFilter('semua'); setStatus('semua') }}>
              Atur ulang
            </Button>
          )}
          <Button size="lg" className="col-span-2 h-10 rounded-xl px-4 sm:col-span-1 sm:ml-auto">
            <Plus data-icon="inline-start" />
            Tambah obat
          </Button>
        </FilterBar>
      </Section>

      <Section title="Donut kategori dan batang status stok" desc="Donut memuat semua kategori sebagai irisan (warna token kategori-1 sampai kategori-14, tanpa merah dan oranye), tetapi legenda hanya menuliskan lima teratas supaya ringkas (jumlah kategori ditulis di kanan judul panel, tanpa baris tambahan). Setiap irisan adalah tombol filter: saat disorot (hover, fokus, atau terpilih) nama, jumlah, dan persennya tampil di tengah donat. Komposisi tiga bagian (status stok) memakai batang bertumpuk 100% dengan kalimat inti di atasnya. Kolom kanan memuat dua ubin ringkas." meta="KategoriDonut, StatusStokBar" bare>
        <div className="grid grid-cols-12 gap-4">
          <KategoriDonut className="col-span-12 md:col-span-6 lg:col-span-4" allObat={CONTOH_OBAT} isLoading={false} kategoriAktif={kategoriBatang} onPilihKategori={(k) => setKategoriBatang(k === kategoriBatang ? '' : k)} />
          <StatusStokBar className="col-span-12 md:col-span-6 lg:col-span-4" allObat={CONTOH_OBAT} isLoading={false} statusAktif={statusDonut} onPilihStatus={(s) => setStatusDonut(s === statusDonut ? '' : s)} />
          <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            <ReorderTile compact value={18} total={82} action={<Button size="sm" className="h-9 rounded-xl bg-primary-foreground px-3 font-semibold text-primary hover:bg-primary-foreground/90">Tampilkan obat</Button>} />
            <StatTile compact label="Akan expired" value={10} sublabel="dalam 90 hari" icon={CalendarX} />
          </div>
        </div>
      </Section>

      <Section title="Ubin ringkasan ringkas" desc="Varian compact untuk halaman daftar: baris label (36px) lalu angka text-3xl dan keterangan sejajar, sekitar 106px tinggi. Empat ubin satu baris di layar lebar, supaya tabel sudah terlihat di layar pertama. Satu ubin biru dengan tombol di kanan label." meta="StatTile compact, ReorderTile compact" bare>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ReorderTile compact className="col-span-2 lg:col-span-1" value={18} total={82} action={<Button size="sm" className="h-9 rounded-xl bg-primary-foreground px-3 font-semibold text-primary hover:bg-primary-foreground/90">Tampilkan</Button>} />
          <StatTile compact label="Total obat" value={82} sublabel="jenis" icon={Pill} />
          <StatTile compact label="Mendekati ROP" value={0} sublabel="perlu diawasi" icon={TrendingDown} />
          <StatTile compact className="col-span-2 lg:col-span-1" label="Akan expired" value={10} sublabel="dalam 90 hari" icon={CalendarX} />
        </div>
      </Section>

      <Section title="Paginasi" desc="Di kaki panel tabel: ringkasan di kiri, kontrol 40px di kanan. Halaman aktif biru dan memakai aria-current. Di layar sempit nomor diganti Halaman X dari Y." meta="Pagination, getPageNumbers" flush>
        <Pagination page={halaman} lastPage={5} total={49} perPage={10} noun="obat" onPageChange={setHalaman} className="border-t-0" />
      </Section>

      <Section title="Tombol ikon di baris" desc="Setiap tombol ikon berlabel dan bertooltip. Label menyebut sasarannya (Ubah Paracetamol 500mg). Hapus memakai warna destructive dan membuka konfirmasi. Tooltip tidak muncul di layar sentuh, label tetap terbaca pembaca layar." meta="IconAction">
        <div className="flex gap-0.5">
          <IconAction label="Lihat detail Paracetamol 500mg"><Eye /></IconAction>
          <IconAction label="Ubah Paracetamol 500mg"><Pencil /></IconAction>
          <IconAction label="Hapus Paracetamol 500mg" className="text-destructive hover:text-destructive"><Trash2 /></IconAction>
        </div>
      </Section>

      <Section title="Kisi fakta" desc="Pasangan label dan nilai untuk halaman detail. Label abu di atas, nilai text-base di bawah. Tanpa kotak per fakta; jarak yang memisahkan. Nilai kosong ditulis tanda minus." meta="FactList, Fact">
        <FactList className="sm:grid-cols-3">
          <Fact label="Harga beli terkini per tablet">Rp 1.250</Fact>
          <Fact label="Harga jual terkini per tablet">Rp 1.800</Fact>
          <Fact label="Isi per dus">100 tablet</Fact>
          <Fact label="Lead time">3 hari</Fact>
          <Fact label="Supplier">PT Kimia Farma</Fact>
          <Fact label="Expired terdekat">-</Fact>
        </FactList>
      </Section>

      <Section title="Pilihan periode (segmen)" desc="Pilih satu dari dua atau tiga nilai yang saling menggantikan, mis. periode grafik. Wadah dan tombol 40px, aktif putih bertepi tipis di atas abu muda. Radiogroup dengan panah kiri dan kanan. Lebih dari tiga nilai (tahun, bulan) memakai Select, diletakkan di sebelahnya. Dipakai di panel grafik Stok masuk." meta="Segmented">
        <Segmented
          label="Periode contoh"
          value={periode}
          onChange={setPeriode}
          options={[
            { value: 'mingguan', label: '7 hari' },
            { value: 'bulanan', label: 'Per bulan' },
          ]}
        />
      </Section>

      <Section title="Kolom isian: wajib, opsional, satuan" desc="Form dengan kolom wajib dan opsional bercampur: bintang merah pada yang wajib (dengan keterangan satu baris Wajib diisi di atas form) dan kata (opsional) abu pada yang boleh kosong. Satuan Rp atau persen berada di dalam kotak (dekoratif, sebut satuannya di label atau hint). Angka terpilih seluruhnya saat difokus supaya nilai 0 bawaan mudah ditimpa. Dipakai di form Stok masuk." meta="Wajib, Opsional, InputSatuan">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="contoh-dus">Jumlah (dus) <Wajib /></FieldLabel>
            <InputSatuan id="contoh-dus" type="number" defaultValue={2.5} />
            <FieldDescription>Boleh pecahan, mis. 2,5 dus.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="contoh-beli">Harga beli per dus <Opsional /></FieldLabel>
            <InputSatuan id="contoh-beli" type="number" awalan="Rp" defaultValue={111000} />
          </Field>
          <Field>
            <FieldLabel htmlFor="contoh-ppn">PPN <Opsional /></FieldLabel>
            <InputSatuan id="contoh-ppn" type="number" akhiran="%" defaultValue={11} />
          </Field>
        </div>
      </Section>

      <Section title="Keadaan: kosong, tidak cocok, gagal" desc="Ikon kecil, satu kalimat tebal, satu kalimat arah. Kosong mengajak mengisi; tidak cocok menawarkan atur ulang filter; gagal berkata jujur bahwa itu bukan berarti datanya nol." meta="StateMessage" flush>
        <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          <StateMessage
            icon={PackageOpen}
            title="Belum ada obat"
            description="Tambah obat pertama untuk mulai memantau stoknya."
            action={<Button className="h-10 rounded-xl px-4"><Plus data-icon="inline-start" />Tambah obat</Button>}
          />
          <StateMessage
            icon={SearchX}
            title="Tidak ada obat yang cocok"
            description="Ubah kata kunci atau longgarkan filter untuk melihat obat lain."
            action={<Button variant="outline" className="h-10 rounded-xl px-4">Atur ulang filter</Button>}
          />
          <StateMessage
            icon={TriangleAlert}
            title="Daftar obat belum bisa dimuat"
            description="Ini bukan berarti tidak ada obat. Coba muat ulang halaman."
          />
        </div>
      </Section>
    </section>
  )
}
