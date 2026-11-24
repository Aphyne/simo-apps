'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

// Pesan bergilir di panel kiri halaman masuk: hanya hal yang benar-benar ada di aplikasi.
const PESAN = [
  { judul: 'Persediaan obat apotek, terpantau dari satu tempat.', isi: 'Stok, batas pesan ulang, dan status tiap obat dalam satu tampilan.' },
  { judul: 'Obat kedaluwarsa tidak lagi terlewat.', isi: 'Yang mendekati atau sudah lewat expired muncul lebih dulu.' },
  { judul: 'Pesan ulang tepat waktu.', isi: 'Daftar obat yang perlu dipesan, lengkap dengan supplier dan jumlahnya.' },
] as const

const JEDA_MS = 6000

// Salib bersudut bulat, bentuk turunan dari logo SIMO. Datar (satu warna, tanpa gradasi); warna dan keburamannya dari kelas pemanggil.
function Salib({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" fill="currentColor" aria-hidden="true" className={cn('pointer-events-none absolute', className)}>
      <rect x="80" y="0" width="80" height="240" rx="30" />
      <rect x="0" y="80" width="240" height="80" rx="30" />
    </svg>
  )
}

const QUERY_GERAK = '(prefers-reduced-motion: reduce)'
function langgananGerak(cb: () => void) {
  const mq = window.matchMedia(QUERY_GERAK)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function LoginPanel({ className }: { className?: string }) {
  const [indeks, setIndeks] = useState(0)
  const [dihentikan, setDihentikan] = useState(false) // pilihan pengguna lewat tombol jeda
  const [tertahan, setTertahan] = useState(false) // kursor di atas panel atau fokus di dalamnya

  // Pengguna yang meminta gerak dikurangi tidak diberi pergantian otomatis (dan tidak perlu tombol jedanya).
  const kurangiGerak = useSyncExternalStore(langgananGerak, () => window.matchMedia(QUERY_GERAK).matches, () => false)
  const berputar = !dihentikan && !kurangiGerak

  useEffect(() => {
    if (!berputar || tertahan) return
    const id = window.setInterval(() => setIndeks(i => (i + 1) % PESAN.length), JEDA_MS)
    return () => window.clearInterval(id)
  }, [berputar, tertahan])

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Pengantar SIMO"
      onMouseEnter={() => setTertahan(true)}
      onMouseLeave={() => setTertahan(false)}
      onFocus={() => setTertahan(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setTertahan(false) }}
      className={cn('relative flex min-h-[600px] flex-col justify-between overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground', className)}
    >
      {/* Latar berlapis (hiasan, disembunyikan dari pembaca layar). Pengecualian halaman masuk atas permintaan Boss:
          DESIGN.md melarang gradasi, tapi di sini dipakai agar panel tidak polos. Semua warna dari token (--primary),
          cahaya terang hanya di tengah-kanan (jauh dari teks), bagian bawah digelapkan supaya teks tetap >= 4,5:1. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_85%_38%,color-mix(in_oklab,var(--primary)_78%,white),transparent),radial-gradient(70%_50%_at_10%_105%,color-mix(in_oklab,var(--primary)_55%,black),transparent),radial-gradient(55%_40%_at_100%_100%,color-mix(in_oklab,var(--primary)_60%,black),transparent)]"
      />
      {/* Kisi titik halus di separuh atas. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(color-mix(in_oklab,white_35%,transparent)_1px,transparent_1.5px)] bg-[size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_60%)]"
      />
      <Salib className="-right-16 top-10 size-72 text-primary-foreground/10" />
      <Salib className="-left-6 top-60 size-28 -rotate-12 text-primary-foreground/15" />

      {/* Pratinjau aplikasi berkaca: ilustrasi saja (tanpa angka sungguhan), jadi disembunyikan dari pembaca layar. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-24 w-52 rounded-2xl border border-primary-foreground/30 bg-primary-foreground/15 p-4 backdrop-blur-md"
      >
        <p className="text-xs font-medium">Status stok</p>
        <div className="mt-3 flex flex-col gap-3">
          {[['Aman', 'w-4/5'], ['Mendekati ROP', 'w-1/2'], ['Habis', 'w-1/5']].map(([label, lebar]) => (
            <div key={label}>
              <p className="text-xs">{label}</p>
              <div className="mt-1 h-1.5 rounded-full bg-primary-foreground/25">
                <div className={cn('h-full rounded-full bg-primary-foreground', lebar)} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-6 top-56 w-44 rounded-2xl border border-primary-foreground/30 bg-primary-foreground/15 p-4 backdrop-blur-md"
      >
        <p className="text-xs font-medium">Pembelian vs penjualan</p>
        <div className="mt-3 flex h-14 items-end gap-1.5">
          {['h-6', 'h-9', 'h-7', 'h-12', 'h-8', 'h-14'].map((tinggi, i) => (
            <div key={i} className={cn('flex-1 rounded-sm', tinggi, i % 2 ? 'bg-primary-foreground/55' : 'bg-primary-foreground')} />
          ))}
        </div>
      </div>

      {/* Atas: merek. Nama apotek tidak ditulis di sini: halaman masuk adalah pintu umum (juga untuk calon pengguna);
          nama apotek tampil di header setelah masuk, dari menu Pengaturan. */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-card">
            <Image src="/logo.png" alt="" width={40} height={40} priority />
          </span>
          <span className="text-xl font-semibold tracking-tight">SIMO</span>
        </div>
      </div>

      {/* Bawah: pesan bergilir + kendali. Semua pesan ditumpuk di satu sel kisi supaya tingginya tetap. */}
      <div className="relative">
        <div className="grid" aria-live={berputar && !tertahan ? 'off' : 'polite'}>
          {PESAN.map((p, i) => (
            <div
              key={p.judul}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${PESAN.length}`}
              aria-hidden={i !== indeks}
              className={cn(
                'col-start-1 row-start-1 motion-safe:transition-opacity motion-safe:duration-500',
                i === indeks ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <p className="max-w-md text-balance text-3xl font-semibold leading-tight tracking-tight">{p.judul}</p>
              <p className="mt-3 max-w-md text-[15px]">{p.isi}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-1">
          {!kurangiGerak && (
            <button
              type="button"
              onClick={() => setDihentikan(v => !v)}
              aria-label={berputar ? 'Hentikan pergantian pesan' : 'Putar pergantian pesan'}
              className="flex size-11 items-center justify-center rounded-full outline-none transition-colors hover:bg-primary-foreground/15 focus-visible:ring-2 focus-visible:ring-primary-foreground"
            >
              {berputar ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
            </button>
          )}
          {PESAN.map((p, i) => (
            <button
              key={p.judul}
              type="button"
              onClick={() => setIndeks(i)}
              aria-label={`Tampilkan pesan ${i + 1} dari ${PESAN.length}`}
              aria-current={i === indeks}
              className="group flex h-11 items-center rounded-full px-1 outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
            >
              <span
                className={cn(
                  'block h-1 rounded-full motion-safe:transition-all',
                  i === indeks ? 'w-10 bg-primary-foreground' : 'w-6 bg-primary-foreground/70 group-hover:bg-primary-foreground',
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
