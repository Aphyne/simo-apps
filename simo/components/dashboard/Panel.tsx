import type { ReactNode } from 'react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PanelProps {
  title: string
  // Keterangan singkat di sebelah judul, misalnya jumlah baris.
  count?: number
  // Tautan atau tombol di kanan judul.
  action?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

// Satu ubin bento: putih datar di atas kanvas abu muda, radius besar, tanpa garis dan tanpa bayangan.
export default function Panel({ title, count, action, className, bodyClassName, children }: PanelProps) {
  return (
    <Card className={cn('gap-0 rounded-2xl py-0 ring-0', className)}>
      <CardHeader className="items-center px-5 pb-3 pt-5">
        <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
          {title}
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold tabular-nums text-accent-foreground">
              {count}
            </span>
          )}
        </CardTitle>
        {action && <CardAction className="self-center text-sm font-medium">{action}</CardAction>}
      </CardHeader>
      <CardContent className={cn('flex-1 px-5 pb-5', bodyClassName)}>{children}</CardContent>
    </Card>
  )
}

// Kerangka pemuatan sejajar dengan bentuk isi yang akan datang.
export function SkeletonRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-xl bg-muted motion-safe:animate-pulse" />
      ))}
    </div>
  )
}
