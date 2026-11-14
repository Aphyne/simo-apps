import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatTileProps {
  label: string
  // null = data gagal dimuat; tampil "-", bukan 0 (0 berarti memang nol)
  value: number | null
  sublabel: string
  icon: LucideIcon
  isLoading?: boolean
  className?: string
}

// Ubin angka: label kecil di atas, angka besar di bawah. Tanpa kotak ikon, tanpa warna latar.
export function StatTile({ label, value, sublabel, icon: Icon, isLoading, className }: StatTileProps) {
  return (
    <div className={cn('flex flex-col justify-between gap-3.5 rounded-2xl bg-card p-4', className)}>
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label}
      </p>
      <div>
        {isLoading ? (
          <span className="block h-10 w-20 rounded-lg bg-muted motion-safe:animate-pulse" aria-hidden="true" />
        ) : (
          <p className="text-4xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
            {value === null ? <span aria-label="Data tidak tersedia">-</span> : value.toLocaleString('id-ID')}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  )
}

interface ReorderTileProps {
  value: number | null
  total: number | null
  isLoading?: boolean
  action: React.ReactNode
  className?: string
}

// Satu-satunya ubin berisi warna biru pekat (datar): hal yang paling perlu dikerjakan hari ini.
export function ReorderTile({ value, total, isLoading, action, className }: ReorderTileProps) {
  const rasio = value !== null && total ? Math.min(1, value / total) : 0
  return (
    <div className={cn('flex flex-col justify-between gap-3 rounded-2xl bg-primary p-5 text-primary-foreground', className)}>
      <p className="text-sm font-medium text-primary-foreground">Perlu reorder</p>
      <div>
        {isLoading ? (
          <span className="block h-14 w-24 rounded-lg bg-primary-foreground/20 motion-safe:animate-pulse" aria-hidden="true" />
        ) : (
          <p className="text-5xl font-semibold leading-none tracking-tight tabular-nums">
            {value === null ? <span aria-label="Data tidak tersedia">-</span> : value.toLocaleString('id-ID')}
          </p>
        )}
        <p className="mt-3 text-sm text-primary-foreground">
          {value === null || total === null ? 'Data stok belum bisa dimuat' : `dari ${total.toLocaleString('id-ID')} obat, stok di bawah ROP`}
        </p>
        <span className="mt-3 block h-1.5 rounded-full bg-primary-foreground/25" aria-hidden="true">
          <span className="block h-full rounded-full bg-primary-foreground" style={{ width: `${rasio * 100}%` }} />
        </span>
      </div>
      {action}
    </div>
  )
}
