'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import type { Obat } from '@/types/obat'

interface Props {
  obatList: Obat[]
  value: string
  onChange: (value: string) => void
  error?: boolean
  placeholder?: string
}

export default function ObatCombobox({
  obatList,
  value,
  onChange,
  error,
  placeholder = 'Cari nama atau kode obat...',
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedObat = obatList.find((o) => String(o.id) === value)

  const filtered = query
    ? obatList
        .filter(
          (o) =>
            o.nama.toLowerCase().includes(query.toLowerCase()) ||
            o.kode.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 15)
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
    setOpen(true)
    if (value) onChange('')
  }

  const displayValue = open ? query : selectedObat ? `${selectedObat.nama} (${selectedObat.kode})` : ''

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          className={`h-9 w-full border rounded-lg pl-8 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-400 text-center">Tidak ada obat yang cocok</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center justify-between gap-2 transition-colors ${
                  String(o.id) === value ? 'bg-blue-50' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(o)
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{o.nama}</p>
                  <p className="text-xs text-gray-400">
                    Stok: <span className={o.stok <= 0 ? 'text-red-500 font-medium' : 'text-gray-600'}>{o.stok} {o.satuan}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-400 font-mono flex-shrink-0">{o.kode}</span>
              </button>
            ))
          )}
          {!query && obatList.length > 15 && (
            <p className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
              Ketik untuk mencari dari {obatList.length} obat
            </p>
          )}
        </div>
      )}
    </div>
  )
}
