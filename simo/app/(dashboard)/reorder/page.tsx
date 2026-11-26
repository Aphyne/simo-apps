'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { Hourglass, PackageX, Truck } from 'lucide-react'
import { useReorderAlerts, type ReorderAlertItem } from '@/hooks/useObat'
import { usePengaturan } from '@/hooks/usePengaturan'
import ReorderObatList, { type FilterSupplier } from '@/components/reorder/ReorderObatList'
import ReorderKeranjang, { type ItemKeranjang } from '@/components/reorder/ReorderKeranjang'
import PageHeader from '@/components/shared/PageHeader'
import { useCariTertunda, useFilterUrl } from '@/components/shared/useFilterUrl'
import { StatTile } from '@/components/dashboard/StatTile'
import type { IdentitasApotek } from '@/lib/reorder'
import { urutKeparahan } from '@/lib/reorderAlert'
import AdminOnly from '@/components/layout/AdminOnly'

// Keranjang disimpan di sessionStorage (per tab) supaya tidak hilang saat halaman dimuat ulang. Bentuk: { idObat: jumlah }.
const KUNCI_KERANJANG = 'simo-reorder-keranjang'

function bacaKeranjang(): Record<number, number> {
  if (typeof window === 'undefined') return {}
  try {
    const mentah = JSON.parse(window.sessionStorage.getItem(KUNCI_KERANJANG) ?? '{}') as Record<string, unknown>
    const hasil: Record<number, number> = {}
    for (const [id, n] of Object.entries(mentah)) {
      if (/^\d+$/.test(id) && Number.isInteger(n) && (n as number) >= 1) hasil[Number(id)] = n as number
    }
    return hasil
  } catch {
    return {}
  }
}

// Belum habis, tetapi stok cukup kurang dari 7 hari menurut kebutuhan harian (demand_harian dari perhitungan EOQ/ROP).
function habisDalamSeminggu(it: ReorderAlertItem): boolean {
  const harian = Number(it.demand_harian)
  return it.stok > 0 && harian > 0 && it.stok / harian <= 7
}

