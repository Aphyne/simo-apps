import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Nomor halaman dengan elipsis: halaman pertama dan terakhir selalu ada.
export function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

interface PaginationProps {
  page: number
  lastPage: number
  total: number
  perPage: number
  // Kata benda untuk ringkasan, misalnya "obat": "1-10 dari 49 obat".
  noun: string
  onPageChange: (page: number) => void
  className?: string
}

// Paginasi di kaki panel tabel. Ringkasan di kiri, kontrol di kanan. Di layar sempit nomor halaman
// diganti "Halaman X dari Y" supaya tidak meluap. Tombol 40px; halaman aktif memakai aria-current.
export default function Pagination({ page, lastPage, total, perPage, noun, onPageChange, className }: PaginationProps) {
  const awal = (page - 1) * perPage + 1
  const akhir = Math.min(page * perPage, total)
  return (
    <nav aria-label="Navigasi halaman" className={cn('flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
        {awal}-{akhir} dari {total} {noun}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-xl"
          aria-label="Halaman sebelumnya"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <ChevronLeft />
        </Button>
        <span className="px-2 text-sm tabular-nums text-muted-foreground sm:hidden">
          Halaman {page} dari {lastPage}
        </span>
        <div className="hidden items-center gap-1 sm:flex">
          {getPageNumbers(page, lastPage).map((p, i) =>
            p === '...' ? (
              <span key={`elipsis-${i}`} className="px-1 text-sm text-muted-foreground" aria-hidden="true">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'ghost'}
                className="size-10 rounded-xl px-0 tabular-nums"
                aria-label={`Halaman ${p}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            )
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-xl"
          aria-label="Halaman berikutnya"
          onClick={() => onPageChange(Math.min(lastPage, page + 1))}
          disabled={page === lastPage}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
