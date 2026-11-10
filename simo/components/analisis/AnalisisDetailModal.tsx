'use client'

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { AnalisisDetail } from '@/hooks/useAnalisis'
import { formatRupiah } from '@/lib/utils'

interface Props {
  item: AnalisisDetail
  onClose: () => void
}

export default function AnalisisDetailModal({ item, onClose }: Props) {
  const D = item.demand_tahunan
  const S = item.biaya_pesan
  const H = item.biaya_simpan
  const Q_trad = item.q_tradisional
  const Q_eoq = item.q_eoq

  const frek_trad = D / Q_trad
  const bp_trad   = Math.round(frek_trad * S)
  const rata_trad = Math.round(Q_trad / 2)
  const bs_trad   = Math.round(rata_trad * H)

  const frek_eoq  = D / Q_eoq
  const bp_eoq    = Math.round(frek_eoq * S)
  const rata_eoq  = Math.round(Q_eoq / 2)
  const bs_eoq    = Math.round(rata_eoq * H)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h3 className="font-semibold text-fg">{item.nama}</h3>
            <p className="text-xs text-fg-muted">{item.kode} · {item.satuan}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-fg-subtle hover:text-fg-tertiary hover:bg-surface-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Parameter */}
          <div className="rounded-xl bg-surface-subtle border border-line p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-3">Parameter</p>
            <div className="flex justify-between">
              <span className="text-fg-muted">Demand per tahun</span>
              <span className="font-medium text-fg">{D.toLocaleString('id-ID')} {item.satuan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">Biaya sekali pesan</span>
              <span className="font-medium text-fg">{formatRupiah(S)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">Biaya simpan per {item.satuan}/tahun</span>
              <span className="font-medium text-fg">{formatRupiah(H)}</span>
            </div>
          </div>

          {/* Perbandingan 2 kolom */}
          <div className="grid grid-cols-2 gap-3">
            {/* Sebelum EOQ */}
            <div className="rounded-xl border border-danger-100 overflow-hidden">
              <div className="bg-danger-50 px-3 py-2.5 border-b border-danger-100">
                <p className="text-xs font-semibold text-danger-600 uppercase tracking-wide">Sebelum EOQ</p>
                <p className="text-xs text-danger-400 mt-0.5">{Q_trad} {item.satuan}/pesan · asumsi {item.asumsi_dus} dus</p>
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <button onClick={() => toggle('frek')} className="flex items-center justify-between text-xs text-fg-muted hover:text-fg-tertiary transition-colors w-full text-left">
                    <span>Frekuensi pesan</span>
                    <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${expanded.has('frek') ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="text-sm font-semibold text-fg mt-0.5">{frek_trad.toFixed(1)}x / tahun</p>
                  {expanded.has('frek') && (
                    <p className="text-xs text-fg-muted mt-1 font-mono">{D} (demand) ÷ {Q_trad} (asumsi {item.asumsi_dus} dus × isi/dus)</p>
                  )}
                </div>
                <div>
                  <button onClick={() => toggle('bp')} className="flex items-center justify-between text-xs text-fg-muted hover:text-fg-tertiary transition-colors w-full text-left">
                    <span>Biaya pesan</span>
                    <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${expanded.has('bp') ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="text-sm font-semibold text-fg mt-0.5">{formatRupiah(bp_trad)}</p>
                  {expanded.has('bp') && (
                    <p className="text-xs text-fg-muted mt-1 font-mono">{frek_trad.toFixed(1)}x × {formatRupiah(S)} (biaya/pesan)</p>
                  )}
                </div>
                <div>
                  <button onClick={() => toggle('bs')} className="flex items-center justify-between text-xs text-fg-muted hover:text-fg-tertiary transition-colors w-full text-left">
                    <span>Biaya simpan</span>
                    <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${expanded.has('bs') ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="text-sm font-semibold text-fg mt-0.5">{formatRupiah(bs_trad)}</p>
                  {expanded.has('bs') && (
                    <p className="text-xs text-fg-muted mt-1 font-mono">{Q_trad}÷2 = {rata_trad} (stok rata) × {formatRupiah(H)}</p>
                  )}
                </div>
                <div className="pt-2 border-t border-danger-100">
                  <p className="text-xs text-fg-muted">Total / tahun</p>
                  <p className="text-sm font-bold text-danger-600 mt-0.5">{formatRupiah(item.tc_tradisional)}</p>
                </div>
              </div>
            </div>

            {/* Dengan EOQ */}
            <div className="rounded-xl border border-brand-100 overflow-hidden">
              <div className="bg-brand-50 px-3 py-2.5 border-b border-brand-100">
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Dengan EOQ</p>
                <p className="text-xs text-brand-400 mt-0.5">{Q_eoq} {item.satuan}/pesan</p>
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <button onClick={() => toggle('frek')} className="flex items-center justify-between text-xs text-fg-muted hover:text-fg-tertiary transition-colors w-full text-left">
                    <span>Frekuensi pesan</span>
                    <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${expanded.has('frek') ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="text-sm font-semibold text-fg mt-0.5">{frek_eoq.toFixed(1)}x / tahun</p>
                  {expanded.has('frek') && (
                    <p className="text-xs text-fg-muted mt-1 font-mono">{D} (demand) ÷ {Q_eoq} (EOQ)</p>
                  )}
                </div>
                <div>
                  <button onClick={() => toggle('bp')} className="flex items-center justify-between text-xs text-fg-muted hover:text-fg-tertiary transition-colors w-full text-left">
                    <span>Biaya pesan</span>
                    <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${expanded.has('bp') ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="text-sm font-semibold text-fg mt-0.5">{formatRupiah(bp_eoq)}</p>
                  {expanded.has('bp') && (
                    <p className="text-xs text-fg-muted mt-1 font-mono">{frek_eoq.toFixed(1)}x × {formatRupiah(S)} (biaya/pesan)</p>
                  )}
                </div>
                <div>
                  <button onClick={() => toggle('bs')} className="flex items-center justify-between text-xs text-fg-muted hover:text-fg-tertiary transition-colors w-full text-left">
                    <span>Biaya simpan</span>
                    <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${expanded.has('bs') ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="text-sm font-semibold text-fg mt-0.5">{formatRupiah(bs_eoq)}</p>
                  {expanded.has('bs') && (
                    <p className="text-xs text-fg-muted mt-1 font-mono">{Q_eoq}÷2 = {rata_eoq} (stok rata) × {formatRupiah(H)}</p>
                  )}
                </div>
                <div className="pt-2 border-t border-brand-100">
                  <p className="text-xs text-fg-muted">Total / tahun</p>
                  <p className="text-sm font-bold text-brand-600 mt-0.5">{formatRupiah(item.tc_eoq)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Penghematan */}
          <div className="rounded-xl bg-success-50 border border-success-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-success-800">Penghematan per tahun</span>
            <div className="text-right">
              <div className="text-lg font-bold text-success-700">{formatRupiah(item.penghematan)}</div>
              <div className="text-xs text-success-700">lebih hemat {item.persen_hemat}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
