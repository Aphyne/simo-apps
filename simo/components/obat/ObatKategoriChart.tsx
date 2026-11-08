'use client'

import { useMemo, useState } from 'react'
import type { Obat } from '@/types/obat'

// Semua kategori ditampilkan sebagai irisan donut. Detail (nama, jumlah, persen) tidak
// ditulis di legenda, melainkan muncul di tengah donut saat hover / fokus keyboard / dipilih,
// jadi kartu tetap ringkas. Legenda hanya berisi nama sebagai penunjuk warna + target klik.
// 14 warna berbeda: dipilih agar tetap bisa dibedakan, dan warna tidak pernah jadi satu-satunya
// penanda (nama selalu bisa dibaca lewat legenda & pusat donut).
const PALET = [
  '#2563EB', '#10B981', '#8B5CF6', '#F97316', '#06B6D4', '#EC4899', '#CA8A04',
  '#4F46E5', '#65A30D', '#E11D48', '#0F766E', '#B45309', '#475569', '#C026D3',
]

const R = 46
const KELILING = 2 * Math.PI * R
const CELAH = 1.4 // jarak antar irisan (satuan panjang busur)

interface Props {
  allObat: Obat[]
  isLoading: boolean
  // Opsional: klik irisan/legenda memfilter tabel di bawahnya (klik lagi untuk batal)
  kategoriAktif?: string
  onPilihKategori?: (kategori: string) => void
}

interface Irisan {
  name: string
  value: number
  pct: number
  warna: string
  panjang: number
  awal: number
}

export default function ObatKategoriChart({ allObat, isLoading, kategoriAktif = '', onPilihKategori }: Props) {
  const [hover, setHover] = useState<string | null>(null)

  const { irisan, total } = useMemo(() => {
    const map: Record<string, number> = {}
    allObat.forEach((o) => {
      map[o.kategori] = (map[o.kategori] ?? 0) + 1
    })
    const total = allObat.length
    const urut = Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))

    const irisan: Irisan[] = urut.map((d, i) => ({
      ...d,
      pct: total ? Math.round((d.value / total) * 100) : 0,
      warna: PALET[i % PALET.length],
      panjang: total ? (d.value / total) * KELILING : 0,
      // posisi awal irisan = jumlah panjang irisan sebelumnya
      awal: total ? (urut.slice(0, i).reduce((s, x) => s + x.value, 0) / total) * KELILING : 0,
    }))
    return { irisan, total }
  }, [allObat])

  // Yang ditampilkan di tengah: yang sedang di-hover/fokus, kalau tidak ada maka kategori terpilih
  const sorot = hover ?? (kategoriAktif || null)
  const detail = irisan.find((d) => d.name === sorot) ?? null

  function pilih(nama: string) {
    onPilihKategori?.(nama)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-700 mb-3">
        Distribusi per Kategori
        {!isLoading && irisan.length > 0 && (
          <span className="ml-2 text-xs font-normal text-gray-500">{irisan.length} kategori</span>
        )}
      </p>

      {isLoading ? (
        <div className="h-[140px] animate-pulse bg-gray-100 rounded-xl" />
      ) : irisan.length === 0 ? (
        <p className="text-center py-6 text-gray-500 text-sm">Belum ada data obat</p>
      ) : (
        <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
          {/* Donut */}
          <div className="relative flex-shrink-0 w-[140px] h-[140px]">
            <svg viewBox="0 0 120 120" className="w-full h-full" role="group" aria-label={`Komposisi ${total} obat dalam ${irisan.length} kategori`}>
              <g transform="rotate(-90 60 60)">
                {irisan.map((d) => {
                  const aktif = d.name === sorot
                  const redup = sorot !== null && !aktif
                  const tampak = Math.max(d.panjang - CELAH, 0.6)
                  return (
                    <circle
                      key={d.name}
                      cx={60}
                      cy={60}
                      r={R}
                      fill="none"
                      stroke={d.warna}
                      strokeWidth={aktif ? 20 : 16}
                      strokeDasharray={`${tampak} ${KELILING - tampak}`}
                      strokeDashoffset={-(d.awal + CELAH / 2)}
                      opacity={redup ? 0.35 : 1}
                      tabIndex={0}
                      role="button"
                      aria-label={`${d.name}: ${d.value} obat, ${d.pct} persen${onPilihKategori ? '. Tekan Enter untuk memfilter tabel' : ''}`}
                      aria-pressed={d.name === kategoriAktif}
                      onMouseEnter={() => setHover(d.name)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(d.name)}
                      onBlur={() => setHover(null)}
                      onClick={() => pilih(d.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          pilih(d.name)
                        }
                      }}
                      className={`outline-none transition-[opacity,stroke-width] duration-150 motion-reduce:transition-none focus-visible:opacity-100 ${
                        onPilihKategori ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    />
                  )
                })}
              </g>
            </svg>

            {/* Pusat donut: ringkasan, berubah jadi detail saat hover/fokus/dipilih */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none" aria-live="polite">
              {detail ? (
                <>
                  <span className="text-[11px] leading-tight font-medium text-gray-700 line-clamp-2">{detail.name}</span>
                  <span className="text-xl font-bold leading-tight text-gray-900 tabular-nums mt-0.5">{detail.value}</span>
                  <span className="text-[11px] text-gray-500 tabular-nums">{detail.pct}%</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold leading-tight text-gray-900 tabular-nums">{total}</span>
                  <span className="text-[11px] text-gray-500">obat</span>
                </>
              )}
            </div>
          </div>

          {/* Legenda minimal: hanya nama, sebagai penunjuk warna dan target klik */}
          <ul className="flex-1 min-w-0 flex flex-wrap gap-x-1 gap-y-1">
            {irisan.map((d) => {
              const aktif = d.name === sorot
              const dipilih = d.name === kategoriAktif
              return (
                <li key={d.name}>
                  <button
                    type="button"
                    onClick={() => pilih(d.name)}
                    onMouseEnter={() => setHover(d.name)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(d.name)}
                    onBlur={() => setHover(null)}
                    aria-pressed={dipilih}
                    disabled={!onPilihKategori}
                    title={onPilihKategori ? (dipilih ? `Batalkan filter ${d.name}` : `Filter tabel: ${d.name}`) : d.name}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${
                      dipilih
                        ? 'bg-blue-50 text-gray-900 ring-1 ring-blue-600'
                        : aktif
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                    } ${onPilihKategori ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.warna }} />
                    {d.name}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
