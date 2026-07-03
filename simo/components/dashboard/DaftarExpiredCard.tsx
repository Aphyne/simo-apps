'use client'

import Link from 'next/link'
import { formatTanggalPendek } from '@/lib/utils'

interface Item {
  nama: string
  satuan: string
  stok: number
  expired_terdekat: string
}

interface Props {
  data: Item[]
  isLoading: boolean
  totalUrgent: number
}

export default function DaftarExpiredCard({ data, isLoading, totalUrgent }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col">
      <p className="text-sm font-semibold text-gray-700 mb-4">Daftar Akan Expired</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-6">
          <p className="text-sm text-gray-400">Tidak ada obat urgent expired dalam 90 hari</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Obat</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sisa</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((item, i) => {
                  const selisihHari = Math.floor(
                    (new Date(item.expired_terdekat).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                  const isKritis = selisihHari <= 30
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-2">
                        <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">{item.nama}</p>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <span className="text-xs text-gray-600">{item.stok} {item.satuan}</span>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <span className={`text-xs font-medium ${isKritis ? 'text-red-600' : 'text-orange-500'}`}>
                          {formatTanggalPendek(item.expired_terdekat)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalUrgent > 5 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link
                href="/laporan?tab=kedaluarsa"
                className="flex items-center justify-between text-xs text-red-600 hover:text-red-700 font-medium group"
              >
                <span>+ {totalUrgent - 5} obat lainnya akan expired</span>
                <span className="group-hover:underline">Lihat Semua →</span>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
