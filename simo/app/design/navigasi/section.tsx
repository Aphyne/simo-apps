import Image from 'next/image'
import { LayoutDashboard, Pill, PackagePlus, PackageMinus, FileText } from 'lucide-react'
import { PageHeader, Section } from '../_components'

const MENU = [
  { label: 'Dashboard', Icon: LayoutDashboard },
  { label: 'Data Obat', Icon: Pill },
  { label: 'Stok Masuk', Icon: PackagePlus },
  { label: 'Stok Keluar', Icon: PackageMinus },
  { label: 'Laporan', Icon: FileText },
]

export function NavigasiSection() {
  return (
    <section id="navigasi">
      <PageHeader
        title="Navigasi"
        desc="Sidebar dan header menyatu dengan kanvas: tanpa garis pemisah dan tanpa blok biru. Item aktif berupa pil putih dengan teks tebal dan ikon biru, jadi biru tetap dicadangkan untuk aksi. Setiap item berikon dan bertulisan, tingginya 44px."
      />

      <Section title="Sidebar dan header" desc="Gambaran sidebar aplikasi yang sebenarnya." meta="Sidebar.tsx, Header.tsx">
        <div className="flex h-96 overflow-hidden rounded-xl bg-background">
          <aside className="flex w-52 shrink-0 flex-col">
            <div className="flex h-16 items-center gap-2 px-6">
              <Image src="/logo.png" alt="" width={40} height={40} className="-ml-1.5 shrink-0" />
              <span className="text-lg font-bold tracking-tight">SIMO</span>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Contoh menu">
              {MENU.map(({ label, Icon }, i) => (
                <div
                  key={label}
                  aria-current={i === 0 ? 'page' : undefined}
                  className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm ${
                    i === 0 ? 'bg-card font-semibold text-foreground' : 'text-foreground/70'
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${i === 0 ? 'text-primary' : ''}`} aria-hidden="true" />
                  {label}
                </div>
              ))}
            </nav>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between px-4">
              <p className="text-sm font-medium text-foreground">Apotek Rezky Medika</p>
              <div className="flex items-center gap-2 rounded-full bg-card p-0.5 pr-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">AA</div>
                <p className="text-sm font-medium text-foreground">Admin</p>
              </div>
            </header>
            <div className="mx-2 mb-2 flex flex-1 items-center justify-center rounded-2xl bg-card">
              <p className="text-sm text-muted-foreground">Isi halaman</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Keadaan item menu" meta="bg-card, text-primary">
        <div className="max-w-xs space-y-1 rounded-xl bg-background p-3">
          <div aria-current="page" className="flex h-11 items-center gap-3 rounded-xl bg-card px-3 text-sm font-semibold text-foreground">
            <LayoutDashboard className="size-4 text-primary" aria-hidden="true" /> Aktif
          </div>
          <div className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-foreground/70 transition-colors hover:bg-card/60 hover:text-foreground">
            <Pill className="size-4" aria-hidden="true" /> Tidak aktif, arahkan kursor
          </div>
        </div>
      </Section>
    </section>
  )
}
