import { ChevronDown, RefreshCw } from 'lucide-react'
import { PageHeader, Section } from '../_components'

function Baris({ pola, fungsi, children }: { pola: string; fungsi: string; children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr_170px] gap-x-6 gap-y-2 py-4 border-b border-line-subtle last:border-0 items-center">
      <code className="text-xs font-mono text-fg-secondary break-words">{pola}</code>
      <p className="text-sm text-fg-tertiary">{fungsi}</p>
      <div>{children}</div>
    </div>
  )
}

export function MotionSection() {
  return (
    <section id="motion">
      <PageHeader title="Motion" desc="Motion di SIMO terbatas dan fungsional: umpan balik hover/fokus, penanda memuat, dan animasi bawaan shadcn untuk dropdown dan dialog. Tidak ada animasi dekoratif, tidak ada @keyframes khusus, dan tidak ada pustaka animasi." />

      <Section title="Pola yang dipakai" meta="transition-* · animate-*">
        <Baris pola="transition-colors" fungsi="Hover dan fokus tombol, baris tabel, item nav. Pola paling dominan.">
          <button className="border border-line-strong text-fg-secondary hover:bg-surface-subtle hover:border-brand-500 rounded-lg px-3 py-1.5 text-xs transition-colors">Arahkan kursor</button>
        </Baris>
        <Baris pola="animate-pulse" fungsi="Skeleton saat data dimuat (daftar, tabel, kartu).">
          <div className="space-y-2">
            <div className="h-3 w-full bg-surface-muted animate-pulse rounded-lg" />
            <div className="h-3 w-2/3 bg-surface-muted animate-pulse rounded-lg" />
          </div>
        </Baris>
        <Baris pola="animate-spin" fungsi="Spinner dan ikon penyegar saat proses berjalan (hitung ulang, coba lagi, memuat).">
          <div className="flex items-center gap-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <RefreshCw className="w-4 h-4 text-fg-secondary animate-spin" aria-hidden="true" />
          </div>
        </Baris>
        <Baris pola="transition-transform" fungsi="Putaran ikon chevron saat bagian dibuka atau ditutup.">
          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs text-fg-secondary">
              Buka/tutup
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-2 text-xs text-fg-muted">Isi bagian.</p>
          </details>
        </Baris>
        <Baris pola="transition-opacity" fungsi="Latar gelap drawer Sidebar di layar kecil." />
        <Baris pola="animate-in / animate-out, fade-in-0, zoom-in-95, slide-in-from-*" fungsi="Hanya dropdown, dialog, popover, dan select shadcn (tw-animate-css). Tidak dipakai di komponen fitur." />
      </Section>

      <Section title="Durasi dan easing" desc="Memakai bawaan Tailwind kecuali dicatat di bawah.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-line-subtle bg-surface-subtle p-4">
            <p className="text-xs font-semibold text-fg-secondary">Bawaan transisi</p>
            <p className="mt-1 text-sm text-fg-tertiary">150ms, kurva <span className="font-mono text-xs">cubic-bezier(0.4, 0, 0.2, 1)</span> (nilai bawaan tema Tailwind).</p>
          </div>
          <div className="rounded-lg border border-line-subtle bg-surface-subtle p-4">
            <p className="text-xs font-semibold text-fg-secondary">Durasi eksplisit</p>
            <p className="mt-1 text-sm text-fg-tertiary"><span className="font-mono text-xs">duration-100</span> untuk latar dialog, <span className="font-mono text-xs">duration-150</span> untuk hover grafik donat.</p>
          </div>
          <div className="rounded-lg border border-line-subtle bg-surface-subtle p-4">
            <p className="text-xs font-semibold text-fg-secondary">Easing khusus</p>
            <p className="mt-1 text-sm text-fg-tertiary">Tidak ada. Kelas <span className="font-mono text-xs">ease-*</span> tidak dipakai.</p>
          </div>
        </div>
      </Section>

      <Section title="Catatan jujur: prefers-reduced-motion parsial" desc="Temuan aksesibilitas yang belum diperbaiki (docs/DESIGN.md bagian 5, butir 7).">
        <div className="rounded-lg bg-warning-50 border border-warning-200 p-4">
          <p className="text-sm text-warning-700">
            Hanya grafik donat kategori obat (<span className="font-mono text-xs">ObatKategoriChart</span>) yang menghormati preferensi pengguna lewat kelas <span className="font-mono text-xs">motion-reduce</span>. Kelas <span className="font-mono text-xs">animate-pulse</span>, <span className="font-mono text-xs">animate-spin</span>, dan transisi lain tetap berjalan walau sistem operasi meminta gerak dikurangi. Perbaikannya menyentuh banyak berkas dan menjadi usulan terpisah.
          </p>
        </div>
      </Section>
    </section>
  )
}
