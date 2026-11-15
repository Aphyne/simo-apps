// Layout untuk halaman style guide SIMO (/design). Satu halaman scroll,
// navigasi samping hanya hash-anchor ke section (/design#motion), bukan route terpisah.

import Image from 'next/image'
import SuperadminOnly from '@/components/layout/SuperadminOnly'

interface NavGroup {
  label: string
  items: { label: string; href: string }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Dasar',
    items: [
      { label: 'Warna', href: '#warna' },
      { label: 'Tipografi', href: '#tipografi' },
      { label: 'Bentuk', href: '#radius-elevasi' },
      { label: 'Motion', href: '#motion' },
      { label: 'Ikon', href: '#ikon' },
    ],
  },
  {
    label: 'Komponen',
    items: [
      { label: 'Tombol', href: '#button' },
      { label: 'Form', href: '#form' },
      { label: 'Menu', href: '#dropdown-menu' },
      { label: 'Umpan balik', href: '#feedback' },
      { label: 'Overlay', href: '#overlay' },
      { label: 'Navigasi', href: '#navigasi' },
    ],
  },
  {
    label: 'Data',
    items: [
      { label: 'Tabel', href: '#tabel' },
      { label: 'Pola halaman', href: '#halaman' },
      { label: 'Chart', href: '#chart' },
    ],
  },
  {
    label: 'Proyek',
    items: [{ label: 'Progres penataan', href: '#progres' }],
  },
]

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperadminOnly>
      <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
        <aside className="flex w-full shrink-0 flex-col bg-background md:sticky md:top-0 md:h-screen md:w-60 md:overflow-y-auto">
          <a
            href="#top"
            className="flex h-16 shrink-0 items-center gap-2.5 px-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <Image src="/logo.png" alt="" width={30} height={30} className="shrink-0" />
            <span className="text-lg font-bold tracking-tight">SIMO Design</span>
          </a>

          <nav aria-label="Daftar bagian" className="flex flex-1 flex-wrap gap-x-8 gap-y-4 px-4 py-2 md:block md:space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">{group.label}</p>
                <div className="flex flex-wrap gap-1 md:block md:space-y-0.5">
                  {group.items.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex min-h-11 items-center rounded-xl px-3 text-sm text-foreground/75 outline-none transition-colors hover:bg-card/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <p className="shrink-0 px-6 py-4 text-xs text-muted-foreground">Referensi internal, khusus superadmin</p>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-12">
          <div id="top" className="mx-auto max-w-4xl scroll-mt-10">
            {children}
          </div>
        </main>
      </div>
    </SuperadminOnly>
  )
}
