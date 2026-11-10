// Layout untuk halaman style guide SIMO (/design). Satu halaman scroll,
// sidebar navigasi cuma hash-anchor ke section — mengikuti pola referensi
// "Akuris Design System" (lihat docs/design-reference/) yang pakai URL
// semacam /design#motion, bukan route terpisah per section.

import Image from 'next/image'
import SuperadminOnly from '@/components/layout/SuperadminOnly'

interface NavGroup {
  label: string
  items: { label: string; href: string }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Foundations',
    items: [
      { label: 'Warna', href: '#warna' },
      { label: 'Tipografi', href: '#tipografi' },
      { label: 'Radius & Elevasi', href: '#radius-elevasi' },
      { label: 'Motion', href: '#motion' },
      { label: 'Ikon', href: '#ikon' },
    ],
  },
  {
    label: 'Komponen',
    items: [
      { label: 'Button', href: '#button' },
      { label: 'Form', href: '#form' },
      { label: 'Dropdown & Menu', href: '#dropdown-menu' },
      { label: 'Feedback', href: '#feedback' },
      { label: 'Overlay', href: '#overlay' },
      { label: 'Navigasi', href: '#navigasi' },
    ],
  },
  {
    label: 'Data',
    items: [
      { label: 'Tabel', href: '#tabel' },
      { label: 'Chart', href: '#chart' },
    ],
  },
  {
    label: 'Workspace',
    items: [{ label: 'Progres penataan', href: '#progres' }],
  },
]

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperadminOnly>
    <div className="min-h-screen bg-surface-subtle flex flex-col md:flex-row">
      <aside className="md:sticky md:top-0 md:h-screen w-full md:w-60 bg-surface border-b md:border-b-0 md:border-r border-line flex flex-col flex-shrink-0 md:overflow-y-auto">
        <a href="#top" className="px-5 h-14 flex items-center gap-2 border-b border-line flex-shrink-0">
          <Image src="/logo.png" alt="" width={28} height={28} className="flex-shrink-0" />
          <span className="text-sm font-bold text-fg tracking-tight">SIMO Design System</span>
        </a>

        <nav className="flex-1 px-3 py-3 md:py-4 flex flex-wrap gap-x-6 gap-y-3 md:block md:space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1.5 text-[11px] font-semibold text-fg-muted uppercase tracking-wide">{group.label}</p>
              <div className="flex flex-wrap gap-1 md:block md:space-y-0.5">
                {group.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-2 py-1.5 rounded-lg text-sm text-fg-tertiary hover:bg-surface-muted hover:text-fg transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-line flex-shrink-0">
          <p className="text-[10px] text-fg-muted">Referensi internal — khusus superadmin</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10">
        <div id="top" className="max-w-4xl mx-auto scroll-mt-10">{children}</div>
      </main>
    </div>
    </SuperadminOnly>
  )
}
