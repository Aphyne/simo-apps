// Layout untuk halaman style guide SIMO (/design). Satu halaman scroll,
// sidebar navigasi cuma hash-anchor ke section — mengikuti pola referensi
// "Akuris Design System" (lihat docs/design-reference/) yang pakai URL
// semacam /design#motion, bukan route terpisah per section.

import Image from 'next/image'

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
]

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="sticky top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
        <a href="#top" className="px-5 h-14 flex items-center gap-2 border-b border-gray-200 flex-shrink-0">
          <Image src="/logo.png" alt="" width={28} height={28} className="flex-shrink-0" />
          <span className="text-sm font-bold text-gray-900 tracking-tight">SIMO Design System</span>
        </a>

        <nav className="flex-1 px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-gray-200 flex-shrink-0">
          <p className="text-[10px] text-gray-500">Referensi internal — tidak butuh login</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-8 py-10">
        <div id="top" className="max-w-4xl mx-auto scroll-mt-10">{children}</div>
      </main>
    </div>
  )
}
