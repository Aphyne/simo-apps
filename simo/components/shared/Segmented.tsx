'use client'

import { cn } from '@/lib/utils'

interface SegmentedProps<T extends string> {
  // Nama kelompok untuk pembaca layar, mis. "Periode grafik".
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  className?: string
}

// Pilihan satu dari dua atau tiga (mis. 7 hari / bulanan). Lebih dari tiga nilai memakai Select.
// Wadah dan tombol 40px (sama dengan Select di sebelahnya); aktif = putih bertepi tipis di atas abu muda. Bukan tab (tidak mengganti isi halaman):
// radiogroup dengan roving tabindex, panah kiri/kanan berpindah pilihan.
export default function Segmented<T extends string>({ label, value, options, onChange, className }: SegmentedProps<T>) {
  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const geser = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!geser) return
    e.preventDefault()
    const berikut = options[(index + geser + options.length) % options.length]
    onChange(berikut.value)
    const tombol = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    tombol?.[(index + geser + options.length) % options.length]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex h-10 items-center rounded-xl bg-muted', className)}>
      {options.map((o, i) => {
        const aktif = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={aktif}
            tabIndex={aktif ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'h-10 whitespace-nowrap rounded-xl px-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              aktif ? 'bg-card text-foreground ring-1 ring-inset ring-border' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
