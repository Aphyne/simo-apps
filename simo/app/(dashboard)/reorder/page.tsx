'use client'

import { useMemo, useState } from 'react'
import { Info, PackageCheck } from 'lucide-react'
import { useReorderAlerts, type ReorderAlertItem } from '@/hooks/useObat'
import { usePengaturan } from '@/hooks/usePengaturan'
import ReorderObatList, { type FilterSupplier } from '@/components/reorder/ReorderObatList'
import ReorderKeranjang, { type ItemKeranjang } from '@/components/reorder/ReorderKeranjang'
import type { IdentitasApotek } from '@/lib/reorder'
import AdminOnly from '@/components/layout/AdminOnly'

function IsiReorderPage() {
  const { data: alerts = [], isLoading } = useReorderAlerts()
  const { data: pengaturan } = usePengaturan()

  // Keranjang: id obat → jumlah pesan (satuan pesan). Ada di map = ada di keranjang.
  const [jumlahKeranjang, setJumlahKeranjang] = useState<Record<number, number>>({})
  const [filterAktif, setFilterAktif] = useState('semua')

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

  const tampil = useMemo(
    () =>
      filterAktif === 'semua'
        ? alerts
        : alerts.filter((it) => (it.supplier_id === null ? 'none' : String(it.supplier_id)) === filterAktif),
    [alerts, filterAktif]
  )

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-fg">Reorder</h1>
        <p className="text-sm text-fg-muted mt-0.5">
          Pilih obat yang mau dipesan, lalu kirim Surat Pesanan (PDF) ke supplier lewat WhatsApp.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4 shadow-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-brand-600" />
        </div>
        <div className="text-xs text-fg-tertiary leading-relaxed">
          <p>
            Jumlah awal adalah <span className="font-medium">saran sistem</span> (dari EOQ bila tersedia, kalau belum dari ROP ditambah kebutuhan 7 hari) dan bisa diubah di keranjang.
            Surat Pesanan dibuat dalam format surat apotek, satu surat per supplier.
          </p>
          <p className="mt-1 text-fg-muted">
            WhatsApp tidak bisa melampirkan file otomatis: di HP file langsung ikut terkirim lewat menu bagikan, di komputer PDF diunduh lalu Anda lampirkan ke chat yang terbuka.
            Obat prekursor/OOT memakai Surat Pesanan khusus yang berbeda, jangan dipesan dari sini.
          </p>
        </div>
      </div>

      {!isLoading && alerts.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 shadow-sm text-center">
          <div className="w-11 h-11 rounded-xl bg-success-100 flex items-center justify-center mx-auto mb-3">
            <PackageCheck className="w-5 h-5 text-success-600" />
          </div>
          <p className="text-sm font-medium text-fg">Tidak ada obat yang perlu dipesan</p>
          <p className="text-xs text-fg-muted mt-1">Semua stok masih di atas ROP.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <ReorderObatList
              items={tampil}
              filters={filters}
              filterAktif={filterAktif}
              onFilter={setFilterAktif}
              diKeranjang={diKeranjang}
              onToggle={toggle}
              onTambahSemua={tambahSemua}
              isLoading={isLoading}
            />
          </div>
          <ReorderKeranjang
            isi={isiKeranjang}
            apotek={apotek}
            onUbahJumlah={(id, jumlah) => setJumlahKeranjang((p) => ({ ...p, [id]: jumlah }))}
            onHapus={hapus}
            onKosongkan={() => setJumlahKeranjang({})}
          />
        </div>
      )}
    </div>
  )
}

export default function ReorderPage() {
  return (
    <AdminOnly>
      <IsiReorderPage />
    </AdminOnly>
  )
}
