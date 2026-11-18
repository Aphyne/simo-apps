'use client'

import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PageHeader from '@/components/shared/PageHeader'
import TabStok from '@/components/laporan/TabStok'
import TabKartuStok from '@/components/laporan/TabKartuStok'
import TabBarangMasuk from '@/components/laporan/TabBarangMasuk'
import TabBarangKeluar from '@/components/laporan/TabBarangKeluar'
import TabKedaluarsa from '@/components/laporan/TabKedaluarsa'
import { useFilterLaporan } from '@/components/laporan/laporanKit'
import { useSearchParams } from 'next/navigation'

type Tab = 'stok' | 'kartu-stok' | 'barang-masuk' | 'barang-keluar' | 'kedaluarsa'

const TABS: { id: Tab; label: string }[] = [
  { id: 'stok',          label: 'Stok obat' },
  { id: 'kartu-stok',    label: 'Kartu stok' },
  { id: 'barang-masuk',  label: 'Stok masuk' },
  { id: 'barang-keluar', label: 'Stok keluar' },
  { id: 'kedaluarsa',    label: 'Kedaluarsa' },
  // Dinonaktifkan (menu Perhitungan dan Simulasi juga nonaktif). Komponennya sudah v2 dan tersimpan di
  // components/laporan/TabNonaktif.tsx (TabEoqRop, TabSimulasi); impor dan tambahkan di sini untuk mengaktifkan lagi.
]

function LaporanContent() {
  const sp = useSearchParams()
  const { ubah } = useFilterLaporan()
  const tabUrl = sp.get('tab')
  const aktif: Tab = TABS.some((t) => t.id === tabUrl) ? (tabUrl as Tab) : 'stok'

  // Tab aktif disimpan di URL (?tab=). Tab Stok adalah bawaan, jadi tidak ditulis. Pindah tab mempertahankan filter
  // yang sama (obat, periode, kategori) tetapi mengembalikan paginasi ke halaman 1.
  function pindah(id: string) {
    ubah({ tab: id === 'stok' ? null : id })
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <PageHeader
        title="Laporan"
        description="Lihat data stok, transaksi, dan obat yang akan kedaluarsa, lalu unduh sebagai PDF atau Excel."
      />

      <Tabs value={aktif} onValueChange={pindah}>
        <TabsList aria-label="Jenis laporan">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="stok"><TabStok /></TabsContent>
        <TabsContent value="kartu-stok"><TabKartuStok /></TabsContent>
        <TabsContent value="barang-masuk"><TabBarangMasuk /></TabsContent>
        <TabsContent value="barang-keluar"><TabBarangKeluar /></TabsContent>
        <TabsContent value="kedaluarsa"><TabKedaluarsa /></TabsContent>
      </Tabs>
    </div>
  )
}

// useSearchParams() wajib dibungkus Suspense agar halaman bisa di-prerender saat build produksi.
export default function LaporanPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl py-16 text-center text-sm text-muted-foreground" role="status">Memuat laporan</div>}>
      <LaporanContent />
    </Suspense>
  )
}