function IsiReorderPage() {
  const { data: alerts = [], isLoading, isError, refetch } = useReorderAlerts()
  const { data: pengaturan } = usePengaturan()

  // Keranjang: id obat → jumlah pesan (satuan pesan). Ada di map = ada di keranjang.
  const [jumlahKeranjang, setJumlahKeranjang] = useState<Record<number, number>>(bacaKeranjang)

  // Supplier dan kata kunci disimpan di URL (?supplier=&q=) supaya tidak hilang saat halaman dimuat ulang. Keranjang
  // sengaja tidak ikut: isinya hanya ada selama halaman ini terbuka.
  const { sp, ubahParam } = useFilterUrl()
  const supplierUrl = sp.get('supplier') ?? 'semua'
  const search = sp.get('q') ?? ''
  // ?kondisi=habis (stok 0) atau ?kondisi=segera (belum habis tetapi stok cukup kurang dari 7 hari); dipasang lewat ubin ringkasan.
  const kondisiUrl = sp.get('kondisi')
  const kondisi: '' | 'habis' | 'segera' = kondisiUrl === 'habis' || kondisiUrl === 'segera' ? kondisiUrl : ''

  // Kolom cari memakai state lokal supaya ketikan tidak tertinggal; ke URL setelah jeda 300 ms.
  const [cari, setCari] = useCariTertunda(search, ubahParam)

  // Simpan tiap perubahan keranjang. Obat yang sudah tidak perlu dipesan dibuang dari simpanan setelah daftar termuat.
  useEffect(() => {
    try {
      const sah = alerts.length > 0
        ? Object.fromEntries(Object.entries(jumlahKeranjang).filter(([id]) => alerts.some((a) => String(a.id) === id)))
        : jumlahKeranjang
      window.sessionStorage.setItem(KUNCI_KERANJANG, JSON.stringify(sah))
    } catch {
      // penyimpanan tidak tersedia (mode privat); keranjang tetap berjalan di memori
    }
  }, [jumlahKeranjang, alerts])

  const apotek: IdentitasApotek | null = useMemo(() => {
    if (!pengaturan) return null
    const v = (k: string) => pengaturan[k]?.value ?? ''
    return {
      nama: v('nama_apotek') || 'Apotek',
      alamat: v('alamat_apotek'),
      sia: v('nomor_sia'),
      namaApj: v('nama_apj'),
      sipaApj: v('nomor_sipa_apj'),
      kota: v('kota_apotek') || 'Manokwari',
    }
  }, [pengaturan])

  const filters: FilterSupplier[] = useMemo(() => {
    const per = new Map<string, FilterSupplier>()
    for (const it of alerts) {
      const key = it.supplier_id === null ? 'none' : String(it.supplier_id)
      const label = it.supplier_id === null ? 'Tanpa supplier' : (it.supplier_nama ?? it.nama_supplier ?? 'Supplier')
      const cur = per.get(key)
      if (cur) cur.jumlah++
      else per.set(key, { key, label, jumlah: 1 })
    }
    const daftar = [...per.values()].sort((a, b) => {
      if ((a.key === 'none') !== (b.key === 'none')) return a.key === 'none' ? 1 : -1
      return b.jumlah - a.jumlah
    })
    return [{ key: 'semua', label: 'Semua', jumlah: alerts.length }, ...daftar]
  }, [alerts])

  // Nilai URL yang tidak dikenal (supplier sudah tidak punya obat yang perlu dipesan) kembali ke "semua".
  const filterAktif = filters.some((f) => f.key === supplierUrl) ? supplierUrl : 'semua'

  const tampil = useMemo(() => {
    const kata = search.trim().toLowerCase()
    return [...alerts].sort(urutKeparahan).filter((it) => {
      const cocokSupplier = filterAktif === 'semua' || (it.supplier_id === null ? 'none' : String(it.supplier_id)) === filterAktif
      const cocokKata = !kata || it.nama.toLowerCase().includes(kata) || it.kode.toLowerCase().includes(kata)
      const cocokKondisi = !kondisi || (kondisi === 'habis' ? it.stok <= 0 : habisDalamSeminggu(it))
      return cocokSupplier && cocokKata && cocokKondisi
    })
  }, [alerts, filterAktif, search, kondisi])

  const adaFilter = filterAktif !== 'semua' || search.trim() !== '' || kondisi !== ''
  function aturUlangFilter() {
    setCari('')
    ubahParam({ q: null, supplier: null, kondisi: null })
  }

  // Isi keranjang diambil dari data alert terkini, jadi obat yang sudah tidak perlu
  // dipesan (stok naik di atas ROP) otomatis hilang dari keranjang.
  const isiKeranjang: ItemKeranjang[] = useMemo(
    () => alerts.filter((it) => jumlahKeranjang[it.id] !== undefined).map((it) => ({ item: it, jumlah: jumlahKeranjang[it.id] })),
    [alerts, jumlahKeranjang]
  )

  const diKeranjang = (id: number) => jumlahKeranjang[id] !== undefined

  const toggle = (it: ReorderAlertItem) =>
    setJumlahKeranjang((prev) => {
      const next = { ...prev }
      if (next[it.id] !== undefined) delete next[it.id]
      else next[it.id] = it.saran_jumlah
      return next
    })

  const tambahSemua = (items: ReorderAlertItem[]) =>
    setJumlahKeranjang((prev) => {
      const next = { ...prev }
      items.forEach((it) => {
        if (next[it.id] === undefined) next[it.id] = it.saran_jumlah
      })
      return next
    })

  const hapus = (id: number) =>
    setJumlahKeranjang((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

  // Ringkasan. Data gagal dimuat tampil "-", bukan 0 (0 akan terbaca "semua aman").
  const angka = (n: number) => (isError ? null : n)
  const habis = alerts.filter((it) => it.stok <= 0).length
  const segera = alerts.filter(habisDalamSeminggu).length
  const tanpaSupplier = alerts.filter((it) => it.supplier_id === null).length
  // Bila tidak ada yang perlu dipesan, daftar sudah menyatakannya; ubin ringkasan hanya menambah angka nol.
  const tampilkanRingkasan = isLoading || isError || alerts.length > 0

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">
      <PageHeader
        className="col-span-12"
        title="Reorder"
        description="Pilih obat yang stoknya sudah di bawah titik pesan ulang, atur jumlahnya di keranjang, lalu kirim Surat Pesanan (PDF) ke supplier lewat WhatsApp."
      />

      {tampilkanRingkasan && (
        <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Ubin berisi angka yang bisa diklik untuk menyaring daftar (klik lagi untuk melepas). */}
          <StatTile
            compact
            icon={PackageX}
            label="Stok habis"
            value={angka(habis)}
            sublabel="pesan lebih dulu"
            isLoading={isLoading}
            onSelect={habis > 0 ? () => ubahParam({ kondisi: kondisi === 'habis' ? null : 'habis' }) : undefined}
            selected={kondisi === 'habis'}
          />
          <StatTile
            compact
            icon={Hourglass}
            label="Habis dalam 7 hari"
            value={angka(segera)}
            sublabel="belum habis, stok tinggal sedikit"
            isLoading={isLoading}
            onSelect={segera > 0 ? () => ubahParam({ kondisi: kondisi === 'segera' ? null : 'segera' }) : undefined}
            selected={kondisi === 'segera'}
          />
          <StatTile
            compact
            icon={Truck}
            label="Belum ada supplier"
            value={angka(tanpaSupplier)}
            sublabel={tanpaSupplier > 0 ? 'catat stok masuk dulu' : 'semua sudah punya'}
            isLoading={isLoading}
            onSelect={tanpaSupplier > 0 ? () => ubahParam({ supplier: filterAktif === 'none' ? null : 'none' }) : undefined}
            selected={filterAktif === 'none'}
          />
        </div>
      )}

      {/* Daftar dan keranjang berdampingan mulai xl (7/5). Di 2xl daftar mendapat 8/12 karena memuat dua kolom tambahan
          (Stok / ROP dan Isi per dus); halaman dibatasi max-w-7xl, jadi lebarnya tidak ikut bertambah di layar lebar. */}
      <div className="col-span-12 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7 2xl:col-span-8">
          <ReorderObatList
            items={tampil}
            filters={filters}
            filterAktif={filterAktif}
            onFilter={(key) => ubahParam({ supplier: key === 'semua' ? null : key })}
            cari={cari}
            onCari={setCari}
            adaFilter={adaFilter}
            onAturUlang={aturUlangFilter}
            diKeranjang={diKeranjang}
            onToggle={toggle}
            onTambahSemua={tambahSemua}
            isLoading={isLoading}
            isError={isError}
            onCobaLagi={() => refetch()}
            jumlahKeranjang={isiKeranjang.length}
          />
        </div>
        <div className="xl:col-span-5 2xl:col-span-4">
          <ReorderKeranjang
            isi={isiKeranjang}
            apotek={apotek}
            onUbahJumlah={(id, jumlah) => setJumlahKeranjang((p) => ({ ...p, [id]: jumlah }))}
            onHapus={hapus}
            onKosongkan={() => setJumlahKeranjang({})}
          />
        </div>
      </div>
    </div>
  )
}

export default function ReorderPage() {
  return (
    <AdminOnly>
      {/* IsiReorderPage membaca filter dari URL (useSearchParams), jadi harus dibungkus Suspense agar build produksi tidak gagal. */}
      <Suspense fallback={<div className="mx-auto max-w-7xl py-16 text-center text-sm text-muted-foreground" role="status">Memuat reorder</div>}>
        <IsiReorderPage />
      </Suspense>
    </AdminOnly>
  )
}
