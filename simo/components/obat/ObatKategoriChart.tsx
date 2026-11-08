'use client'

import { useMemo, useState } from 'react'
import type { Obat } from '@/types/obat'

// Warna hanya untuk TOP kategori; sisanya digabung "Kategori lain" (abu-abu).
// Donut tidak cocok untuk > 5-6 irisan, jadi dipakai batang bertumpuk 100% + legenda ringkas.
const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F97316', '#06B6D4']
const WARNA_LAIN = '#9CA3AF'
const TOP_N = 5

interface Props {
  allObat: Obat[]
  isLoading: boolean
  // Opsional: klik kategori memfilter tabel di bawahnya (klik lagi untuk batal)
  kategoriAktif?: string
  onPilihKategori?: (kategori: string) => void
}

interface Item {
  name: string
  value: number
  pct: number
  warna: string
}

export default function ObatKategoriChart({ allObat, isLoading, kategoriAktif = '', onPilihKategori }: Props) {
  const [semua, setSemua] = useState(false)

  const { items, total } = useMemo(() => {
    const map: Record<string, number> = {}
    allObat.forEach((o) => {
      map[o.kategori] = (map[o.kategori] ?? 0) + 1
    })
    const total = allObat.length
    const urut = Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    const items: Item[] = urut.map((d, i) => ({
      ...d,
      pct: total ? Math.round((d.value / total) * 100) : 0,
      warna: i < TOP_N ? COLORS[i] : WARNA_LAIN,
    }))
    return { items, total }
  }, [allObat])

  const top = items.slice(0, TOP_N)
  const lain = items.slice(TOP_N)
  const jumlahLain = lain.reduce((s, d) => s + d.value, 0)
  const pctLain = total ? Math.round((jumlahLain / total) * 100) : 0

  // Segmen batang: top kategori + satu segmen "Kategori lain"
  const segmen = [
    ...top.map((d) => ({ ...d, kategori: d.name as string | null })),
    ...(lain.length ? [{ name: `Kategori lain (${lain.length})`, value: jumlahLain, pct: pctLain, warna: WARNA_LAIN, kategori: null }] : []),
  ]

  const daftarLegenda = semua ? items.map((d) => ({ ...d, kategori: d.name as string | null })) : segmen

  function pilih(kategori: string | null) {
    if (kategori && onPilihKategori) onPilihKategori(kategori)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">Distribusi per Kategori</p>
          {!isLoading && items.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {items.length} kategori · {total} obat
              {onPilihKategori && ' · klik untuk memfilter tabel'}
            </p>
          )}
        </div>
        {lain.length > 0 && (
          <button
            onClick={() => setSemua((v) => !v)}
            aria-expanded={semua}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex-shrink-0"
          >
            {semua ? 'Ringkas' : `Lihat semua (${items.length})`}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="h-[72px] animate-pulse bg-gray-100 rounded-xl" />
      ) : items.length === 0 ? (
        <p className="text-center py-6 text-gray-500 text-sm">Belum ada data obat</p>
      ) : (
        <>
          {/* Batang bertumpuk 100% */}
          <div
            className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
            role="group"
            aria-label={`Komposisi ${total} obat per kategori`}
          >
            {segmen.map((s) => {
              const aktif = s.kategori !== null && s.kategori === kategoriAktif
              const redup = !!kategoriAktif && !aktif
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => pilih(s.kategori)}
                  disabled={s.kategori === null || !onPilihKategori}
                  title={`${s.name}: ${s.value} obat (${s.pct}%)`}
                  aria-label={`${s.name}: ${s.value} obat, ${s.pct} persen`}
                  className={`h-full min-w-[4px] transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                    redup ? 'opacity-35' : ''
                  } ${s.kategori !== null && onPilihKategori ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                  style={{ flexGrow: s.value, flexBasis: 0, backgroundColor: s.warna }}
                />
              )
            })}
          </div>

          {/* Legenda ringkas: nama + jumlah + persen langsung terbaca (tidak hanya warna) */}
          <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-1">
            {daftarLegenda.map((d) => {
              const aktif = d.kategori !== null && d.kategori === kategoriAktif
              const bisaKlik = d.kategori !== null && !!onPilihKategori
              const isi = (
                <>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.warna }} />
                  <span className="text-xs text-gray-700 flex-1 truncate text-left">{d.name}</span>
                  <span className="text-xs font-semibold text-gray-900 tabular-nums">{d.value}</span>
                  <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{d.pct}%</span>
                </>
              )
              return (
                <li key={d.name}>
                  {bisaKlik ? (
                    <button
                      type="button"
                      onClick={() => pilih(d.kategori)}
                      aria-pressed={aktif}
                      title={aktif ? `Batalkan filter ${d.name}` : `Filter tabel: ${d.name}`}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                        aktif ? 'bg-blue-50 ring-1 ring-blue-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      {isi}
                    </button>
                  ) : (
                    <div
                      className="flex items-center gap-2 px-2 py-1.5"
                      title={d.kategori === null ? lain.map((l) => `${l.name} (${l.value})`).join(', ') : undefined}
                    >
                      {isi}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
