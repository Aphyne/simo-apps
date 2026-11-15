import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Daftar fakta untuk halaman detail: label abu di atas, nilai di bawah. Tanpa kotak per fakta
// (tidak ada kartu di dalam kartu); jarak dan ukuran huruf yang memisahkan.
export function FactList({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('grid grid-cols-2 gap-x-6 gap-y-5', className)}>{children}</dl>
}

// Nilai kosong ditulis "-", tidak dikosongkan atau ditulis 0.
export function Fact({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-base font-medium tabular-nums text-foreground">{children ?? '-'}</dd>
    </div>
  )
}
