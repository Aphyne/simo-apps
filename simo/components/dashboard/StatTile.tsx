import type { ReactNode } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatTileProps {
  label: string
  // null = data gagal dimuat; tampil "-", bukan 0 (0 berarti memang nol)
  value: number | null
  sublabel: ReactNode
  icon: LucideIcon
  isLoading?: boolean
  // Varian penuh: bila diisi, seluruh ubin menjadi tautan ke halaman asal angkanya (Dashboard sebagai pintu ke halaman lain).
  href?: string
  // Varian ringkas untuk halaman daftar: baris label, lalu angka dan keterangan sejajar. Sekitar 106px tinggi.
  compact?: boolean
  // Hanya varian ringkas: bila diisi, seluruh ubin menjadi tombol (misalnya memfilter tabel); selected = filter sedang aktif.
  onSelect?: () => void
  selected?: boolean
  // Teks yang ditampilkan menggantikan angka (mis. "Habis" untuk estimasi stok 0, atau "Rp 1.250.000"; varian penuh memakai ukuran lebih kecil).
  teks?: string
  className?: string
}

// Ubin angka: label kecil di atas, angka besar di bawah. Tanpa kotak ikon, tanpa warna latar.
export function StatTile({ label, value, sublabel, icon: Icon, isLoading, href, compact, onSelect, selected, teks, className }: StatTileProps) {
  if (compact) {
    const kelas = cn(
      'flex flex-col justify-between gap-1 rounded-2xl bg-card p-4 text-left',
      onSelect && 'cursor-pointer outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring',
      selected && 'bg-accent hover:bg-accent',
      className
    )
    const Akar = onSelect ? 'button' : 'div'
    return (
      <Akar {...(onSelect ? { type: 'button' as const, onClick: onSelect, 'aria-pressed': Boolean(selected) } : {})} className={kelas}>
        <span className="flex min-h-9 items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {label}
        </span>
        <span className="flex items-baseline gap-2">
          {isLoading ? (
            <span className="block h-8 w-14 rounded-lg bg-muted motion-safe:animate-pulse" aria-hidden="true" />
          ) : (
            <span className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
              {teks ?? (value === null ? <>-<span className="sr-only"> Data tidak tersedia</span></> : value.toLocaleString('id-ID'))}
            </span>
          )}
          <span className="min-w-0 text-sm text-muted-foreground">{sublabel}</span>
        </span>
      </Akar>
    )
  }
  const isi = (
    <>
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label}
      </p>
      <div>
        {isLoading ? (
          <span className="block h-10 w-20 rounded-lg bg-muted motion-safe:animate-pulse" aria-hidden="true" />
        ) : (
          <p className={cn('font-semibold leading-none tracking-tight tabular-nums text-foreground', teks !== undefined ? 'break-words text-3xl' : 'text-4xl')}>
            {teks ?? (value === null ? <>-<span className="sr-only"> Data tidak tersedia</span></> : value.toLocaleString('id-ID'))}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">{sublabel}</p>
      </div>
    </>
  )
  const kelasPenuh = cn('flex flex-col justify-between gap-3.5 rounded-2xl bg-card p-4', className)
  if (href) {
    return (
      <Link href={href} className={cn(kelasPenuh, 'outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring')}>
        {isi}
      </Link>
    )
  }
  return <div className={kelasPenuh}>{isi}</div>
}

interface ReorderTileProps {
  value: number | null
  total: number | null
  isLoading?: boolean
  action: React.ReactNode
  // Varian ringkas (halaman daftar): tombol di kanan label, tanpa garis rasio.
  compact?: boolean
  // Hanya varian ringkas: menggantikan keterangan bawaan ("dari N obat, di bawah ROP") dengan informasi tambahan.
  keterangan?: string
  // Judul ubin; bawaan "Perlu reorder" (admin). Staf tidak memesan, jadi judulnya "Perlu dilaporkan ke admin".
  judul?: string
  className?: string
}

// Satu-satunya ubin berisi warna biru pekat (datar): hal yang paling perlu dikerjakan hari ini.
export function ReorderTile({ value, total, isLoading, action, compact, keterangan, judul = 'Perlu reorder', className }: ReorderTileProps) {
  const rasio = value !== null && total ? Math.min(1, value / total) : 0
  if (compact) {
    return (
      <div className={cn('flex flex-col justify-between gap-1 rounded-2xl bg-primary p-4 text-primary-foreground', className)}>
        <div className="flex min-h-9 items-center justify-between gap-3">
          <p className="text-sm font-medium">{judul}</p>
          {action}
        </div>
        <div className="flex items-baseline gap-2">
          {isLoading ? (
            <span className="block h-8 w-14 rounded-lg bg-primary-foreground/20 motion-safe:animate-pulse" aria-hidden="true" />
          ) : (
            <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums">
              {value === null ? <>-<span className="sr-only"> Data tidak tersedia</span></> : value.toLocaleString('id-ID')}
            </p>
          )}
          <p className="min-w-0 text-sm">
            {value === null || total === null ? 'Data stok belum bisa dimuat' : (keterangan ?? `dari ${total.toLocaleString('id-ID')} obat, di bawah ROP`)}
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className={cn('flex flex-col justify-between gap-3 rounded-2xl bg-primary p-5 text-primary-foreground', className)}>
      <p className="text-sm font-medium text-primary-foreground">{judul}</p>
      <div>
        {isLoading ? (
          <span className="block h-14 w-24 rounded-lg bg-primary-foreground/20 motion-safe:animate-pulse" aria-hidden="true" />
        ) : (
          <p className="text-5xl font-semibold leading-none tracking-tight tabular-nums">
            {value === null ? <>-<span className="sr-only"> Data tidak tersedia</span></> : value.toLocaleString('id-ID')}
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
