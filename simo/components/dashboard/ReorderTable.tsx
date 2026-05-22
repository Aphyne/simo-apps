import Link from 'next/link'
import { formatAngka } from '@/lib/utils'

interface ObatMendesak {
  id: number
  kode: string
  nama: string
  satuan: string
  stok: number
  rop: number
  eoq: number | null
  selisih: number
}

function SeverityBadge({ selisih, rop }: { selisih: number; rop: number }) {
  const ratio = rop > 0 ? Math.abs(selisih) / rop : 0
  if (ratio >= 0.5) {
    return <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">Kritis</span>
  }
  return <span className="bg-orange-100 text-orange-600 text-xs font-medium px-2 py-0.5 rounded-full">Reorder</span>
}

export default function ReorderTable({ data }: { data: ObatMendesak[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Semua stok aman ✓
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2.5 font-semibold text-xs text-gray-500 uppercase tracking-wide">Obat</th>
            <th className="text-right py-2.5 font-semibold text-xs text-gray-500 uppercase tracking-wide">Stok</th>
            <th className="text-right py-2.5 font-semibold text-xs text-gray-500 uppercase tracking-wide">ROP</th>
            <th className="text-right py-2.5 font-semibold text-xs text-gray-500 uppercase tracking-wide">Status</th>
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
                <SeverityBadge selisih={o.selisih} rop={o.rop} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
