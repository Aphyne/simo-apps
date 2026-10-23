import { PageHeader, Section } from '../_components'

function Row({ name, token, className, sample }: { name: string; token: string; className: string; sample: string }) {
  return (
    <div className="grid grid-cols-[1fr_2fr] gap-6 py-4 border-b border-gray-100 last:border-0 items-center">
      <div>
        <p className="text-sm font-medium text-gray-700">{name}</p>
        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{token}</p>
      </div>
      <p className={className}>{sample}</p>
    </div>
  )
}

export function TipografiSection() {
  return (
    <section id="tipografi">
      <PageHeader title="Tipografi" desc="Inter untuk seluruh teks (next/font/google, var(--font-inter)). Dipilih setelah riset tipografi untuk kesehatan/farmasi — bagus untuk angka tabular dan keterbacaan ukuran kecil." />

      <Section title="Skala" meta="font-sans · text-{size}">
        <Row name="Judul Halaman" token="text-2xl font-bold" className="text-2xl font-bold text-gray-900" sample="SIMO Design System" />
        <Row name="Judul Section" token="text-lg font-bold" className="text-lg font-bold text-gray-900" sample="Warna & Tipografi" />
        <Row name="Judul Card" token="text-sm font-semibold" className="text-sm font-semibold text-gray-700" sample="Stok Menipis" />
        <Row name="Body" token="text-sm" className="text-sm text-gray-700" sample="Teks paragraf standar untuk isi halaman dan deskripsi." />
        <Row name="Data / Caption" token="text-xs text-gray-500" className="text-xs text-gray-500" sample="Dicatat oleh Admin · 16/12/2026" />
        <Row name="Kode / Mono" token="font-mono text-xs" className="font-mono text-xs text-gray-500" sample="OBT-011" />
        <Row name="Angka Besar" token="text-2xl font-bold tabular-nums" className="text-2xl font-bold text-gray-900 tabular-nums" sample="693 unit" />
        <Row name="Uppercase Label" token="text-xs uppercase tracking-wide" className="text-xs font-semibold text-gray-500 uppercase tracking-wide" sample="Status Stok" />
      </Section>

      <Section title="Angka (tabular-nums)" desc="Dipakai di kolom tabel dan sumbu chart supaya digit sejajar.">
        <div className="flex gap-8">
          <div>
            <p className="text-[11px] text-gray-400 mb-1">Tanpa tabular-nums</p>
            <p className="text-xl font-bold text-gray-900">Rp1.250.000</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 mb-1">tabular-nums</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums">Rp1.250.000</p>
          </div>
        </div>
      </Section>
    </section>
  )
}
