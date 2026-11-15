'use client'

import { useMemo, useRef, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import Panel from '@/components/dashboard/Panel'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Obat } from '@/types/obat'

// Donut distribusi kategori: SEMUA kategori jadi irisan (warna dari token --kategori-1..14), tetapi
// legenda hanya menuliskan lima teratas supaya panel tetap ringkas. Setiap irisan adalah tombol:
// klik (atau Enter/Spasi) memfilter tabel, klik lagi untuk batal. Saat irisan disorot (hover, fokus,
// atau terpilih), nama, jumlah, dan persennya tampil di tengah donat. Warna tidak berdiri sendiri:
// nama selalu terbaca di tengah donat atau di legenda.
interface Props {
  allObat: Obat[]
  isLoading: boolean
  isError?: boolean
  kategoriAktif?: string
  onPilihKategori?: (kategori: string) => void
  className?: string
}

const R = 46
const KELILING = 2 * Math.PI * R
const CELAH = 1.2
const DI_LEGENDA = 5
const BANYAK_WARNA = 14

export default function KategoriDonut({ allObat, isLoading, isError, kategoriAktif = '', onPilihKategori, className }: Props) {
  const [hover, setHover] = useState<string | null>(null)
  // Satu tab stop untuk seluruh donat (roving tabindex): panah berpindah antar irisan.
  const [fokusIdx, setFokusIdx] = useState(0)
  // Irisan yang sedang menerima fokus keyboard (untuk cincin fokus); kosong bila fokusnya dari mouse.
  const [fokusNama, setFokusNama] = useState<string | null>(null)
  const refs = useRef<(SVGCircleElement | null)[]>([])

  const { irisan, total } = useMemo(() => {
    const map: Record<string, number> = {}
    allObat.forEach((o) => {
      map[o.kategori] = (map[o.kategori] ?? 0) + 1
    })
    const urut = Object.entries(map)
      .map(([nama, jumlah]) => ({ nama, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama))
    const total = allObat.length
    const irisan = urut.map((b, i) => ({
      ...b,
      warna: `var(--kategori-${(i % BANYAK_WARNA) + 1})`,
      panjang: total ? (b.jumlah / total) * KELILING : 0,
      // posisi awal = jumlah panjang irisan sebelumnya
      awal: urut.slice(0, i).reduce((s, x) => s + (total ? (x.jumlah / total) * KELILING : 0), 0),
      persen: total ? Math.round((b.jumlah / total) * 100) : 0,
    }))
    return { irisan, total }
  }, [allObat])

  const sorot = hover ?? (kategoriAktif || null)
  const detail = irisan.find((s) => s.nama === sorot) ?? null
  const interaktif = Boolean(onPilihKategori)

  function pilih(nama: string) {
    onPilihKategori?.(nama)
  }

  return (
    <Panel
      title="Distribusi kategori"
      className={className}
      bodyClassName="flex items-center"
      action={
        !isLoading && !isError && irisan.length > DI_LEGENDA ? (
          <span className="text-sm font-normal text-muted-foreground">
            {irisan.length} kategori
          </span>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex w-full items-center gap-5" aria-busy="true" aria-label="Memuat distribusi kategori">
          <Skeleton className="size-28 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            {Array.from({ length: DI_LEGENDA }).map((_, i) => (
              <Skeleton key={i} className="h-7 rounded-xl" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="flex w-full flex-col items-center gap-2 py-4 text-center">
          <TriangleAlert className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Distribusi kategori belum bisa dimuat</p>
          <p className="text-sm text-muted-foreground">Ini bukan berarti tidak ada obat.</p>
        </div>
      ) : total === 0 ? (
        <p className="w-full py-6 text-center text-sm text-muted-foreground">Belum ada obat, jadi belum ada kategori untuk ditampilkan.</p>
      ) : (
        <div className="flex w-full items-center gap-4">
          <div className="relative size-28 shrink-0">
            <svg viewBox="0 0 120 120" className="size-full" role="group" aria-label={`Distribusi ${total} obat dalam ${irisan.length} kategori`}>
              <circle cx={60} cy={60} r={R} fill="none" strokeWidth={14} className="stroke-muted" />
              <g transform="rotate(-90 60 60)">
                {irisan.map((s, i) => {
                  const aktif = s.nama === sorot
                  const redup = sorot !== null && !aktif
                  const dash = `${Math.max(s.panjang - CELAH, 0.6)} ${KELILING}`
                  const offset = -(s.awal + CELAH / 2)
                  return (
                    <g key={s.nama}>
                      <circle
                        ref={(el) => { refs.current[i] = el }}
                        cx={60}
                        cy={60}
                        r={R}
                        fill="none"
                        stroke={s.warna}
                        strokeWidth={aktif ? 18 : 14}
                        strokeDasharray={dash}
                        strokeDashoffset={offset}
                        opacity={redup ? 0.3 : 1}
                        tabIndex={interaktif && i === fokusIdx ? 0 : -1}
                        role="button"
                        aria-label={`${s.nama}: ${s.jumlah} obat, ${s.persen} persen${interaktif ? '. Tekan Enter untuk memfilter tabel' : ''}`}
                        aria-pressed={s.nama === kategoriAktif}
                        onMouseEnter={() => setHover(s.nama)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={(e) => {
                          setFokusIdx(i)
                          setHover(s.nama)
                          setFokusNama(e.currentTarget.matches(':focus-visible') ? s.nama : null)
                        }}
                        onBlur={() => { setHover(null); setFokusNama(null) }}
                        onClick={() => pilih(s.nama)}
                        onKeyDown={(e) => {
                          const n = irisan.length
                          let ke: number | null = null
                          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ke = (i + 1) % n
                          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ke = (i - 1 + n) % n
                          else if (e.key === 'Home') ke = 0
                          else if (e.key === 'End') ke = n - 1
                          if (ke !== null) {
                            e.preventDefault()
                            refs.current[ke]?.focus()
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            pilih(s.nama)
                          }
                        }}
                        className={cn('outline-none transition-[opacity,stroke-width] duration-150 motion-reduce:transition-none', interaktif ? 'cursor-pointer' : 'cursor-default')}
                      />
                      {/* Cincin fokus keyboard: garis tipis di luar irisan, selalu terlihat di atas warna apa pun */}
                      {fokusNama === s.nama && (
                        <circle
                          cx={60}
                          cy={60}
                          r={R + 12}
                          fill="none"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          className="pointer-events-none stroke-foreground"
                          strokeDasharray={dash}
                          strokeDashoffset={offset}
                          aria-hidden="true"
                        />
                      )}
                    </g>
                  )
                })}
              </g>
            </svg>

            {/* Tengah donat: total, atau detail irisan yang disorot */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-7 text-center" aria-hidden="true">
              {detail ? (
                <>
                  <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground">{detail.nama}</span>
                  <span className="mt-0.5 text-xl font-semibold leading-tight tabular-nums text-foreground">{detail.jumlah}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{detail.persen}%</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-semibold leading-none tabular-nums text-foreground">{total}</span>
                  <span className="mt-1 text-xs text-muted-foreground">obat</span>
                </>
              )}
            </div>
          </div>

          {/* Legenda: hanya lima teratas; sisanya terbaca dengan menyorot irisan atau lewat filter kategori */}
          <div className="min-w-0 flex-1">
            <ul>
              {irisan.slice(0, DI_LEGENDA).map((s) => {
                const dipilih = s.nama === kategoriAktif
                const isi = (
                  <>
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.warna }} aria-hidden="true" />
                    <span className={cn('min-w-0 flex-1 truncate', dipilih ? 'font-semibold text-foreground' : 'text-foreground/80')}>{s.nama}</span>
                    <span className="font-medium tabular-nums text-foreground">{s.jumlah}</span>
                  </>
                )
                const kelas = 'flex min-h-9 w-full items-center gap-2 rounded-xl px-2 py-1 text-left text-sm'
                return (
                  <li key={s.nama}>
                    {interaktif ? (
                      <button
                        type="button"
                        aria-pressed={dipilih}
                        onClick={() => pilih(s.nama)}
                        onMouseEnter={() => setHover(s.nama)}
                        onMouseLeave={() => setHover(null)}
                        className={cn(kelas, 'outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring', dipilih && 'bg-accent')}
                      >
                        {isi}
                      </button>
                    ) : (
                      <div className={kelas}>{isi}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </Panel>
  )
}
