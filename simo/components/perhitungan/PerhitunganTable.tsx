'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Eye, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/ui/StatusBadge'
import RumusDisplay from '@/components/obat/RumusDisplay'
import { useObatList, useObatPerhitungan, useHitungUlang } from '@/hooks/useObat'
import { formatAngka, formatRupiah } from '@/lib/utils'
import type { Obat } from '@/types/obat'

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-line-subtle">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="py-3 px-4">
              <div className="h-4 bg-surface-muted rounded-xl animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function DetailPanel({ obat }: { obat: Obat }) {
  const { data: perhitungan, isLoading } = useObatPerhitungan(obat.id)
  const hitungUlang = useHitungUlang()

  return (
    <div className="border-t border-line-subtle bg-surface px-6 py-5">
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-fg-secondary">
            Detail Perhitungan — {obat.nama}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-line-strong text-fg-secondary hover:bg-surface-subtle text-xs"
              onClick={() => hitungUlang.mutate(obat.id)}
              disabled={hitungUlang.isPending}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${hitungUlang.isPending ? 'animate-spin' : ''}`} />
              Hitung Ulang
            </Button>
            <Link href={`/obat/${obat.id}/detail`}>
              <Button size="sm" variant="outline" className="border-line-strong text-fg-secondary hover:bg-surface-subtle text-xs">
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Halaman Penuh
              </Button>
            </Link>
          </div>
        </div>
        {isLoading ? (
          <div className="text-center py-10 text-fg-muted text-sm">Memuat perhitungan...</div>
        ) : perhitungan ? (
          <RumusDisplay data={perhitungan} />
        ) : (
          <div className="text-center py-10 text-fg-muted text-sm">Data tidak tersedia</div>
        )}
      </div>
    </div>
  )
}

export default function PerhitunganTable() {
  const [search, setSearch]           = useState('')
  const [status, setStatus]           = useState('')
  const [belumDihitung, setBelumDihitung] = useState(false)
  const [selectedId, setSelectedId]   = useState<number | null>(null)
  const [page, setPage]               = useState(1)
  const [hitungProgress, setHitungProgress] = useState<{ current: number; total: number } | null>(null)

  const { data, isLoading } = useObatList({ page, limit: 20, search, status })
  const { data: allObatData } = useObatList({ limit: 9999 })
  const rawList: Obat[] = data?.data ?? []
  const meta = data?.meta
  const hitungUlangBatch = useHitungUlang()

  async function hitungUlangSemua() {
    const ids = (allObatData?.data ?? []).map((o) => o.id)
    if (ids.length === 0) return
    setHitungProgress({ current: 0, total: ids.length })
    for (let i = 0; i < ids.length; i++) {
      await hitungUlangBatch.mutateAsync(ids[i])
      setHitungProgress({ current: i + 1, total: ids.length })
    }
    setHitungProgress(null)
  }

  const obatList = belumDihitung ? rawList.filter((o) => o.eoq === null || o.eoq === undefined) : rawList

  function toggleDetail(id: number) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle pointer-events-none" />
          <input
            className="w-full border border-line-strong rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Cari nama atau kode obat..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="border border-line-strong rounded-lg px-3 py-2 text-sm text-fg-secondary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="">Semua Status</option>
          <option value="AMAN">Aman</option>
          <option value="MENDEKATI_ROP">Mendekati ROP</option>
          <option value="HARUS_REORDER">Harus Reorder</option>
        </select>

        <button
          onClick={() => setBelumDihitung((v) => !v)}
          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            belumDihitung
              ? 'bg-warning-100 text-warning-700 border-warning-200'
              : 'border-line-strong text-fg-tertiary hover:bg-surface-subtle'
          }`}
        >
          Belum Dihitung
        </button>

        <button
          onClick={hitungUlangSemua}
          disabled={hitungProgress !== null}
          className={`ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            hitungProgress !== null
              ? 'bg-brand-400 text-fg-inverse cursor-not-allowed'
              : 'bg-brand-600 hover:bg-brand-700 text-fg-inverse'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${hitungProgress !== null ? 'animate-spin' : ''}`} />
          {hitungProgress !== null
            ? `Menghitung ${hitungProgress.current}/${hitungProgress.total}...`
            : 'Hitung Ulang Semua'}
        </button>
      </div>

      {/* Tabel */}
      <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide whitespace-nowrap">Kode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide whitespace-nowrap">Nama Obat</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide whitespace-nowrap">
                  D<span className="block normal-case font-normal tracking-normal text-fg-muted">demand/tahun</span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide whitespace-nowrap">
                  EOQ<span className="block normal-case font-normal tracking-normal text-fg-muted">qty order optimal</span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide whitespace-nowrap">
                  SS<span className="block normal-case font-normal tracking-normal text-fg-muted">safety stock</span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide whitespace-nowrap">
                  ROP<span className="block normal-case font-normal tracking-normal text-fg-muted">reorder point</span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide whitespace-nowrap">
                  Total Cost<span className="block normal-case font-normal tracking-normal text-fg-muted">biaya/tahun</span>
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide whitespace-nowrap">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {isLoading ? (
                <SkeletonRows />
              ) : obatList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-fg-muted text-sm">Tidak ada data</td>
                </tr>
              ) : (
                obatList.map((obat) => (
                  <React.Fragment key={obat.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${
                        selectedId === obat.id ? 'bg-brand-50' : 'hover:bg-surface-subtle'
                      }`}
                      onClick={() => toggleDetail(obat.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-fg-muted whitespace-nowrap">{obat.kode}</td>
                      <td className="px-4 py-3 font-medium text-fg whitespace-nowrap">{obat.nama}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-fg-secondary">
                        {obat.demand_tahunan ? formatAngka(obat.demand_tahunan, 0) : <span className="text-fg-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {obat.eoq != null
                          ? <span className="font-semibold text-brand-700">{formatAngka(obat.eoq, 1)}</span>
                          : <span className="text-xs text-fg-muted italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {obat.safety_stock != null
                          ? <span className="font-semibold text-success-700">{formatAngka(obat.safety_stock, 2)}</span>
                          : <span className="text-xs text-fg-muted italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {obat.rop != null
                          ? <span className="font-semibold text-warning-700">{formatAngka(obat.rop, 2)}</span>
                          : <span className="text-xs text-fg-muted italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {obat.total_biaya != null
                          ? formatRupiah(obat.total_biaya)
                          : <span className="text-xs text-fg-muted italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <StatusBadge status={obat.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium ${selectedId === obat.id ? 'text-brand-600' : 'text-fg-muted'}`}>
                          {selectedId === obat.id ? '▲ Tutup' : '▼ Lihat'}
                        </span>
                      </td>
                    </tr>
                    {selectedId === obat.id && (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <DetailPanel obat={obat} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line bg-surface-subtle/50">
            <span className="text-xs text-fg-muted tabular-nums">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} dari {meta.total} obat
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-line text-fg-muted hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>
              {getPageNumbers(page, meta.last_page).map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-fg-subtle select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[30px] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      page === p
                        ? 'bg-brand-600 text-white border border-brand-600'
                        : 'border border-line text-gray-600 hover:bg-surface-muted'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-line text-fg-muted hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-fg-muted">
        Klik baris untuk expand detail kalkulasi • Klik &quot;Halaman Penuh&quot; untuk tampilan lebih lengkap
      </p>
    </div>
  )
}
