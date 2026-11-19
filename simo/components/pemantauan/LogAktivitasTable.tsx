'use client'

import { useState } from 'react'
import { CircleAlert, Download, ListX } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Panel from '@/components/dashboard/Panel'
import { FilterBar } from '@/components/shared/FilterBar'
import Pagination from '@/components/shared/Pagination'
import StateMessage from '@/components/shared/StateMessage'
import TabelSkeleton from '@/components/shared/TabelSkeleton'
import { useLogAktivitas, type JenisAktivitas, type LogAktivitas, type LogFilter, type RingkasanUser } from '@/hooks/useAktivitas'
import { cn } from '@/lib/utils'
import { formatWaktu, formatWaktuSingkat, ringkasPerangkat } from './format'

export const JENIS_LABEL: Record<JenisAktivitas, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; kelas?: string }> = {
  login: { label: 'Login', variant: 'secondary' },
  logout: { label: 'Logout', variant: 'outline' },
  halaman: { label: 'Halaman', variant: 'outline' },
  aksi: { label: 'Aksi data', variant: 'default' },
  login_gagal: { label: 'Login gagal', variant: 'destructive', kelas: 'text-danger-700' },
}

export const PER_HALAMAN_LOG = 20

interface Props {
  users: RingkasanUser[]
  // Filter lengkap, termasuk rentang tanggal dari periode halaman dan nomor halaman dari URL.
  filter: LogFilter
  onUbah: (patch: { user?: string | null; jenis?: string | null }) => void
  onHalaman: (n: number) => void
}

// Daftar log dengan paginasi di server. Rentang tanggal mengikuti periode di kepala halaman; di sini hanya pengguna dan jenis.
export default function LogAktivitasTable({ users, filter, onUbah, onHalaman }: Props) {
  const { data, isLoading, isError, refetch } = useLogAktivitas(filter)
  const [exporting, setExporting] = useState(false)
  const rows = data?.data ?? []
  const meta = data?.meta
  const aktif = Boolean(filter.user_id || filter.jenis)

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

  const opsiUser = [{ value: '', label: 'Semua pengguna' }, ...users.map((u) => ({ value: String(u.id), label: `${u.nama} (@${u.username})` }))]
  const opsiJenis = [{ value: '', label: 'Semua jenis' }, ...Object.entries(JENIS_LABEL).map(([k, v]) => ({ value: k, label: v.label }))]

  return (
    <Panel
      title="Log aktivitas"
      count={meta?.total}
      action={<span className="hidden text-sm font-normal text-muted-foreground sm:inline">Diperbarui otomatis tiap 30 detik · waktu WIB</span>}
      bodyClassName="px-0 pb-0"
      className="scroll-mt-4"
    >
      <div id="log-aktivitas" className="px-5 pb-4">
        <FilterBar className="grid grid-cols-2 sm:flex sm:flex-wrap">
          <PilihanCombobox aria-label="Pengguna" options={opsiUser} value={filter.user_id ?? ''} onChange={(v) => onUbah({ user: v || null })} placeholder="Semua pengguna" noun="pengguna" className="col-span-2 sm:w-56" />
          <PilihanCombobox aria-label="Jenis aktivitas" options={opsiJenis} value={filter.jenis ?? ''} onChange={(v) => onUbah({ jenis: v || null })} placeholder="Semua jenis" noun="jenis" className="col-span-2 sm:w-44" />
          {aktif && (
            <Button variant="ghost" size="lg" className="h-10 rounded-xl px-3" onClick={() => onUbah({ user: null, jenis: null })}>
              Atur ulang
            </Button>
          )}
          <Button size="lg" className="col-span-2 h-10 rounded-xl px-4 sm:ml-auto" onClick={exportExcel} disabled={exporting}>
            <Download data-icon="inline-start" aria-hidden="true" />
            {exporting ? 'Mengekspor...' : 'Ekspor Excel'}
          </Button>
        </FilterBar>
      </div>

      {isError ? (
        <StateMessage
          icon={CircleAlert}
          title="Log belum bisa dimuat"
          description="Ini bukan berarti belum ada aktivitas. Periksa koneksi, lalu coba lagi."
          action={<Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={() => refetch()}>Coba lagi</Button>}
          className="border-t"
        />
      ) : !isLoading && rows.length === 0 ? (
        <StateMessage icon={ListX} title="Belum ada aktivitas untuk filter ini" description="Ubah pengguna, jenis, atau periode di kepala halaman." className="border-t" />
      ) : (
        <div aria-busy={isLoading}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 whitespace-nowrap pl-5 text-xs font-medium text-muted-foreground">Waktu</TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">Pengguna</TableHead>
                <TableHead className="h-10 text-xs font-medium text-muted-foreground">Aktivitas</TableHead>
                <TableHead className="hidden h-10 text-xs font-medium text-muted-foreground xl:table-cell">Halaman / endpoint</TableHead>
                <TableHead className="hidden h-10 text-xs font-medium text-muted-foreground 2xl:table-cell">Perangkat</TableHead>
                <TableHead className="hidden h-10 pr-5 text-xs font-medium text-muted-foreground 2xl:table-cell">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TabelSkeleton
                  baris={8}
                  kolom={[
                    { garis: ['w-24'] },
                    { garis: ['w-28', 'w-16'] },
                    { garis: ['w-44'] },
                    { garis: ['w-36'], kelas: 'hidden xl:table-cell' },
                    { garis: ['w-28'], kelas: 'hidden 2xl:table-cell' },
                    { garis: ['w-20'], kelas: 'hidden 2xl:table-cell' },
                  ]}
                />
              ) : (
                rows.map((r) => {
                  const j = JENIS_LABEL[r.jenis]
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap py-2.5 pl-5 tabular-nums text-muted-foreground">{formatWaktuSingkat(r.created_at)}</TableCell>
                      <TableCell className="py-2.5">
                        <span className="block font-medium text-foreground">{r.nama ?? r.username ?? '—'}</span>
                        {r.username && r.nama && <span className="font-mono text-xs text-muted-foreground">@{r.username}</span>}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Badge variant={j?.variant ?? 'outline'} className={cn(j?.kelas)}>{j?.label ?? r.jenis}</Badge>
                          <span className="text-foreground">{r.deskripsi ?? '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden py-2.5 font-mono text-xs text-muted-foreground xl:table-cell">{r.path ?? '—'}</TableCell>
                      <TableCell className="hidden whitespace-nowrap py-2.5 text-muted-foreground 2xl:table-cell">{ringkasPerangkat(r.user_agent)}</TableCell>
                      <TableCell className="hidden py-2.5 pr-5 font-mono text-xs text-muted-foreground 2xl:table-cell">{r.ip ?? '—'}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          {!isLoading && meta && meta.last_page > 1 && (
            <Pagination page={meta.current_page} lastPage={meta.last_page} total={meta.total} perPage={meta.per_page} noun="aktivitas" onPageChange={onHalaman} />
          )}
          {!isLoading && meta && meta.last_page <= 1 && <p role="status" className="sr-only">{meta.total} aktivitas</p>}
        </div>
      )}
    </Panel>
  )
}
