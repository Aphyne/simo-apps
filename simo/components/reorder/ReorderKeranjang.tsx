'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, X, Eye, Download, MessageCircle, AlertCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ReorderAlertItem } from '@/hooks/useObat'
import {
  buatPesanPengantar,
  kirimPdfViaWa,
  normalisasiWa,
  unduhBlob,
  type IdentitasApotek,
} from '@/lib/reorder'
import { buatPdfSuratPesanan } from '@/lib/reorderPdf'

export interface ItemKeranjang {
  item: ReorderAlertItem
  jumlah: number
}

interface GrupKeranjang {
  supplierId: number
  nama: string
  whatsapp: string | null
  alamat: string | null
  isi: ItemKeranjang[]
}

interface Props {
  isi: ItemKeranjang[]
  apotek: IdentitasApotek | null
  onUbahJumlah: (id: number, jumlah: number) => void
  onHapus: (id: number) => void
  onKosongkan: () => void
}

// Input jumlah yang boleh dikosongkan sementara saat mengetik (hapus lalu ketik angka baru).
// Nilai ke keranjang hanya diperbarui kalau isinya bilangan bulat >= 1; saat selesai (blur)
// isian yang kosong/tidak valid dikembalikan ke jumlah terakhir yang sah.
function InputJumlah({ label, jumlah, onUbah }: { label: string; jumlah: number; onUbah: (n: number) => void }) {
  const [teks, setTeks] = useState<string | null>(null) // null = tidak sedang mengedit

  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      aria-label={label}
      value={teks ?? String(jumlah)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const v = e.target.value
        setTeks(v)
        const n = Math.floor(Number(v))
        if (v !== '' && Number.isFinite(n) && n >= 1) onUbah(n)
      }}
      onBlur={() => setTeks(null)}
      className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  )
}

function kelompokkan(isi: ItemKeranjang[]): GrupKeranjang[] {
  const map = new Map<number, GrupKeranjang>()
  for (const k of isi) {
    const sid = k.item.supplier_id
    if (sid === null) continue
    if (!map.has(sid)) {
      map.set(sid, {
        supplierId: sid,
        nama: k.item.supplier_nama ?? k.item.nama_supplier ?? 'Supplier',
        whatsapp: k.item.supplier_whatsapp,
        alamat: k.item.supplier_alamat,
        isi: [],
      })
    }
    map.get(sid)!.isi.push(k)
  }
  return [...map.values()]
}

export default function ReorderKeranjang({ isi, apotek, onUbahJumlah, onHapus, onKosongkan }: Props) {
  const [sibuk, setSibuk] = useState<number | null>(null)
  const grup = kelompokkan(isi)

  function bikinPdf(g: GrupKeranjang) {
    if (!apotek) {
      toast.error('Identitas apotek belum termuat, coba lagi sebentar')
      return null
    }
    const pdf = buatPdfSuratPesanan({
      apotek,
      supplier: { id: g.supplierId, nama: g.nama, alamat: g.alamat },
      items: g.isi.map((k) => ({ nama: k.item.nama, jumlah: k.jumlah, satuan: k.item.satuan_pesan })),
    })
    return { pdf, apotek }
  }

  function pratinjau(g: GrupKeranjang) {
    const h = bikinPdf(g)
    if (!h) return
    window.open(URL.createObjectURL(h.pdf.blob), '_blank', 'noopener,noreferrer')
  }

  function unduh(g: GrupKeranjang) {
    const h = bikinPdf(g)
    if (!h) return
    unduhBlob(h.pdf.blob, h.pdf.namaFile)
    toast.success('Surat Pesanan PDF diunduh')
  }

  async function kirim(g: GrupKeranjang) {
    const h = bikinPdf(g)
    if (!h) return
    setSibuk(g.supplierId)
    try {
      const hasil = await kirimPdfViaWa({
        blob: h.pdf.blob,
        namaFile: h.pdf.namaFile,
        nomorSupplier: g.whatsapp,
        pesan: buatPesanPengantar({
          apotek: h.apotek,
          supplier: { id: g.supplierId, nama: g.nama },
          jumlahItem: g.isi.length,
          nomor: h.pdf.nomor,
        }),
      })
      if (hasil === 'diunduh') {
        toast.success('PDF terunduh. Lampirkan ke chat WhatsApp yang terbuka (ikon klip, atau tarik file ke chat).', { duration: 8000 })
      }
    } finally {
      setSibuk(null)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden lg:sticky lg:top-6">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Keranjang Reorder</h2>
            <p className="text-xs text-gray-500 mt-0.5">{isi.length} obat · {grup.length} supplier</p>
          </div>
        </div>
        {isi.length > 0 && (
          <button onClick={onKosongkan} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Kosongkan
          </button>
        )}
      </div>

      <div className="max-h-[calc(100vh-11rem)] overflow-y-auto">
        {isi.length === 0 && (
          <div className="text-center py-10 px-5 text-gray-500 text-sm">
            Keranjang masih kosong.
            <span className="block text-xs mt-1">Tambahkan obat dari daftar di sebelah kiri.</span>
          </div>
        )}

        {grup.map((g) => {
          const adaWa = !!normalisasiWa(g.whatsapp)
          const lagiKirim = sibuk === g.supplierId
          return (
            <section key={g.supplierId} className="px-5 py-4 border-b border-gray-100 last:border-b-0">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">{g.nama}</h3>
                <p className="text-xs mt-0.5">
                  {adaWa ? (
                    <span className="text-emerald-700 font-medium">WhatsApp {g.whatsapp}</span>
                  ) : (
                    <span className="text-orange-700 font-medium">Nomor WhatsApp belum diisi</span>
                  )}
                </p>
              </div>

              {!adaWa && (
                <div className="flex items-start gap-2 mb-3 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 text-xs text-orange-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    WhatsApp akan terbuka tanpa tujuan, pilih kontaknya sendiri.{' '}
                    <Link href="/supplier" className="underline font-medium">Isi nomor supplier</Link>
                  </span>
                </div>
              )}

              <ul className="space-y-2 mb-3">
                {g.isi.map(({ item, jumlah }) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="flex-1 min-w-0 text-sm text-gray-900 leading-snug">{item.nama}</span>
                    <InputJumlah
                      label={`Jumlah pesan ${item.nama}`}
                      jumlah={jumlah}
                      onUbah={(n) => onUbahJumlah(item.id, n)}
                    />
                    <span className="text-xs text-gray-500 w-10 truncate">{item.satuan_pesan}</span>
                    <button
                      onClick={() => onHapus(item.id)}
                      aria-label={`Hapus ${item.nama} dari keranjang`}
                      className="text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg p-1.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => pratinjau(g)}
                  className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2 text-xs font-medium"
                  title="Lihat PDF di tab baru"
                >
                  <Eye className="w-3.5 h-3.5" /> Lihat
                </button>
                <button
                  onClick={() => unduh(g)}
                  className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2 text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => kirim(g)}
                  disabled={lagiKirim}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium rounded-lg px-3 py-2 text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {lagiKirim ? 'Menyiapkan...' : 'Kirim via WhatsApp'}
                </button>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
