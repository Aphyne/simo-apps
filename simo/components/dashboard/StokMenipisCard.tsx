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
    return <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">Kritis</span>
  }
  return <span className="bg-orange-100 text-orange-600 text-xs font-medium px-2 py-0.5 rounded-full">Mendekati ROP</span>
}

export default function StokMenipisCard({ data, isLoading }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col">
      <p className="text-sm font-semibold text-gray-700 mb-4">
        Stok Menipis
        {data.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
            {data.length}
          </span>
        )}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          Semua stok aman ✓
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Obat</th>
                <th className="text-right py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok</th>
                <th className="text-right py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">ROP</th>
                <th className="text-right py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-3">
                    <Link href={`/obat/${o.id}/detail`} className="group">
                      <p className="font-medium text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{o.nama}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{o.kode}</p>
                    </Link>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-semibold text-red-600">{formatAngka(o.stok, 0)}</span>
                    <span className="text-xs text-gray-400 ml-1">{o.satuan}</span>
                  </td>
                  <td className="py-3 text-right text-gray-500 text-xs">{formatAngka(o.rop, 1)}</td>
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
