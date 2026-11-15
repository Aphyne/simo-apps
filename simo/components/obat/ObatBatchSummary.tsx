'use client'

import { PackageOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Panel from '@/components/dashboard/Panel'
import { useObatBatchSummary } from '@/hooks/useObat'
import { useNow } from '@/hooks/useNow'
import { formatTanggalPendek } from '@/lib/utils'

interface Props {
  id: string | number
  className?: string
}

const KEPALA = 'h-9 text-xs font-medium text-muted-foreground'

// Sisa hari per batch memakai badge status: merah (kurang dari 30 hari), oranye (sampai 90 hari),
// biasa (lebih lama). Selalu tertulis "N hari lagi", jadi warna tidak berdiri sendiri.
function BadgeSisa({ expiredBatch }: { expiredBatch: string }) {
  const sekarang = useNow().getTime()
  const hari = Math.floor((new Date(expiredBatch).getTime() - sekarang) / (1000 * 60 * 60 * 24))
  if (hari < 0) return <Badge variant="secondary">Sudah expired</Badge>
  if (hari <= 30) return <Badge variant="destructive" className="text-danger-700">{hari} hari lagi</Badge>
  if (hari <= 90) return <Badge variant="outline" className="border-transparent bg-warning-50 text-warning-700">{hari} hari lagi</Badge>
  return <Badge variant="outline">{hari} hari lagi</Badge>
}

export default function ObatBatchSummary({ id, className }: Props) {
  const { data, isLoading } = useObatBatchSummary(id)

  return (
    <Panel title="Estimasi sisa per batch" className={className} bodyClassName="px-0 pb-2">
      {!isLoading && data && data.length > 0 && (
        <p className="px-5 pb-3 text-sm text-muted-foreground">Dihitung dengan asumsi FIFO: stok terlama dipakai lebih dulu.</p>
      )}

      {isLoading ? (
        <div className="space-y-3 px-5 pb-3" aria-busy="true" aria-label="Memuat data batch">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-6 text-center">
          <PackageOpen className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Belum ada batch dengan tanggal expired</p>
          <p className="text-sm text-muted-foreground">Batch muncul di sini setelah ada barang masuk yang mencatat tanggal expired.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={`${KEPALA} pl-5`}>No. batch</TableHead>
              <TableHead className={KEPALA}>Expired</TableHead>
              <TableHead className={`${KEPALA} hidden text-right sm:table-cell`}>Total masuk</TableHead>
              <TableHead className={`${KEPALA} text-right`}>Estimasi sisa</TableHead>
              <TableHead className={`${KEPALA} pr-5 text-right`}>Sisa hari</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((batch, i) => (
              <TableRow key={i}>
                <TableCell className="py-2.5 pl-5 font-mono text-xs text-muted-foreground">
                  {batch.no_batch ?? <span aria-label="Tanpa nomor batch">-</span>}
                </TableCell>
                <TableCell className="py-2.5 font-medium tabular-nums text-foreground">{formatTanggalPendek(batch.expired_batch)}</TableCell>
                <TableCell className="hidden py-2.5 text-right tabular-nums text-muted-foreground sm:table-cell">
                  {batch.total_masuk} {batch.satuan}
                </TableCell>
                <TableCell className="py-2.5 text-right tabular-nums">
                  <span className="font-semibold text-foreground">{batch.estimasi_sisa}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{batch.satuan}</span>
                </TableCell>
                <TableCell className="py-2.5 pr-5 text-right">
                  <BadgeSisa expiredBatch={batch.expired_batch} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  )
}
