'use client'

// Swatch berbasis token: blok warna memakai kelas token itu sendiri, dan nilai
// yang tampil dibaca dari CSS di browser (getComputedStyle), bukan diketik.
// Nilai ditulis langsung ke DOM lewat ref (tanpa state) supaya SSR dan klien sama.

import { useEffect, useRef } from 'react'

interface SwatchProps {
  name: string
  token: string
  className: string
  note?: string
  compact?: boolean
}

export function Swatch({ name, token, className, note, compact }: SwatchProps) {
  const blokRef = useRef<HTMLDivElement>(null)
  const nilaiRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (blokRef.current && nilaiRef.current) {
      nilaiRef.current.textContent = getComputedStyle(blokRef.current).backgroundColor
    }
  }, [])

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div ref={blokRef} className={`${compact ? 'h-10' : 'h-16'} rounded-lg border border-line ${className}`} />
      <p className="text-xs font-medium text-fg-secondary">{name}</p>
      <p className="text-[11px] text-fg-tertiary font-mono break-words">{token}</p>
      <p ref={nilaiRef} className="text-[10px] text-fg-muted font-mono break-words min-h-[15px]" aria-label="Nilai terbaca dari CSS" />
      {note && <p className="text-[11px] text-fg-muted">{note}</p>}
    </div>
  )
}
