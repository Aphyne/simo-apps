// Komponen bantu bersama untuk halaman style guide (/design/*). Prefix _
// supaya Next.js tidak menganggapnya sebagai route.

// Ubah bersamaan dengan bagian Riwayat dokumen di docs/DESIGN.md.
export const VERSI_DESIGN = 'Design System v1.0 · 2026-11-10'
export const PANDUAN_PATH = 'docs/DESIGN.md'

export function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-fg">{title}</h1>
      <p className="text-sm text-fg-muted mt-1 max-w-2xl">{desc}</p>
    </div>
  )
}

export function Section({ title, desc, meta, children }: { title: string; desc?: string; meta?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-base font-bold text-fg">{title}</h2>
          {desc && <p className="text-sm text-fg-muted mt-0.5">{desc}</p>}
        </div>
        {meta && <code className="text-[10px] text-fg-muted bg-surface-muted px-2 py-1 rounded-md flex-shrink-0 whitespace-nowrap">{meta}</code>}
      </div>
      <div className="rounded-xl border border-line bg-surface p-6">
        {children}
      </div>
    </section>
  )
}
