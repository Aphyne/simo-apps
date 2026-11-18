'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { cariMirip } from '@/lib/opsiObat'

export interface Pilihan {
  value: string
  label: string
}

interface Props {
  options: Pilihan[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  // Kata benda untuk pesan kosong ("Tidak ada {noun} yang cocok").
  noun?: string
  error?: boolean
  // Dipakai FieldLabel (htmlFor) dan untuk memfokuskan kolom ini saat validasi gagal.
  id?: string
  'aria-describedby'?: string
  'aria-required'?: boolean | 'true' | 'false'
  // Nama aksesibel bila tidak ada FieldLabel (mis. filter di bilah filter).
  'aria-label'?: string
  // Kelas untuk pembungkus (lebar kolom).
  className?: string
  // Bila diisi, teks yang diketik dan belum ada di daftar menampilkan pilihan terakhir "Tambah '…' sebagai {noun} baru".
  // `rapikan` menyamakan ejaan dengan yang disimpan server.
  tambahBaru?: { rapikan: (teks: string) => string; maks: number }
  disabled?: boolean
}

// Kolom pilihan dari daftar tertutup (kategori, satuan, supplier) dengan pola yang sama dengan kolom cari obat:
// ketik untuk menyaring, panah atas/bawah memilih, Enter menetapkan, Esc menutup. Beda dengan ObatCombobox, nilai
// hanya bisa berupa salah satu pilihan: mengetik tidak menghapus pilihan, dan keluar dari kolom tanpa memilih
// mengembalikan tulisan pilihan semula (tidak ada teks bebas yang menyangkut).
export default function PilihanCombobox({
  options,
  value,
  onChange,
  placeholder = 'Pilih',
  noun = 'pilihan',
  error,
  id,
  'aria-describedby': describedBy,
  'aria-required': ariaRequired,
  'aria-label': ariaLabel,
  className,
  tambahBaru,
  disabled,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [aktif, setAktif] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()

  const terpilih = options.find((o) => o.value === value)
  const q = query.trim().toLowerCase()
  const tersaring = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
  const kandidat = tambahBaru && q ? tambahBaru.rapikan(query) : ''
  const sudahAda = kandidat !== '' && options.some((o) => o.label.toLowerCase() === kandidat.toLowerCase())
  // Salah ketik yang hampir sama dengan pilihan yang ada ditawarkan dulu ("Maksud Anda ...?"), SEBELUM pilihan membuat baru,
  // jadi Enter pada hasil tanpa kecocokan memilih yang benar, bukan membuat nilai baru yang salah.
  const mirip =
    tambahBaru && kandidat && !sudahAda
      ? cariMirip(kandidat, options.map((o) => o.label))
          .filter((l) => !tersaring.some((t) => t.label === l))
          .map((l) => options.find((o) => o.label === l))
          .filter((o): o is Pilihan => Boolean(o))
      : []
  const daftar: (Pilihan & { baru?: boolean; saran?: boolean })[] =
    tambahBaru && kandidat && !sudahAda
      ? [
          ...tersaring,
          ...mirip.map((o) => ({ value: o.value, label: `Maksud Anda “${o.label}”?`, saran: true })),
          { value: kandidat, label: `Tambah “${kandidat}” sebagai ${noun} baru`, baru: true },
        ]
      : tersaring

  useEffect(() => {
    function klikLuar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', klikLuar)
    return () => document.removeEventListener('mousedown', klikLuar)
  }, [])

  function pilih(o: Pilihan) {
    onChange(o.value)
    setQuery('')
    setOpen(false)
  }

  function buka() {
    setQuery('')
    // Baris pilihan sekarang sudah menyala saat daftar terbuka, supaya panah bergerak dari posisinya.
    const i = options.findIndex((o) => o.value === value)
    setAktif(i >= 0 ? i : 0)
    setOpen(true)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) { buka(); return }
      const n = daftar.length
      if (n > 0) setAktif((a) => (e.key === 'ArrowDown' ? (a + 1) % n : (a - 1 + n) % n))
    } else if (e.key === 'Enter' && open) {
      // Enter di kolom ini memilih, bukan mengirim form.
      e.preventDefault()
      if (daftar[aktif]) pilih(daftar[aktif])
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
      setQuery('')
    } else if (e.key === 'Tab') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div className="relative">
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && daftar[aktif] ? `${listId}-${aktif}` : undefined}
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
          aria-required={ariaRequired}
          aria-label={ariaLabel}
          className="h-10 rounded-xl pr-9"
          placeholder={placeholder}
          value={open ? query : (terpilih?.label ?? value)}
          maxLength={tambahBaru?.maks}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value)
            setAktif(0)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
          onFocus={buka}
          onClick={() => { if (!open) buka() }}
          autoComplete="off"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={`Pilihan ${noun}`}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl bg-popover py-1 shadow-md ring-1 ring-foreground/10"
        >
          {daftar.length === 0 ? (
            <p className="px-4 py-3 text-center text-sm text-muted-foreground">Tidak ada {noun} yang cocok</p>
          ) : (
            daftar.map((o, i) => (
              <div
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={!o.baru && o.value === value}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors',
                  i === aktif ? 'bg-accent' : 'hover:bg-accent/60',
                  !o.baru && o.value === value && 'font-medium',
                  o.baru && 'font-medium text-primary'
                )}
                onMouseEnter={() => setAktif(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  pilih(o)
                }}
              >
                <span className={cn('min-w-0 truncate', o.baru ? 'text-primary' : 'text-foreground')}>{o.label}</span>
                {o.baru ? <Plus className="size-4 shrink-0" aria-hidden="true" /> : o.value === value && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
