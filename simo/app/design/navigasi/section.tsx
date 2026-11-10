import Image from 'next/image'
import { LayoutDashboard, Pill, PackagePlus, PackageMinus, FileText } from 'lucide-react'
import { PageHeader, Section } from '../_components'

export function NavigasiSection() {
  return (
    <section id="navigasi">
      <PageHeader title="Navigasi" desc="Sidebar aplikasi (kiri, fixed) dan Header (atas, sticky) — reproduksi struktur asli SIMO." />

      <Section title="Sidebar &amp; Header" meta="Sidebar.tsx + Header.tsx">
        <div className="rounded-xl border border-line bg-surface overflow-hidden flex" style={{ height: 420 }}>
          <aside className="w-56 bg-surface border-r border-line flex flex-col flex-shrink-0">
            <div className="px-5 h-14 flex items-center gap-2 border-b border-line">
              <Image src="/logo.png" alt="" width={28} height={28} className="flex-shrink-0" />
              <h1 className="text-base font-bold text-fg tracking-tight">SIMO</h1>
            </div>
            <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
              {[
                { label: 'Dashboard', Icon: LayoutDashboard },
                { label: 'Data Obat', Icon: Pill },
                { label: 'Stok Masuk', Icon: PackagePlus },
                { label: 'Stok Keluar', Icon: PackageMinus },
                { label: 'Laporan', Icon: FileText },
              ].map(({ label, Icon }, i) => (
                <div key={label} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium ${i === 0 ? 'bg-brand-600 text-white' : 'text-fg-tertiary'}`}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </div>
              ))}
            </nav>
            <div className="px-5 py-2.5 border-t border-line">
              <p className="text-[10px] text-fg-muted">SIMO v1.0 · 2026</p>
            </div>
          </aside>
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 bg-surface border-b border-line flex items-center justify-between px-5 flex-shrink-0">
              <p className="text-sm font-medium text-fg-muted">Apotek Rezky Medika</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[10px] font-semibold">AA</div>
                <p className="text-sm font-medium text-fg">Admin</p>
              </div>
            </header>
            <div className="flex-1 bg-surface-subtle flex items-center justify-center">
              <p className="text-sm text-fg-muted">— konten halaman —</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Menu item state" desc="Aktif: bg-brand-600 + text-white. Non-aktif: text-fg-tertiary, hover bg-surface-muted.">
        <div className="max-w-xs space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand-600 text-fg-inverse">
            <LayoutDashboard className="w-4 h-4" /> Aktif
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-fg-tertiary hover:bg-surface-muted">
            <Pill className="w-4 h-4" /> Non-aktif
          </div>
        </div>
      </Section>
    </section>
  )
}
