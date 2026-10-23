import { PageHeader, Section } from '../_components'

function RadiusBox({ label, token, className }: { label: string; token: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-16 h-16 bg-blue-100 border-2 border-blue-300 ${className}`} />
      <p className="text-xs font-medium text-gray-700">{label}</p>
      <p className="text-[11px] text-gray-400 font-mono">{token}</p>
    </div>
  )
}

function ShadowBox({ label, token, className }: { label: string; token: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-20 h-14 bg-white rounded-xl ${className}`} />
      <p className="text-xs font-medium text-gray-700">{label}</p>
      <p className="text-[11px] text-gray-400 font-mono">{token}</p>
    </div>
  )
}

export function RadiusElevasiSection() {
  return (
    <section id="radius-elevasi">
      <PageHeader title="Radius & Elevasi" desc="Dua ukuran radius yang dipakai konsisten di seluruh aplikasi: lg untuk kontrol interaktif (tombol, input, badge pill), xl untuk card/panel." />

      <Section title="Radius" meta="rounded-{lg, xl, full}">
        <div className="flex flex-wrap gap-8">
          <RadiusBox label="lg — tombol, input" token="rounded-lg (8px)" className="rounded-lg" />
          <RadiusBox label="xl — card, panel" token="rounded-xl (12px)" className="rounded-xl" />
          <RadiusBox label="full — badge, avatar" token="rounded-full" className="rounded-full" />
        </div>
      </Section>

      <Section title="Elevasi (shadow)" meta="shadow-{sm, md}">
        <div className="flex flex-wrap gap-8 py-2">
          <ShadowBox label="Tanpa shadow — flat" token="border only" className="border border-gray-200" />
          <ShadowBox label="sm — card standar" token="shadow-sm" className="shadow-sm border border-gray-200" />
          <ShadowBox label="md — featured / modal" token="shadow-md" className="shadow-md" />
        </div>
      </Section>

      <Section title="Kombinasi umum" desc="Pola yang paling sering dipakai untuk card/panel di seluruh aplikasi.">
        <code className="block text-xs font-mono bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-gray-700">
          rounded-xl border border-gray-200 bg-white p-5 shadow-sm
        </code>
      </Section>
    </section>
  )
}
