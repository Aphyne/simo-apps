import { Search } from 'lucide-react'
import { PageHeader, Section } from '../_components'

export function FormSection() {
  return (
    <section id="form">
      <PageHeader title="Form" desc="Border line-strong, cincin fokus brand-500 2px. Label di atas field, asterisk merah untuk wajib, pesan error di bawah field." />

      <Section title="Input &amp; Select">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
          <div>
            <label className="text-sm font-medium text-fg-secondary mb-1 block">Nama Obat <span className="text-danger-600">*</span></label>
            <input placeholder="cth. Paracetamol 500mg" className="border border-line-strong rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" readOnly />
          </div>
          <div>
            <label className="text-sm font-medium text-fg-secondary mb-1 block">Kategori</label>
            <select className="border border-line-strong rounded-lg px-3 py-2 text-sm w-full text-fg-secondary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              <option>Analgesik</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-fg-secondary mb-1 block">Catatan (opsional)</label>
            <textarea rows={2} placeholder="Catatan tambahan..." className="border border-line-strong rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none" readOnly />
          </div>
        </div>
      </Section>

      <Section title="Dengan ikon" desc="Combobox pencarian — ikon di kiri, padding-left disesuaikan.">
        <div className="relative max-w-xs">
          <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input placeholder="Cari nama atau kode obat..." className="h-9 w-full border border-line-strong rounded-lg pl-8 pr-3 text-sm" readOnly />
        </div>
      </Section>

      <Section title="State error">
        <div className="max-w-sm">
          <label className="text-sm font-medium text-fg-secondary mb-1 block">Field dengan error</label>
          <input className="border border-danger-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-danger-500" readOnly />
          <p className="text-xs text-danger-600 mt-1">Wajib diisi</p>
        </div>
      </Section>

      <Section title="Prefix/suffix satuan" desc="Rp di kiri, satuan (botol/tablet) di kanan — padding disesuaikan supaya teks tidak tertimpa.">
        <div className="flex gap-4 max-w-sm">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-fg-muted">Rp</span>
            <input className="border border-line-strong rounded-lg pl-8 pr-3 py-2 text-sm w-full" readOnly />
          </div>
        </div>
      </Section>
    </section>
  )
}
