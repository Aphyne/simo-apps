'use client'

import { useId, useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn, formatAngka } from '@/lib/utils'
import type { Obat } from '@/types/obat'

interface Props {
  obatList: Obat[]
  value: string
  onChange: (value: string) => void
  error?: boolean
  placeholder?: string
  // Dipakai FieldLabel (htmlFor) dan untuk memfokuskan kolom ini saat validasi gagal.
  id?: string
  'aria-describedby'?: string
}

// Kolom cari obat (combobox): ketik untuk mencari nama atau kode, panah atas/bawah memilih, Enter
// menetapkan, Esc menutup. Tampil 15 hasil teratas; sisanya muncul saat kata kunci dipersempit.
export default function ObatCombobox({
  obatList,
  value,
  onChange,
  error,
  placeholder = 'Cari nama atau kode obat',
  id,
  'aria-describedby': describedBy,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [aktif, setAktif] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selectedObat = obatList.find((o) => String(o.id) === value)

  const q = query.trim().toLowerCase()
  const filtered = q
    ? obatList.filter((o) => o.nama.toLowerCase().includes(q) || o.kode.toLowerCase().includes(q)).slice(0, 15)
    : obatList.slice(0, 15)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(obat: Obat) {
    onChange(String(obat.id))
    setQuery('')
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setQuery('')
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setAktif(0)
    setOpen(true)
    if (value) onChange('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) { setOpen(true); return }
      const n = filtered.length
      if (n > 0) setAktif((a) => (e.key === 'ArrowDown' ? (a + 1) % n : (a - 1 + n) % n))
    } else if (e.key === 'Enter' && open && filtered[aktif]) {
      // Enter di kolom ini memilih obat, bukan mengirim form.
      e.preventDefault()
      handleSelect(filtered[aktif])
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
      setQuery('')
    }
  }

  const displayValue = open ? query : selectedObat ? `${selectedObat.nama} (${selectedObat.kode})` : ''

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[aktif] ? `${listId}-${filtered[aktif].id}` : undefined}
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
          className="h-10 rounded-xl pl-9 pr-10"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          onFocus={() => {
            setOpen(true)
            if (selectedObat) setQuery('')
          }}
          autoComplete="off"
        />
        {selectedObat && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Hapus pilihan obat"
            className="absolute right-1 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Hasil pencarian obat"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl bg-popover shadow-md ring-1 ring-foreground/10"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-center text-sm text-muted-foreground">Tidak ada obat yang cocok</p>
          ) : (
            filtered.map((o, i) => (
              <div
                key={o.id}
                id={`${listId}-${o.id}`}
                role="option"
                aria-selected={String(o.id) === value}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 transition-colors',
                  i === aktif ? 'bg-accent' : 'hover:bg-accent/60',
                  String(o.id) === value && 'font-medium'
                )}
                onMouseEnter={() => setAktif(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(o)
                }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{o.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    Stok{' '}
                    <span className={o.stok <= 0 ? 'font-medium text-danger-700' : undefined}>
                      {formatAngka(o.stok, 0)} {o.satuan}{o.stok <= 0 ? ' (habis)' : ''}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{o.kode}</span>
              </div>
            ))
          )}
          {!query && obatList.length > 15 && (
            <p className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
              Ketik untuk mencari dari {obatList.length} obat
            </p>
          )}
        </div>
      )}
    </div>
  )
}
