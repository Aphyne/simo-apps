'use client'

import { useState } from 'react'
import { Bell, MessageCircle } from 'lucide-react'
import { useReorderAlerts } from '@/hooks/useObat'

function buildWaMessage(nama: string, eoq: number, satuan: string, namaSupplier: string | null) {
  const supplier = namaSupplier ?? 'Supplier'
  const text = `Halo ${supplier}, saya dari Apotek Rezky Medika.\n\nKami ingin memesan:\n📦 ${nama}\nJumlah: ${eoq} ${satuan}\n\nMohon informasi ketersediaan dan harga. Terima kasih.`
  return encodeURIComponent(text)
}

export default function AlertNotification() {
  const [open, setOpen] = useState(false)
  const { data: alerts = [] } = useReorderAlerts()

  if (alerts.length === 0) return null

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {alerts.length > 9 ? '9+' : alerts.length}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-80 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Reorder Alert</p>
              <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {alerts.length}
              </span>
            </div>

            {/* Alert list */}
            <ul className="max-h-[360px] overflow-y-auto p-2 space-y-2">
              {alerts.map((alert) => {
                const isKritis = alert.stok === 0
                const eoqQty = alert.eoq ? Math.ceil(alert.eoq) : null
                const waUrl = alert.supplier_whatsapp && eoqQty
                  ? `https://wa.me/${alert.supplier_whatsapp.replace(/\D/g, '')}?text=${buildWaMessage(alert.nama, eoqQty, alert.satuan, alert.nama_supplier)}`
                  : null

                return (
                  <li key={alert.id} className="rounded-xl border border-gray-100 bg-white p-3 space-y-2 shadow-sm">
                    {/* Badge */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ${
                      isKritis ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isKritis ? 'bg-red-500' : 'bg-orange-500'}`} />
                      {isKritis ? 'STOK HABIS' : 'REORDER ALERT'}
                    </span>

                    {/* Nama & info */}
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{alert.nama}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Stok sisa <span className="font-semibold text-red-600">{alert.stok}</span> {alert.satuan}
                        <span className="text-gray-300 mx-1">·</span>
                        ROP {alert.rop} {alert.satuan}
                      </p>
                    </div>

                    {/* WA Reorder button */}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg py-2 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Reorder {eoqQty} {alert.satuan}
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
