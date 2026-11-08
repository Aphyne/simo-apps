'use client'

import { useMemo, useState } from 'react'
import { Info, PackageCheck } from 'lucide-react'
import { useReorderAlerts, type ReorderAlertItem } from '@/hooks/useObat'
import { usePengaturan } from '@/hooks/usePengaturan'
import ReorderSupplierCard, { type GrupSupplier } from '@/components/reorder/ReorderSupplierCard'
import type { IdentitasApotek } from '@/lib/reorder'

export default function ReorderPage() {
  const { data: alerts = [], isLoading } = useReorderAlerts()
  const { data: pengaturan } = usePengaturan()

  // Pilihan & jumlah disimpan sebagai pengecualian dari default (dipilih semua, jumlah = saran),
  // supaya obat baru yang muncul saat refresh otomatis ikut terpilih.
  const [dikecualikan, setDikecualikan] = useState<Set<number>>(new Set())
  const [jumlahUbah, setJumlahUbah] = useState<Record<number, number>>({})

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

  const grupList: GrupSupplier[] = useMemo(() => {
    const map = new Map<string, GrupSupplier>()
    for (const it of alerts) {
      const key = it.supplier_id === null ? 'none' : String(it.supplier_id)
      if (!map.has(key)) {
        map.set(key, {
          supplierId: it.supplier_id,
          nama: it.supplier_nama ?? it.nama_supplier ?? 'Tanpa supplier',
          whatsapp: it.supplier_whatsapp,
          alamat: it.supplier_alamat,
          items: [],
        })
      }
      map.get(key)!.items.push(it)
    }
    // Supplier dengan obat terbanyak di atas; "Tanpa supplier" paling bawah
    return [...map.values()].sort((a, b) => {
      if ((a.supplierId === null) !== (b.supplierId === null)) return a.supplierId === null ? 1 : -1
      return b.items.length - a.items.length
    })
  }, [alerts])

  const isDipilih = (id: number) => !dikecualikan.has(id)
  const jumlahDari = (it: ReorderAlertItem) => jumlahUbah[it.id] ?? it.saran_jumlah

  const toggle = (id: number) =>
    setDikecualikan((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleSemua = (ids: number[], nilai: boolean) =>
    setDikecualikan((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (nilai ? next.delete(id) : next.add(id)))
      return next
    })

  const totalPerluPesan = alerts.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Keranjang Reorder</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Obat yang stoknya sudah di bawah ROP, dikelompokkan per supplier. Pilih obat dan jumlahnya, lalu kirim Surat Pesanan lewat WhatsApp.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xs text-gray-600 leading-relaxed">
          <p>
            Jumlah awal adalah <span className="font-medium">saran sistem</span> (dari EOQ bila tersedia, kalau belum dari ROP ditambah kebutuhan 7 hari) dan bisa Anda ubah.
            Pesan berformat Surat Pesanan: kop apotek, daftar obat, ketentuan retur, dan tanda tangan APJ.
          </p>
          <p className="mt-1 text-gray-500">
            Catatan: obat prekursor/OOT memakai Surat Pesanan khusus yang berbeda. Jangan dipesan dari pesan ini.
          </p>
        </div>
      </div>

      {isLoading && <div className="animate-pulse bg-gray-100 rounded-xl h-40" />}

      {!isLoading && totalPerluPesan === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm text-center">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-gray-900">Tidak ada obat yang perlu dipesan</p>
          <p className="text-xs text-gray-500 mt-1">Semua stok masih di atas ROP.</p>
        </div>
      )}

      {grupList.map((g) => (
        <ReorderSupplierCard
          key={g.supplierId ?? 'none'}
          grup={g}
          apotek={apotek}
          isDipilih={isDipilih}
          jumlahDari={jumlahDari}
          onToggle={toggle}
          onToggleSemua={toggleSemua}
          onUbahJumlah={(id, jumlah) => setJumlahUbah((p) => ({ ...p, [id]: jumlah }))}
        />
      ))}
    </div>
  )
}
