// Komponen bantu bersama untuk halaman style guide (/design). Prefix _
// supaya Next.js tidak menganggapnya sebagai route.

import { Card } from '@/components/ui/card'

// Ubah bersamaan dengan Riwayat dokumen bila panduan tertulis diperbarui.
export const VERSI_DESIGN = 'Design System v2.0, 13 November 2026'
export const PANDUAN_PATH = 'docs/DESIGN.md'

// Judul satu section: ditulis sebagai h2 supaya urutan judul halaman benar.
export function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <header className="mb-6 max-w-2xl">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </header>
  )
}

// Satu blok contoh: judul kecil, keterangan opsional, lalu isi dalam satu panel.
// Nama token atau berkas (meta) ditulis monospace karena memang kode.
// flush: isi menempel ke tepi panel (tabel). bare: tanpa panel sama sekali, untuk isi
// yang sudah berupa panel sendiri supaya tidak ada kartu di dalam kartu.
export function Section({
  title, desc, meta, flush, bare, children,
}: { title: string; desc?: string; meta?: string; flush?: boolean; bare?: boolean; children: React.ReactNode }) {
  return (
    <section className="mb-8 last:mb-0">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {desc && <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{desc}</p>}
        </div>
        {meta && <code className="shrink-0 font-mono text-xs text-muted-foreground">{meta}</code>}
      </div>
      {bare ? children : <Card className={flush ? 'gap-0 overflow-hidden rounded-2xl py-0 ring-0' : 'gap-0 rounded-2xl p-5 ring-0'}>{children}</Card>}
    </section>
  )
}
