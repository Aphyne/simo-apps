'use client'

import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useReorderAlerts } from '@/hooks/useObat'
import { useNotificationStore } from '@/store/notification.store'

export default function AlertNotification() {
  const [open, setOpen] = useState(false)
  const { data: allAlerts = [] } = useReorderAlerts()
  const { dismissedIds, dismissById, clearDismissed } = useNotificationStore()

  const alerts = allAlerts.filter((a) => !dismissedIds.includes(a.id))

  if (alerts.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {alerts.length > 9 ? '9+' : alerts.length}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-80 bg-white border rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-orange-50">
              <p className="text-sm font-semibold text-orange-800">
                ⚠️ Reorder Alert ({alerts.length})
              </p>
              <button
                onClick={() => { allAlerts.forEach((a) => dismissById(a.id)); setOpen(false) }}
                className="text-xs text-orange-600 hover:underline"
              >
                Sembunyikan Semua
              </button>
            </div>
            <ul className="max-h-72 overflow-y-auto divide-y">
              {alerts.map((alert) => (
                <li key={alert.id} className="px-4 py-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{alert.nama}</p>
                    <p className="text-xs text-gray-500 font-mono">{alert.kode}</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Stok: <span className="font-semibold">{alert.stok} {alert.satuan}</span>
                      {' · '}ROP: {alert.rop} {alert.satuan}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissById(alert.id)}
                    className="text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5"
                    title="Sembunyikan"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="px-4 py-2 border-t bg-gray-50">
              <button
                onClick={clearDismissed}
                className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
              >
                Tampilkan kembali yang disembunyikan
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
