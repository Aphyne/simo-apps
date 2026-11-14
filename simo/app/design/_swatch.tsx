'use client'

// Swatch berbasis token: blok warna memakai kelas token itu sendiri, dan nilai
// yang tampil dibaca dari CSS di browser (getComputedStyle), bukan diketik.
// Nilai ditulis langsung ke DOM lewat ref (tanpa state) supaya SSR dan klien sama.

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Browser modern mengembalikan warna oklch sebagai lab(...), sulit dibaca.
// Gambar satu piksel di kanvas lalu ubah ke hex.
function keHex(warna: string): string {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!ctx) return warna
  ctx.canvas.width = ctx.canvas.height = 1
  ctx.fillStyle = warna
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}${a < 255 ? h(a) : ''}`.toUpperCase()
}

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
      nilaiRef.current.textContent = keHex(getComputedStyle(blokRef.current).backgroundColor)
    }
  }, [])

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div ref={blokRef} className={cn('rounded-md border', compact ? 'h-10' : 'h-14', className)} />
      <p className="mt-1 text-[13px] font-medium text-foreground">{name}</p>
      <p className="break-words font-mono text-xs text-muted-foreground">{token}</p>
      <p ref={nilaiRef} className="min-h-4 break-words font-mono text-xs text-muted-foreground" aria-label="Nilai terbaca dari CSS" />
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}
