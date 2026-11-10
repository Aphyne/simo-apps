'use client'

import { useState } from 'react'
import { Download, RotateCcw } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import api from '@/lib/api'
import {
  useLogAktivitas,
  type JenisAktivitas,
  type LogAktivitas,
  type LogFilter,
  type RingkasanUser,
} from '@/hooks/useAktivitas'
import { formatWaktu, getPageNumbers } from './format'

const JENIS_LABEL: Record<JenisAktivitas, { label: string; cls: string }> = {
  login: { label: 'Login', cls: 'bg-success-100 text-success-700' },
  logout: { label: 'Logout', cls: 'bg-surface-muted text-fg-tertiary' },
  halaman: { label: 'Halaman', cls: 'bg-brand-100 text-brand-700' },
  aksi: { label: 'Aksi Data', cls: 'bg-purple-100 text-purple-700' },
  login_gagal: { label: 'Login Gagal', cls: 'bg-danger-100 text-danger-700' },
}

const inputCls =
  'border border-line-strong rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500'

const pageBtn =
  'px-2.5 py-1.5 rounded-lg text-xs font-medium border border-line text-fg-muted hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors'

interface Props {
  users: RingkasanUser[]
  filter: LogFilter
  setFilter: (f: LogFilter) => void
}

export default function LogAktivitasTable({ users, filter, setFilter }: Props) {
  const { data, isLoading } = useLogAktivitas(filter)
  const [exporting, setExporting] = useState(false)
  const rows = data?.data ?? []
  const meta = data?.meta
  const page = filter.page ?? 1
  const limit = filter.limit ?? 20

  const ubah = (patch: Partial<LogFilter>) => setFilter({ ...filter, ...patch, page: 1 })
  const reset = () => setFilter({ page: 1, limit })

  async function exportExcel() {
    setExporting(true)
    try {
      const semua: LogAktivitas[] = []
      let p = 1
      let last = 1
      do {
        const res = await api.get('/aktivitas', { params: { ...filter, page: p, limit: 500 } })
        semua.push(...(res.data.data as LogAktivitas[]))
        last = res.data.meta.last_page
        p++
      } while (p <= last)

      if (semua.length === 0) {
        toast.info('Tidak ada data untuk diekspor')
        return
      }
      const baris = semua.map((r) => ({
        'Waktu (WIB)': formatWaktu(r.created_at),
        Pengguna: r.nama ?? '',
        Username: r.username ?? '',
        Role: r.role ?? '',
        Jenis: JENIS_LABEL[r.jenis]?.label ?? r.jenis,
        Aktivitas: r.deskripsi ?? '',
        Halaman: r.path ?? '',
        Metode: r.metode ?? '',
        Status: r.status_http ?? '',
        IP: r.ip ?? '',
        Perangkat: r.user_agent ?? '',
      }))
      const ws = XLSX.utils.json_to_sheet(baris)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Log Aktivitas')
      XLSX.writeFile(wb, `log-aktivitas-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success(`${semua.length} baris diekspor`)
    } catch {
      toast.error('Gagal mengekspor log')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-line-subtle space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-fg-secondary">Log Aktivitas</h2>
            <p className="text-xs text-fg-muted mt-0.5">Diperbarui otomatis tiap 30 detik · waktu dalam WIB</p>
          </div>
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-fg-inverse font-medium rounded-lg px-4 py-2 text-sm"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Mengekspor...' : 'Ekspor Excel'}
          </button>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <label className="text-xs font-medium text-fg-tertiary space-y-1 block">
            Pengguna
            <select
              className={`${inputCls} block min-w-[180px]`}
              value={filter.user_id ?? ''}
              onChange={(e) => ubah({ user_id: e.target.value || undefined })}
            >
              <option value="">Semua pengguna</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.nama} (@{u.username})</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-fg-tertiary space-y-1 block">
            Jenis
            <select
              className={`${inputCls} block`}
              value={filter.jenis ?? ''}
              onChange={(e) => ubah({ jenis: e.target.value || undefined })}
            >
              <option value="">Semua jenis</option>
              {Object.entries(JENIS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-fg-tertiary space-y-1 block">
            Dari tanggal
            <input type="date" className={`${inputCls} block`} value={filter.dari ?? ''} onChange={(e) => ubah({ dari: e.target.value || undefined })} />
          </label>
          <label className="text-xs font-medium text-fg-tertiary space-y-1 block">
            Sampai tanggal
            <input type="date" className={`${inputCls} block`} value={filter.sampai ?? ''} onChange={(e) => ubah({ sampai: e.target.value || undefined })} />
          </label>
          <button onClick={reset} className="flex items-center gap-1.5 border border-line-strong text-fg-secondary hover:bg-surface-subtle rounded-lg px-3 py-2 text-sm">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              {['Waktu', 'Pengguna', 'Jenis', 'Aktivitas', 'Halaman / Endpoint', 'IP'].map((h) => (
                <th key={h} className="text-xs font-semibold text-fg-muted uppercase tracking-wide py-3 px-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="py-6 px-3"><div className="animate-pulse bg-surface-muted rounded-xl h-24" /></td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-fg-muted text-sm">Belum ada aktivitas yang tercatat untuk filter ini.</td></tr>
            )}
            {rows.map((r) => {
              const j = JENIS_LABEL[r.jenis]
              return (
                <tr key={r.id} className="border-b border-line-subtle hover:bg-surface-subtle transition-colors">
                  <td className="py-3 px-3 text-xs text-fg-tertiary whitespace-nowrap tabular-nums">{formatWaktu(r.created_at)}</td>
                  <td className="py-3 px-3">
                    <span className="block font-medium text-fg">{r.nama ?? r.username ?? '—'}</span>
                    {r.username && <span className="text-xs text-fg-muted font-mono">@{r.username}</span>}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${j?.cls ?? 'bg-surface-muted text-fg-tertiary'}`}>
                      {j?.label ?? r.jenis}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-fg-secondary">{r.deskripsi ?? '—'}</td>
                  <td className="py-3 px-3 text-xs text-fg-muted font-mono">{r.path ?? '—'}</td>
                  <td className="py-3 px-3 text-xs text-fg-muted font-mono">{r.ip ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-line bg-surface-subtle/50">
          <p className="text-xs text-fg-muted tabular-nums">
            {(page - 1) * limit + 1}–{Math.min(page * limit, meta.total)} dari {meta.total} aktivitas
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setFilter({ ...filter, page: page - 1 })} className={pageBtn}>
              Sebelumnya
            </button>
            {getPageNumbers(page, meta.last_page).map((n, i) =>
              n === '...' ? (
                <span key={`e${i}`} className="px-1.5 text-xs text-fg-subtle select-none">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setFilter({ ...filter, page: n })}
                  className={
                    n === page
                      ? 'min-w-[30px] px-2.5 py-1.5 rounded-lg text-xs font-medium bg-brand-600 text-white border border-brand-600'
                      : 'min-w-[30px] px-2.5 py-1.5 rounded-lg text-xs font-medium border border-line text-gray-600 hover:bg-surface-muted transition-colors'
                  }
                >
                  {n}
                </button>
              )
            )}
            <button disabled={page >= meta.last_page} onClick={() => setFilter({ ...filter, page: page + 1 })} className={pageBtn}>
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
