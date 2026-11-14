import { ChevronDown, RefreshCw } from 'lucide-react'
import { PageHeader, Section } from '../_components'

function Baris({ pola, fungsi, children }: { pola: string; fungsi: string; children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-center gap-x-6 gap-y-2 border-b py-4 first:pt-0 last:border-0 last:pb-0 sm:grid-cols-[200px_1fr_160px]">
      <code className="break-words font-mono text-xs text-foreground">{pola}</code>
      <p className="text-sm text-muted-foreground">{fungsi}</p>
      <div>{children}</div>
    </div>
  )
}

export function MotionSection() {
  return (
    <section id="motion">
      <PageHeader
        title="Motion"
        desc="Gerak hanya untuk menunjukkan keadaan: hover dan fokus, memuat, membuka dan menutup. Tidak ada animasi dekoratif dan tidak ada animasi saat halaman dibuka. Semua gerak berhenti bila sistem meminta gerak dikurangi."
      />

      <Section title="Pola yang dipakai" meta="transition-* · motion-safe:animate-*">
        <Baris pola="transition-colors" fungsi="Hover dan fokus tombol, baris tabel, item menu. Pola paling dominan.">
          <button className="rounded-md border border-input px-3 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring">
            Arahkan kursor
          </button>
        </Baris>
        <Baris pola="motion-safe:animate-pulse" fungsi="Kerangka pemuatan, bentuknya sama dengan isi yang akan datang.">
          <div className="space-y-2" aria-hidden="true">
            <div className="h-3 w-full rounded bg-muted motion-safe:animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted motion-safe:animate-pulse" />
          </div>
        </Baris>
        <Baris pola="motion-safe:animate-spin" fungsi="Penanda proses berjalan (hitung ulang, coba lagi).">
          <RefreshCw className="size-4 text-muted-foreground motion-safe:animate-spin" aria-hidden="true" />
        </Baris>
        <Baris pola="transition-transform" fungsi="Putaran ikon chevron saat bagian dibuka atau ditutup.">
          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Buka dan tutup
              <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">Isi bagian.</p>
          </details>
        </Baris>
        <Baris pola="animate-in, animate-out" fungsi="Hanya dropdown, dialog, popover, dan select shadcn (tw-animate-css). Tidak dipakai di komponen fitur." />
      </Section>

      <Section title="Durasi" desc="Bawaan Tailwind: 150 ms dengan kurva standar. Satu durasi untuk semua transisi mikro, tidak ada easing khusus.">
        <code className="block rounded-md border bg-muted px-4 py-3 font-mono text-xs text-foreground">transition-colors (150ms, cubic-bezier(0.4, 0, 0.2, 1))</code>
      </Section>
    </section>
  )
}
