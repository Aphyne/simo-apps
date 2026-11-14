'use client'

// Kotak contoh radius: nilai piksel dibaca dari CSS di browser (getComputedStyle),
// bukan diketik, supaya selalu sama dengan --radius-* di globals.css.

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export function RadiusBox({ label, token, className }: { label: string; token: string; className: string }) {
  const kotakRef = useRef<HTMLDivElement>(null)
  const nilaiRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!kotakRef.current || !nilaiRef.current) return
    const px = parseFloat(getComputedStyle(kotakRef.current).borderTopLeftRadius)
    nilaiRef.current.textContent = px > 1000 ? 'penuh' : `${Math.round(px * 100) / 100}px`
  }, [])

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div ref={kotakRef} className={cn('size-16 border-2 border-primary bg-accent', className)} />
      <p className="mt-1 text-[13px] font-medium text-foreground">{label}</p>
      <p className="font-mono text-xs text-muted-foreground">{token}</p>
      <p ref={nilaiRef} className="min-h-4 font-mono text-xs text-muted-foreground" aria-label="Nilai terbaca dari CSS" />
    </div>
  )
}
