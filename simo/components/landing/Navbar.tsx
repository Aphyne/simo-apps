'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { URL_MASUK } from '@/lib/domain'
import { Logo, TAUTAN_BAGIAN } from './Logo'
import gaya from './landing.module.css'

// Navbar pil kaca yang mengambang. Di atas panggung gelap (elemen ber-data-panggung) memakai kaca gelap,
// selebihnya kaca terang. Di layar sempit tautan masuk ke panel lipat dengan kaca yang sama.
export default function Navbar() {
  const [buka, setBuka] = useState(false)
  const [gelap, setGelap] = useState(true)
  const [ringkas, setRingkas] = useState(false) // pil menyusut setelah halaman digulir

  useEffect(() => {
    const panggung = Array.from(document.querySelectorAll<HTMLElement>('[data-panggung]'))
    const cek = () => {
      const y = 40 // tinggi tengah navbar dari atas layar
      setGelap(panggung.some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y }))
      setRingkas(window.scrollY > 24)
    }
    cek()
    window.addEventListener('scroll', cek, { passive: true })
    window.addEventListener('resize', cek)
    return () => { window.removeEventListener('scroll', cek); window.removeEventListener('resize', cek) }
  }, [])

  useEffect(() => {
    if (!buka) return
    const tutup = (e: KeyboardEvent) => { if (e.key === 'Escape') setBuka(false) }
    window.addEventListener('keydown', tutup)
    return () => window.removeEventListener('keydown', tutup)
  }, [buka])

  const kaca = cn(gaya.pil, gelap ? gaya.pilGelap : gaya.pilTerang)
  const tautan = cn(
    'inline-flex items-center rounded-full text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
    gaya.rapat,
    gelap ? 'text-white/75 hover:bg-white/10 hover:text-white' : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
  )

  return (
    <header className={cn('fixed inset-x-0 z-50 px-3', gaya.rapat, ringkas ? 'top-2 sm:top-3' : 'top-3 sm:top-4')}>
      <nav aria-label="Navigasi halaman depan" className={cn('mx-auto flex items-center justify-between gap-2 rounded-full', kaca, ringkas ? 'h-12 max-w-[42rem] pl-3.5 pr-1.5' : 'h-14 max-w-4xl pl-4 pr-2')}>
        <Logo gelap={gelap} />
        <ul className="hidden items-center md:flex">
          {TAUTAN_BAGIAN.map((t) => (
            <li key={t.href}><a href={t.href} className={cn(tautan, ringkas ? 'h-9 px-3' : 'h-10 px-4')}>{t.label}</a></li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <Link
            href={URL_MASUK}
            className={cn(
              'hidden items-center gap-1.5 rounded-full text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex',
              gaya.rapat,
              ringkas ? 'h-9 px-3.5' : 'h-10 px-4',
              gelap ? 'bg-white text-[oklch(0.19_0.04_264)] hover:bg-white/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            Masuk ke SIMO
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setBuka((b) => !b)}
            aria-expanded={buka}
            aria-controls="menu-halaman-depan"
            aria-label={buka ? 'Tutup menu' : 'Buka menu'}
            className={cn('inline-flex size-11 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring md:hidden',
              gelap ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-foreground/5')}
          >
            {buka ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>
      {buka && (
        <div id="menu-halaman-depan" className={cn('mx-auto mt-2 max-w-4xl rounded-3xl p-2 md:hidden', kaca)}>
          <ul>
            {TAUTAN_BAGIAN.map((t) => (
              <li key={t.href}>
                <a href={t.href} onClick={() => setBuka(false)} className={cn(tautan, 'flex h-12 w-full px-4 text-[15px]')}>{t.label}</a>
              </li>
            ))}
          </ul>
          <Link href={URL_MASUK} className="mt-1 flex h-12 items-center justify-center gap-1.5 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Masuk ke SIMO
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </header>
  )
}
