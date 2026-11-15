import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Kelas bersama supaya kolom cari dan Select di bilah filter sama tinggi (40px) dan sama radius.
// `data-[size=default]:h-10` perlu karena SelectTrigger mengunci tinggi lewat atribut data.
export const FILTER_SELECT = 'h-10 w-full rounded-xl data-[size=default]:h-10 sm:w-44'

// Bilah filter: satu baris berisi kolom cari, Select, tombol Atur ulang (bila ada filter aktif),
// dan aksi utama di kanan (`sm:ml-auto`). Di layar sempit dipakai grid 2 kolom: cari dan tombol
// selebar penuh (`col-span-2`), dua Select berdampingan. Kirim `className="grid grid-cols-2 sm:flex sm:flex-wrap"`.
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="search" className={cn('flex flex-wrap items-center gap-2', className)}>
      {children}
    </div>
  )
}

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  // Label untuk pembaca layar; kolom cari tidak punya label yang terlihat.
  label: string
  className?: string
}

export function SearchField({ value, onChange, placeholder, label, className }: SearchFieldProps) {
  return (
    <div className={cn('relative min-w-[12rem] flex-1 sm:max-w-sm', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl pl-9 text-sm"
      />
    </div>
  )
}
