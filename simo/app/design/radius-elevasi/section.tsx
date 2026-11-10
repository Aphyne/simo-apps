import { PageHeader, Section } from '../_components'
import { RadiusBox } from './radius-box'

function ShadowBox({ label, token, className }: { label: string; token: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className={`w-20 h-14 bg-surface rounded-xl ${className}`} />
      <p className="text-xs font-medium text-fg-secondary">{label}</p>
      <p className="text-[11px] text-fg-muted font-mono">{token}</p>
    </div>
  )
}

export function RadiusElevasiSection() {
  return (
    <section id="radius-elevasi">
      <PageHeader title="Radius & Elevasi" desc="Tiga pola radius dipakai konsisten di seluruh aplikasi: lg untuk kontrol interaktif (tombol, input), xl untuk kartu/panel, full untuk badge pill. Nilai piksel di bawah dibaca dari CSS (turunan --radius di simo/app/globals.css)." />

      <Section title="Radius yang dipakai" meta="rounded-{lg, xl, full}">
        <div className="flex flex-wrap gap-8">
          <RadiusBox label="lg: tombol, input" token="rounded-lg" className="rounded-lg" />
          <RadiusBox label="xl: kartu, panel" token="rounded-xl" className="rounded-xl" />
          <RadiusBox label="full: badge, avatar" token="rounded-full" className="rounded-full" />
        </div>
      </Section>

      <Section title="Skala radius" desc="Semua turunan --radius yang tersedia. Hanya lg, xl, dan full yang menjadi pola; sisanya dipakai komponen shadcn bawaan." meta="rounded-{sm..4xl}">
        <div className="flex flex-wrap gap-8">
          <RadiusBox label="sm" token="rounded-sm" className="rounded-sm" />
          <RadiusBox label="md" token="rounded-md" className="rounded-md" />
          <RadiusBox label="lg" token="rounded-lg" className="rounded-lg" />
          <RadiusBox label="xl" token="rounded-xl" className="rounded-xl" />
          <RadiusBox label="2xl" token="rounded-2xl" className="rounded-2xl" />
          <RadiusBox label="3xl" token="rounded-3xl" className="rounded-3xl" />
          <RadiusBox label="4xl" token="rounded-4xl" className="rounded-4xl" />
        </div>
      </Section>

      <Section title="Elevasi (shadow)" meta="shadow-{sm, md, lg}">
        <div className="flex flex-wrap gap-8 py-2">
          <ShadowBox label="Tanpa shadow: flat" token="border only" className="border border-line" />
          <ShadowBox label="sm: kartu standar" token="shadow-sm" className="shadow-sm border border-line" />
          <ShadowBox label="md: kartu login, dropdown" token="shadow-md" className="shadow-md" />
          <ShadowBox label="lg: overlay" token="shadow-lg" className="shadow-lg" />
        </div>
      </Section>

      <Section title="Kombinasi umum" desc="Pola yang paling sering dipakai untuk kartu/panel di seluruh aplikasi.">
        <code className="block text-xs font-mono bg-surface-subtle border border-line-subtle rounded-lg px-4 py-3 text-fg-secondary break-words">
          rounded-xl border border-line bg-surface p-5 shadow-sm
        </code>
      </Section>
    </section>
  )
}
