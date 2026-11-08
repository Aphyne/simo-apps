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
  login: { label: 'Login', cls: 'bg-emerald-100 text-emerald-700' },
  logout: { label: 'Logout', cls: 'bg-gray-100 text-gray-600' },
  halaman: { label: 'Halaman', cls: 'bg-blue-100 text-blue-700' },
  aksi: { label: 'Aksi Data', cls: 'bg-purple-100 text-purple-700' },
  login_gagal: { label: 'Login Gagal', cls: 'bg-red-100 text-red-600' },
}

const inputCls =
  'border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

const pageBtn =
  'px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'

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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Log Aktivitas</h2>
            <p className="text-xs text-gray-500 mt-0.5">Diperbarui otomatis tiap 30 detik · waktu dalam WIB</p>
          </div>
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Mengekspor...' : 'Ekspor Excel'}
          </button>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <label className="text-xs font-medium text-gray-600 space-y-1 block">
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
          <label className="text-xs font-medium text-gray-600 space-y-1 block">
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
          <label className="text-xs font-medium text-gray-600 space-y-1 block">
            Dari tanggal
            <input type="date" className={`${inputCls} block`} value={filter.dari ?? ''} onChange={(e) => ubah({ dari: e.target.value || undefined })} />
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1 block">
            Sampai tanggal
            <input type="date" className={`${inputCls} block`} value={filter.sampai ?? ''} onChange={(e) => ubah({ sampai: e.target.value || undefined })} />
          </label>
          <button onClick={reset} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2 text-sm">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['Waktu', 'Pengguna', 'Jenis', 'Aktivitas', 'Halaman / Endpoint', 'IP'].map((h) => (
                <th key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="py-6 px-3"><div className="animate-pulse bg-gray-100 rounded-xl h-24" /></td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500 text-sm">Belum ada aktivitas yang tercatat untuk filter ini.</td></tr>
            )}
            {rows.map((r) => {
              const j = JENIS_LABEL[r.jenis]
              return (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap tabular-nums">{formatWaktu(r.created_at)}</td>
                  <td className="py-3 px-3">
                    <span className="block font-medium text-gray-900">{r.nama ?? r.username ?? '—'}</span>
                    {r.username && <span className="text-xs text-gray-500 font-mono">@{r.username}</span>}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${j?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                      {j?.label ?? r.jenis}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-700">{r.deskripsi ?? '—'}</td>
                  <td className="py-3 px-3 text-xs text-gray-500 font-mono">{r.path ?? '—'}</td>
                  <td className="py-3 px-3 text-xs text-gray-500 font-mono">{r.ip ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
          <p className="text-xs text-gray-500 tabular-nums">
            {(page - 1) * limit + 1}–{Math.min(page * limit, meta.total)} dari {meta.total} aktivitas
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setFilter({ ...filter, page: page - 1 })} className={pageBtn}>
              Sebelumnya
            </button>
            {getPageNumbers(page, meta.last_page).map((n, i) =>
              n === '...' ? (
                <span key={`e${i}`} className="px-1.5 text-xs text-gray-400 select-none">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setFilter({ ...filter, page: n })}
                  className={
                    n === page
                      ? 'min-w-[30px] px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white border border-blue-600'
                      : 'min-w-[30px] px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors'
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
