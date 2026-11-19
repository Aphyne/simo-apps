'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AnalisisDetail } from '@/hooks/useAnalisis'
import { formatAngka, formatRupiah } from '@/lib/utils'

interface Props {
  item: AnalisisDetail | null
  onClose: () => void
}

function Baris({ label, nilai, rumus, tebal }: { label: string; nilai: string; rumus?: string; tebal?: boolean }) {
  return (
    <div className="border-t py-3 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className={tebal ? 'text-base font-semibold tabular-nums text-foreground' : 'text-sm font-medium tabular-nums text-foreground'}>{nilai}</dd>
      </div>
      {rumus && <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">{rumus}</p>}
    </div>
  )
}

// Rincian perhitungan satu obat: data masukan, lalu dua skenario berdampingan dengan rumus dan angka yang disubstitusi,
// supaya bisa diperiksa dengan kalkulator (dan dikutip ke skripsi). Dua kolom dipisah garis, bukan kartu di dalam kartu.
export default function AnalisisDetailModal({ item, onClose }: Props) {
  return (
    <Dialog open={item !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto p-5 sm:max-w-2xl sm:p-6">
        {item && <Isi d={item} />}
      </DialogContent>
    </Dialog>
  )
}

function Isi({ d }: { d: AnalisisDetail }) {
  const a = (n: number, k = 0) => formatAngka(n, k)
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold tracking-tight">{d.nama}</DialogTitle>
        <DialogDescription>
          <span className="font-mono text-xs">{d.kode}</span> · satuan {d.satuan} · 1 dus = {a(d.satuan_per_dus)} {d.satuan}
        </DialogDescription>
      </DialogHeader>

      <section aria-label="Data masukan">
        <h3 className="mb-3 text-[15px] font-semibold text-foreground">Data masukan</h3>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">Kebutuhan per tahun (D)</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-foreground">{a(d.demand_tahunan)} {d.satuan}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Biaya sekali pesan (S)</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-foreground">{formatRupiah(d.biaya_pesan)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Biaya simpan per {d.satuan} per tahun (H)</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-foreground">{formatRupiah(d.biaya_simpan)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-0">
        <section aria-label="Sebelum EOQ" className="sm:pr-6">
          <h3 className="text-[15px] font-semibold text-foreground">Sebelum EOQ</h3>
          <p className="mb-3 mt-0.5 text-sm text-muted-foreground">Asumsi: {a(d.asumsi_dus)} dus tiap pesan</p>
          <dl>
            <Baris label="Sekali pesan (Q)" nilai={`${a(d.q_tradisional)} ${d.satuan}`} rumus={`${a(d.asumsi_dus)} dus × ${a(d.satuan_per_dus)}`} />
            <Baris label="Pesan per tahun" nilai={`${a(d.frek_tradisional, 1)}×`} rumus={`D ÷ Q = ${a(d.demand_tahunan)} ÷ ${a(d.q_tradisional)}`} />
            <Baris label="Biaya pemesanan" nilai={formatRupiah(d.bp_tradisional)} rumus={`(D ÷ Q) × S = ${a(d.frek_tradisional, 2)} × ${a(d.biaya_pesan)}`} />
            <Baris label="Biaya penyimpanan" nilai={formatRupiah(d.bs_tradisional)} rumus={`(Q ÷ 2) × H = ${a(d.q_tradisional / 2, 1)} × ${a(d.biaya_simpan)}`} />
            <Baris label="Total per tahun" nilai={formatRupiah(d.tc_tradisional)} tebal />
          </dl>
        </section>

        <section aria-label="Dengan EOQ" className="sm:border-l sm:pl-6">
          <h3 className="text-[15px] font-semibold text-foreground">Dengan EOQ</h3>
          <p className="mb-3 mt-0.5 text-sm tabular-nums text-muted-foreground">EOQ = √(2 × D × S ÷ H) = {a(d.q_eoq)} {d.satuan}</p>
          <dl>
            <Baris label="Sekali pesan (Q)" nilai={`${a(d.q_eoq)} ${d.satuan}`} rumus={`≈ ${a(d.q_eoq_dus, 1)} dus`} />
            <Baris label="Pesan per tahun" nilai={`${a(d.frek_eoq, 1)}×`} rumus={`D ÷ Q = ${a(d.demand_tahunan)} ÷ ${a(d.q_eoq)}`} />
            <Baris label="Biaya pemesanan" nilai={formatRupiah(d.bp_eoq)} rumus={`(D ÷ Q) × S = ${a(d.frek_eoq, 2)} × ${a(d.biaya_pesan)}`} />
            <Baris label="Biaya penyimpanan" nilai={formatRupiah(d.bs_eoq)} rumus={`(Q ÷ 2) × H = ${a(d.q_eoq / 2, 1)} × ${a(d.biaya_simpan)}`} />
            <Baris label="Total per tahun" nilai={formatRupiah(d.tc_eoq)} tebal />
          </dl>
        </section>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl bg-muted/60 px-4 py-3">
        <p className="text-sm font-medium text-foreground">Penghematan per tahun</p>
        <p className="text-right">
          <span className="text-xl font-semibold tabular-nums text-primary">{formatRupiah(d.penghematan)}</span>
          <span className="ml-2 text-sm tabular-nums text-muted-foreground">({a(d.persen_hemat, 1)}% lebih hemat)</span>
        </p>
      </div>
    </>
  )
}
