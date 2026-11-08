'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Copy, Eye, EyeOff, Truck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { ReorderAlertItem } from '@/hooks/useObat'
import {
  buatLinkWa,
  buatSuratPesanan,
  normalisasiWa,
  type IdentitasApotek,
} from '@/lib/reorder'

export interface GrupSupplier {
  supplierId: number | null
  nama: string
  whatsapp: string | null
  alamat: string | null
  items: ReorderAlertItem[]
}

interface Props {
  grup: GrupSupplier
  apotek: IdentitasApotek | null
  isDipilih: (id: number) => boolean
  jumlahDari: (item: ReorderAlertItem) => number
  onToggle: (id: number) => void
  onToggleSemua: (ids: number[], nilai: boolean) => void
  onUbahJumlah: (id: number, jumlah: number) => void
}

export default function ReorderSupplierCard({
  grup,
  apotek,
  isDipilih,
  jumlahDari,
  onToggle,
  onToggleSemua,
  onUbahJumlah,
}: Props) {
  const [lihatPesan, setLihatPesan] = useState(false)

  const terpilih = grup.items.filter((it) => isDipilih(it.id))
  const semuaTerpilih = terpilih.length === grup.items.length
  const adaSupplier = grup.supplierId !== null
  const adaWa = !!normalisasiWa(grup.whatsapp)

  const pesan =
    apotek && adaSupplier && terpilih.length > 0
      ? buatSuratPesanan({
          apotek,
          supplier: { id: grup.supplierId as number, nama: grup.nama, alamat: grup.alamat },
          items: terpilih.map((it) => ({ nama: it.nama, jumlah: jumlahDari(it), satuan: it.satuan_pesan })),
        })
      : ''

  const bisaKirim = !!pesan

  function kirimWa() {
    window.open(buatLinkWa(grup.whatsapp, pesan), '_blank', 'noopener,noreferrer')
  }

  async function salinPesan() {
    try {
      await navigator.clipboard.writeText(pesan)
      toast.success('Pesan disalin — tinggal tempel di WhatsApp')
    } catch {
      toast.error('Gagal menyalin pesan')
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header supplier */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">{grup.nama}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {grup.items.length} obat perlu dipesan · {terpilih.length} dipilih
              {adaSupplier && (
                <>
                  {' · '}
                  {adaWa ? (
                    <span className="text-emerald-700 font-medium">WhatsApp {grup.whatsapp}</span>
                  ) : (
                    <span className="text-orange-700 font-medium">Nomor WhatsApp belum diisi</span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        {adaSupplier && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={salinPesan}
              disabled={!bisaKirim}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-3 py-2 text-sm"
            >
              <Copy className="w-4 h-4" /> Salin
            </button>
            <button
              onClick={kirimWa}
              disabled={!bisaKirim}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Kirim via WhatsApp ({terpilih.length})
            </button>
          </div>
        )}
      </div>

      {/* Peringatan */}
      {!adaSupplier && (
        <div className="flex items-start gap-2 px-5 py-3 bg-orange-50 border-b border-orange-100 text-xs text-orange-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Obat ini belum punya supplier. Atur supplier lewat Edit Obat supaya bisa dipesan dari sini.
        </div>
      )}
      {adaSupplier && !adaWa && (
        <div className="flex items-start gap-2 px-5 py-3 bg-orange-50 border-b border-orange-100 text-xs text-orange-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Nomor WhatsApp supplier belum diisi, jadi WhatsApp terbuka tanpa tujuan dan Anda memilih kontaknya sendiri.{' '}
            <Link href="/supplier" className="underline font-medium">Isi nomor di menu Supplier</Link> supaya langsung terkirim ke nomornya.
          </span>
        </div>
      )}

      {/* Daftar obat */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-3 w-10">
                {adaSupplier && (
                  <input
                    type="checkbox"
                    aria-label={`Pilih semua obat ${grup.nama}`}
                    checked={semuaTerpilih}
                    onChange={(e) => onToggleSemua(grup.items.map((it) => it.id), e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                )}
              </th>
              {['Obat', 'Status', 'Stok / ROP', 'Jumlah Pesan'].map((h, i) => (
                <th key={h} className={`text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3 ${i >= 2 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grup.items.map((it) => {
              const aktif = isDipilih(it.id)
              const habis = it.stok === 0
              return (
                <tr key={it.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${aktif ? '' : 'opacity-60'}`}>
                  <td className="py-3 px-3">
                    {adaSupplier && (
                      <input
                        type="checkbox"
                        aria-label={`Pesan ${it.nama}`}
                        checked={aktif}
                        onChange={() => onToggle(it.id)}
                        className="w-4 h-4 accent-blue-600"
                      />
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="block font-medium text-gray-900">{it.nama}</span>
                    <span className="text-xs text-gray-500 font-mono">{it.kode}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${habis ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-700'}`}>
                      {habis ? 'Habis' : 'Reorder'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                    <span className={`font-semibold ${habis ? 'text-red-600' : 'text-gray-900'}`}>{it.stok}</span>
                    {' / '}
                    {Math.ceil(it.rop)} {it.satuan}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        min={1}
                        aria-label={`Jumlah pesan ${it.nama}`}
                        disabled={!adaSupplier}
                        value={jumlahDari(it)}
                        onChange={(e) => onUbahJumlah(it.id, Math.max(1, Math.floor(Number(e.target.value)) || 1))}
                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-xs text-gray-500 w-14">{it.satuan_pesan}</span>
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-0.5">saran dari {it.basis_saran}</p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pratinjau pesan */}
      {adaSupplier && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setLihatPesan((v) => !v)}
            disabled={!bisaKirim}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40"
          >
            {lihatPesan ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {lihatPesan ? 'Sembunyikan' : 'Lihat'} pesan Surat Pesanan
          </button>
          {lihatPesan && bisaKirim && (
            <pre className="mt-3 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-4 whitespace-pre-wrap font-sans leading-relaxed">
              {pesan}
            </pre>
          )}
          {!bisaKirim && terpilih.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">Pilih minimal satu obat untuk membuat pesan.</p>
          )}
        </div>
      )}
    </div>
  )
}
