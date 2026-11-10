'use client'

import Link from 'next/link'
import { MonitoringItem } from '@/hooks/useMonitoring'

interface Props {
  data: MonitoringItem[]
}

const STATUS_CONFIG = {
  Kritis:          { badge: 'bg-danger-100 text-danger-700',    dot: 'bg-danger-500' },
  'Perlu Reorder': { badge: 'bg-warning-100 text-warning-700', dot: 'bg-warning-500' },
  Aman:            { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  'Belum Dihitung':{ badge: 'bg-surface-muted text-fg-tertiary',  dot: 'bg-gray-300' },
} as const

function EstHabis({ hari }: { hari: number }) {
  if (hari <= 7)  return <span className="font-bold text-danger-600">{hari} hari ⚠️</span>
  if (hari <= 14) return <span className="font-semibold text-warning-700">{hari} hari</span>
  if (hari <= 30) return <span className="text-yellow-700">{hari} hari</span>
  return <span className="text-fg-tertiary">{hari} hari</span>
}

export default function MonitoringTable({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-fg-muted text-sm">
        Belum ada obat dengan riwayat penjualan. Catat barang keluar (Penjualan) terlebih dahulu.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-surface-subtle text-left text-xs text-fg-muted uppercase tracking-wide">
            <th className="px-4 py-3 font-medium w-6">#</th>
            <th className="px-4 py-3 font-medium">Nama Obat</th>
            <th className="px-4 py-3 font-medium">Kategori</th>
            <th className="px-4 py-3 font-medium text-right">Stok Saat Ini</th>
            <th className="px-4 py-3 font-medium text-right">Demand / Hari</th>
            <th className="px-4 py-3 font-medium text-right">Est. Habis</th>
            <th className="px-4 py-3 font-medium text-right">ROP</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-subtle">
          {data.map((item, idx) => {
            const cfg = STATUS_CONFIG[item.status_stok]
            return (
              <tr key={item.id} className="hover:bg-surface-subtle transition-colors">
                <td className="px-4 py-3 text-fg-muted text-xs">{idx + 1}</td>

                <td className="px-4 py-3">
                  <Link
                    href={`/obat/${item.id}/detail`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {item.nama}
                  </Link>
                  <div className="text-xs text-fg-muted">{item.kode}</div>
                </td>

                <td className="px-4 py-3 text-fg-muted">{item.kategori}</td>

                <td className="px-4 py-3 text-right font-medium text-fg">
                  {item.stok.toLocaleString('id-ID')}
                  <span className="text-xs text-fg-muted ml-1">{item.satuan}</span>
                </td>

                <td className="px-4 py-3 text-right text-fg-tertiary">
                  {item.demand_harian}
                  <span className="text-xs text-fg-muted ml-1">{item.satuan}/hari</span>
                </td>

                <td className="px-4 py-3 text-right">
                  <EstHabis hari={item.estimasi_habis_hari} />
                </td>

                <td className="px-4 py-3 text-right text-fg-muted">
                  {item.rop !== null ? Math.round(item.rop) : '—'}
                </td>

                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {item.status_stok}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
