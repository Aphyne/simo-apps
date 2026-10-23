import Image from 'next/image'
import { LayoutDashboard, Pill, PackagePlus, PackageMinus, FileText } from 'lucide-react'
import { PageHeader, Section } from '../_components'

export function NavigasiSection() {
  return (
    <section id="navigasi">
      <PageHeader title="Navigasi" desc="Sidebar aplikasi (kiri, fixed) dan Header (atas, sticky) — reproduksi struktur asli SIMO." />

      <Section title="Sidebar &amp; Header" meta="Sidebar.tsx + Header.tsx">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex" style={{ height: 420 }}>
          <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="px-5 h-14 flex items-center gap-2 border-b border-gray-200">
              <Image src="/logo.png" alt="" width={28} height={28} className="flex-shrink-0" />
              <h1 className="text-base font-bold text-gray-900 tracking-tight">SIMO</h1>
            </div>
            <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
              {[
                { label: 'Dashboard', Icon: LayoutDashboard },
                { label: 'Data Obat', Icon: Pill },
                { label: 'Stok Masuk', Icon: PackagePlus },
                { label: 'Stok Keluar', Icon: PackageMinus },
                { label: 'Laporan', Icon: FileText },
              ].map(({ label, Icon }, i) => (
                <div key={label} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium ${i === 0 ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </div>
              ))}
            </nav>
            <div className="px-5 py-2.5 border-t border-gray-200">
              <p className="text-[10px] text-gray-500">SIMO v1.0 · 2026</p>
            </div>
          </aside>
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0">
              <p className="text-sm font-medium text-gray-500">Apotek Rezky Medika</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-semibold">AA</div>
                <p className="text-sm font-medium text-gray-900">Admin</p>
              </div>
            </header>
            <div className="flex-1 bg-gray-50 flex items-center justify-center">
              <p className="text-sm text-gray-500">— konten halaman —</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Menu item state" desc="Aktif: bg-blue-600 + text-white. Non-aktif: text-gray-600, hover bg-gray-100.">
        <div className="max-w-xs space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white">
            <LayoutDashboard className="w-4 h-4" /> Aktif
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            <Pill className="w-4 h-4" /> Non-aktif
          </div>
        </div>
      </Section>
    </section>
  )
}
