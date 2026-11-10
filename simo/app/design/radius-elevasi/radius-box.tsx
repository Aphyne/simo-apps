'use client'

// Kotak contoh radius: nilai piksel dibaca dari CSS di browser (getComputedStyle),
// bukan diketik, supaya selalu sama dengan --radius-* di globals.css.

import { useEffect, useRef } from 'react'

export function RadiusBox({ label, token, className }: { label: string; token: string; className: string }) {
  const kotakRef = useRef<HTMLDivElement>(null)
  const nilaiRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!kotakRef.current || !nilaiRef.current) return
    const px = parseFloat(getComputedStyle(kotakRef.current).borderTopLeftRadius)
    nilaiRef.current.textContent = px > 1000 ? 'penuh (pill)' : `${Math.round(px * 100) / 100}px`
  }, [])

  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div ref={kotakRef} className={`w-16 h-16 bg-brand-100 border-2 border-brand-300 ${className}`} />
      <p className="text-xs font-medium text-fg-secondary">{label}</p>
      <p className="text-[11px] text-fg-tertiary font-mono">{token}</p>
      <p ref={nilaiRef} className="text-[11px] text-fg-muted font-mono min-h-[16px]" aria-label="Nilai terbaca dari CSS" />
    </div>
  )
}
