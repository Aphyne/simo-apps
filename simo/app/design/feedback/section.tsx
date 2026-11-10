import { PageHeader, Section } from '../_components'

export function FeedbackSection() {
  return (
    <section id="feedback">
      <PageHeader title="Feedback" desc="Badge untuk status singkat, alert untuk peringatan inline, toast untuk notifikasi reorder, progress untuk proses berjalan." />

      <Section title="Badge — Status Stok" meta="StatusBadge.tsx">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Aman</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-warning-200 bg-warning-100 px-2.5 py-0.5 text-xs font-medium text-warning-700">Mendekati ROP</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-danger-200 bg-danger-100 px-2.5 py-0.5 text-xs font-medium text-danger-700">Harus Reorder</span>
        </div>
      </Section>

      <Section title="Badge — Keterangan Transaksi &amp; Role">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700">Penjualan</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Retur</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-warning-100 text-warning-700">Rusak</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-danger-100 text-danger-600">Kedaluarsa</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-surface-muted text-fg-tertiary">Lainnya</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700">Admin</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-surface-muted text-fg-tertiary">Staf</span>
        </div>
      </Section>

      <Section title="Alert inline">
        <div className="max-w-sm rounded-lg bg-warning-50 border border-warning-200 p-3">
          <p className="text-xs font-semibold text-warning-700">2 obat akan expired dalam 90 hari</p>
          <p className="text-xs text-warning-700 mt-1">Lihat di Monitoring →</p>
        </div>
      </Section>

      <Section title="Reorder Alert (bell dropdown)" meta="AlertNotification.tsx">
        <div className="w-72 rounded-xl border border-line bg-surface shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-line-subtle">
            <p className="text-sm font-semibold text-fg">Reorder Alert</p>
            <span className="bg-danger-100 text-danger-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">1</span>
          </div>
          <div className="p-2">
            <div className="rounded-xl border border-line-subtle bg-surface p-3 space-y-1.5 shadow-sm">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-danger-100 text-danger-600">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-500" />STOK HABIS
              </span>
              <p className="text-sm font-semibold text-fg">Obh Combi Anak</p>
              <p className="text-xs text-fg-muted">Stok sisa <span className="font-semibold text-danger-600">2</span> botol · ROP 9</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Progress bar">
        <div className="max-w-xs space-y-3">
          <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
            <div className="h-full bg-brand-600" style={{ width: '65%' }} />
          </div>
          <p className="text-xs text-fg-muted">Menghitung ulang 13 / 20 obat...</p>
        </div>
      </Section>

      <Section title="Empty state" desc="Pola konsisten di semua tabel/daftar saat data kosong.">
        <div className="flex flex-col items-center justify-center py-10 text-center text-fg-muted">
          <p className="text-sm">Belum ada barang keluar hari ini</p>
        </div>
      </Section>
    </section>
  )
}
