import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  // Satu kalimat tentang isi halaman. Dipakai di halaman daftar dan form.
  description?: ReactNode
  // Baris keterangan di bawah judul (kode, kategori, status). Dipakai di halaman detail.
  meta?: ReactNode
  // Bila ada, tampil tombol kembali di atas judul. Perilaku kembali ditentukan halaman.
  onBack?: () => void
  backLabel?: string
  // Aksi halaman di kanan. Satu tombol utama (biru), sisanya outline.
  actions?: ReactNode
  // Letak aksi terhadap judul dan keterangan di layar lebar: 'start' (sejajar judul, bawaan) atau 'end' (rata bawah,
  // sejajar baris keterangan). Dipakai halaman yang keterangannya panjang.
  actionsAlign?: 'start' | 'end'
  className?: string
}

// Kepala halaman: berada di kanvas (bukan di dalam ubin), judul text-2xl, aksi di kanan.
// Di layar sempit aksi turun ke bawah judul.
export default function PageHeader({ title, description, meta, onBack, backLabel = 'Kembali', actions, actionsAlign = 'start', className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:justify-between', actionsAlign === 'end' ? 'sm:items-end' : 'sm:items-start', className)}>
      <div className="min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 mb-1 inline-flex h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            {backLabel}
          </button>
        )}
        <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {meta && <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">{meta}</div>}
        {description && <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
