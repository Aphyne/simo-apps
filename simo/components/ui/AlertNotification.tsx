'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, ShoppingCart } from 'lucide-react'
import { useReorderAlerts } from '@/hooks/useObat'

export default function AlertNotification() {
  const [open, setOpen] = useState(false)
  const { data: alerts = [] } = useReorderAlerts()

  if (alerts.length === 0) return null

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-fg-muted hover:text-warning-600 hover:bg-warning-50 transition-colors"
        aria-label={`${alerts.length} obat perlu dipesan ulang`}
      >
        <Bell className="w-5 h-5" />
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-fg-inverse text-[10px] font-bold rounded-full flex items-center justify-center">
          {alerts.length > 9 ? '9+' : alerts.length}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-80 rounded-xl border border-line bg-surface shadow-xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line-subtle">
              <p className="text-sm font-semibold text-fg">Reorder Alert</p>
              <span className="bg-danger-100 text-danger-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {alerts.length}
              </span>
            </div>

            {/* Alert list */}
            <ul className="max-h-[360px] overflow-y-auto p-2 space-y-2">
              {alerts.map((alert) => {
                const isKritis = alert.stok === 0

                return (
                  <li key={alert.id} className="rounded-xl border border-line-subtle bg-surface p-3 space-y-2 shadow-sm">
                    {/* Badge */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ${
                      isKritis ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isKritis ? 'bg-red-500' : 'bg-orange-500'}`} />
                      {isKritis ? 'STOK HABIS' : 'REORDER ALERT'}
                    </span>

                    {/* Nama & info */}
                    <div>
                      <p className="text-sm font-semibold text-fg leading-snug">{alert.nama}</p>
                      <p className="text-xs text-fg-muted mt-0.5">
                        Stok sisa <span className="font-semibold text-danger-600">{alert.stok}</span> {alert.satuan}
                        <span className="text-gray-300 mx-1">·</span>
                        ROP {Math.ceil(alert.rop)} {alert.satuan}
                      </p>
                      <p className="text-xs text-fg-muted mt-0.5">
                        Supplier:{' '}
                        <span className="font-medium text-fg-secondary">
                          {alert.supplier_nama ?? alert.nama_supplier ?? 'belum diatur'}
                        </span>
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Menuju keranjang reorder (pemesanan per supplier via WhatsApp) */}
            <div className="p-2 border-t border-line-subtle">
              <Link
                href="/reorder"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full bg-success-600 hover:bg-success-700 text-fg-inverse text-xs font-medium rounded-lg py-2 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Buka Keranjang Reorder
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
