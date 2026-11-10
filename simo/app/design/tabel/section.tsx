import { Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Section } from '../_components'

export function TabelSection() {
  return (
    <section id="tabel">
      <PageHeader title="Tabel" desc="Header uppercase abu-abu, baris hover abu-abu tipis, angka rata kanan dengan tabular-nums, aksi di kolom terakhir." />

      <Section title="Tabel data">
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Kode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Nama Obat</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-fg-muted uppercase tracking-wide">Stok</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              <tr className="hover:bg-surface-subtle transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">OBT-011</td>
                <td className="px-4 py-3 font-medium text-fg">Obh Combi Anak</td>
                <td className="px-4 py-3 text-right font-semibold text-danger-600">2 botol</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded-full border border-danger-200 bg-danger-100 px-2.5 py-0.5 text-xs font-medium text-danger-700">Harus Reorder</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="rounded-lg p-1.5 text-fg-muted hover:bg-brand-50 hover:text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button className="rounded-lg p-1.5 text-fg-muted hover:bg-danger-50 hover:text-danger-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-surface-subtle transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-fg-muted">OBT-012</td>
                <td className="px-4 py-3 font-medium text-fg">Antasida Doen</td>
                <td className="px-4 py-3 text-right font-semibold text-fg">800 tablet</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Aman</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="rounded-lg p-1.5 text-fg-muted hover:bg-brand-50 hover:text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button className="rounded-lg p-1.5 text-fg-muted hover:bg-danger-50 hover:text-danger-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line bg-surface">
                <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Total</td>
                <td className="px-4 py-3 text-right font-bold text-fg">802 unit</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      <Section title="Empty state">
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="py-10 text-center text-sm text-fg-muted">Tidak ada data</div>
        </div>
      </Section>

      <Section title="Loading (skeleton)">
        <div className="rounded-xl border border-line bg-surface p-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-surface-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </Section>
    </section>
  )
}
