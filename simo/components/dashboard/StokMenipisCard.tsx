'use client'

import Link from 'next/link'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatAngka } from '@/lib/utils'
import Panel, { SkeletonRows } from './Panel'

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
  isError?: boolean
  // Jumlah seluruh obat yang stoknya di bawah ROP (panel ini hanya memuat lima teratas)
  totalReorder?: number
  className?: string
}

// Tingkat keparahan: 0 = habis, 1 = kritis (di bawah ROP), 2 = mendekati ROP.
function tingkat(stok: number, rop: number) {
  if (stok <= 0) return 0
  if (stok <= rop) return 1
  return 2
}

export function StatusBadge({ stok, rop }: { stok: number; rop: number }) {
  if (stok <= 0) {
    return <Badge className="bg-destructive text-white">Habis</Badge>
  }
  if (stok <= rop) {
    return <Badge variant="destructive" className="text-danger-700">Kritis</Badge>
  }
  return <Badge className="bg-warning-50 text-warning-700">Mendekati ROP</Badge>
}

// Garis level: panjang isi = stok terhadap dua kali ROP, penanda tegak = posisi ROP.
// Jadi isi yang berhenti sebelum penanda berarti stok sudah di bawah titik pesan ulang.
// Hanya hiasan data: angka stok dan ROP tetap tertulis di kolomnya.
export function LevelBar({ stok, rop }: { stok: number; rop: number }) {
  const skala = Math.max(rop * 2, stok, 1)
  const isi = Math.min(100, (Math.max(stok, 0) / skala) * 100)
  const penanda = Math.min(100, (rop / skala) * 100)
  const kritis = stok <= rop
  return (
    <div className="relative h-1.5 w-20 rounded-full bg-muted" aria-hidden="true">
      <div
        className={kritis ? 'h-full rounded-full bg-danger-500' : 'h-full rounded-full bg-warning-500'}
        style={{ width: `${kritis ? Math.max(isi, 3) : isi}%` }}
      />
      <div className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-foreground/70" style={{ left: `${penanda}%` }} />
    </div>
  )
}

export default function StokMenipisCard({ data, isLoading, isError, totalReorder, className }: Props) {
  // Yang paling parah di atas: habis, lalu kritis, lalu mendekati; dalam satu tingkat, rasio stok terhadap ROP terkecil dulu.
  const urut = [...data].sort(
    (a, b) =>
      tingkat(a.stok, a.rop) - tingkat(b.stok, b.rop) ||
      (a.rop > 0 ? a.stok / a.rop : 0) - (b.rop > 0 ? b.stok / b.rop : 0) ||
      b.rop - a.rop
  )
  // Garis level hanya berguna bila ada obat yang stoknya masih tersisa; untuk yang habis, badge sudah cukup.
  const adaLevel = urut.some((o) => o.stok > 0)
  const lainnya = totalReorder !== undefined ? totalReorder - data.length : 0
  return (
    <Panel
      title={data.length > 0 && lainnya > 0 ? `Stok menipis, ${data.length} teratas` : 'Stok menipis'}
      action={
        <Link href="/reorder" className="text-primary hover:underline focus-visible:underline">
          {lainnya > 0 ? `Lihat semua ${totalReorder}` : 'Lihat reorder'}
        </Link>
      }
      className={className}
      bodyClassName="px-0 pb-2"
    >
      {isLoading ? (
        <SkeletonRows rows={4} className="px-5 pb-5" />
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <TriangleAlert className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Data stok belum bisa dimuat</p>
          <p className="text-sm text-muted-foreground">Ini bukan berarti semua stok aman. Coba lagi lewat tombol di atas.</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <CircleCheck className="size-6 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Semua stok aman</p>
          <p className="text-sm text-muted-foreground">Tidak ada obat di bawah atau mendekati titik pesan ulang.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 pl-5 text-xs font-medium text-muted-foreground">Obat</TableHead>
              <TableHead className="h-9 text-right text-xs font-medium text-muted-foreground">Stok</TableHead>
              <TableHead className="hidden h-9 text-right text-xs font-medium text-muted-foreground sm:table-cell">ROP</TableHead>
              {adaLevel && <TableHead className="hidden h-9 text-xs font-medium text-muted-foreground sm:table-cell">Level</TableHead>}
              <TableHead className="h-9 pr-5 text-right text-xs font-medium text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {urut.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="whitespace-normal py-2.5 pl-5">
                  <Link href={`/obat/${o.id}/detail`} className="group block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="block font-medium leading-tight text-foreground group-hover:text-primary">{o.nama}</span>
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{o.kode}</span>
                  </Link>
                </TableCell>
                <TableCell className="py-2.5 text-right tabular-nums">
                  <span className="font-semibold text-foreground">{formatAngka(o.stok, 0)}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{o.satuan}</span>
                </TableCell>
                <TableCell className="hidden py-2.5 text-right text-muted-foreground tabular-nums sm:table-cell">{formatAngka(o.rop, 1)}</TableCell>
                {adaLevel && (
                  <TableCell className="hidden py-2.5 sm:table-cell">
                    {o.stok > 0 && <LevelBar stok={o.stok} rop={o.rop} />}
                  </TableCell>
                )}
                <TableCell className="py-2.5 pr-5 text-right">
                  <StatusBadge stok={o.stok} rop={o.rop} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  )
}
