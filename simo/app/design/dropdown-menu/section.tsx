import { ChevronDown } from 'lucide-react'
import { PageHeader, Section } from '../_components'

export function DropdownMenuSection() {
  return (
    <section id="dropdown-menu">
      <PageHeader title="Dropdown & Menu" desc="Combobox pencarian obat (ObatCombobox.tsx) dan dropdown menu profil (Header.tsx)." />

      <Section title="Combobox obat (terbuka)">
        <div className="relative max-w-xs">
          <input placeholder="Cari nama atau kode obat..." className="h-9 w-full border border-line-strong rounded-lg px-3 text-sm" readOnly />
          <div className="absolute z-10 mt-1 w-full bg-surface border border-line rounded-lg shadow-lg">
            <div className="px-4 py-2.5 bg-brand-50">
              <p className="text-sm font-medium text-gray-800">Obh Combi Anak</p>
              <p className="text-xs text-fg-muted">Stok: 2 botol</p>
            </div>
            <div className="px-4 py-2.5">
              <p className="text-sm font-medium text-gray-800">Antasida Doen</p>
              <p className="text-xs text-fg-muted">Stok: 800 tablet</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Dropdown profil (header)">
        <div className="w-52 rounded-xl border border-line bg-surface shadow-lg p-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-semibold">AA</div>
            <div>
              <p className="text-sm font-semibold text-fg leading-tight">Admin Apotek</p>
              <p className="text-xs text-fg-muted mt-0.5">@admin</p>
            </div>
          </div>
          <div className="border-t border-line-subtle pt-2">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700">Admin</span>
          </div>
        </div>
      </Section>

      <Section title="Select dropdown (filter)">
        <div className="relative w-48">
          <select className="w-full appearance-none border border-line-strong rounded-lg pl-3 pr-8 py-2 text-sm text-fg-secondary bg-surface-subtle">
            <option>Semua Kategori</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        </div>
      </Section>
    </section>
  )
}
