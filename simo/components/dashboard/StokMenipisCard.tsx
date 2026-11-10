'use client'

import Link from 'next/link'
import { formatAngka } from '@/lib/utils'

interface Item {
  id: number
  kode: string
  nama: string
  satuan: string
  stok: number
  rop: number
  eoq: number | null
  selisih: number
}

interface Props {
  data: Item[]
  isLoading: boolean
}

function StatusBadge({ stok, rop }: { stok: number; rop: number }) {
  if (stok <= rop) {
    return <span className="bg-danger-100 text-danger-700 text-xs font-medium px-2 py-0.5 rounded-full">Kritis</span>
  }
  return <span className="bg-warning-100 text-warning-700 text-xs font-medium px-2 py-0.5 rounded-full">Mendekati ROP</span>
}

export default function StokMenipisCard({ data, isLoading }: Props) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm flex flex-col">
      <p className="text-sm font-semibold text-fg-secondary mb-4">
        Stok Menipis
        {data.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-danger-100 text-danger-700 text-xs font-medium rounded-full">
            {data.length}
          </span>
        )}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-fg-muted text-sm">
          Semua stok aman ✓
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2.5 text-xs font-semibold text-fg-muted uppercase tracking-wide">Obat</th>
                <th className="text-right py-2.5 text-xs font-semibold text-fg-muted uppercase tracking-wide">Stok</th>
                <th className="text-right py-2.5 text-xs font-semibold text-fg-muted uppercase tracking-wide">ROP</th>
                <th className="text-right py-2.5 text-xs font-semibold text-fg-muted uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id} className="border-b border-line-subtle hover:bg-surface-subtle transition-colors">
                  <td className="py-3 pr-3">
                    <Link href={`/obat/${o.id}/detail`} className="group">
                      <p className="font-medium text-fg leading-tight group-hover:text-brand-600 transition-colors">{o.nama}</p>
                      <p className="text-xs text-fg-muted font-mono mt-0.5">{o.kode}</p>
                    </Link>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-semibold text-danger-600">{formatAngka(o.stok, 0)}</span>
                    <span className="text-xs text-fg-muted ml-1">{o.satuan}</span>
                  </td>
                  <td className="py-3 text-right text-fg-muted text-xs">{formatAngka(o.rop, 1)}</td>
                  <td className="py-3 text-right">
                    <StatusBadge stok={o.stok} rop={o.rop} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
