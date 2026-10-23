import { PageHeader, Section, Swatch } from '../_components'

export function WarnaSection() {
  return (
    <section id="warna">
      <PageHeader title="Warna" desc="Blue 600 sebagai accent utama (dipakai di logo, tombol primer, header laporan PDF). Warna semantik dipakai konsisten untuk status stok dan keterangan transaksi — tidak pernah dipakai sebagai warna dekoratif." />

      <Section title="Accent & Netral" meta="bg-{color}-{shade}">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <Swatch name="Blue 600 (primer)" className="bg-blue-600" hex="#2563eb" />
          <Swatch name="Gray 900 (teks utama)" className="bg-gray-900" hex="#111827" />
          <Swatch name="Gray 700 (judul section)" className="bg-gray-700" hex="#374151" />
          <Swatch name="Gray 500 (teks data/caption)" className="bg-gray-500" hex="#6b7280" />
          <Swatch name="Gray 200 (border)" className="bg-gray-200" hex="#e5e7eb" />
          <Swatch name="Gray 50 (bg halaman)" className="bg-gray-50 border border-gray-200" hex="#f9fafb" />
        </div>
      </Section>

      <Section title="Semantik — Status Stok" desc="AMAN / MENDEKATI_ROP / HARUS_REORDER — selalu disertai label teks, tidak pernah hanya warna.">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Swatch name="Emerald 700 — Aman" token="text-emerald-700 / bg-green-100" className="bg-emerald-700" hex="#047857" />
          <Swatch name="Orange 700 — Mendekati ROP" token="text-orange-700 / bg-orange-100" className="bg-orange-700" hex="#c2410c" />
          <Swatch name="Red 600 — Harus Reorder" token="text-red-600 / bg-red-100" className="bg-red-600" hex="#dc2626" />
        </div>
      </Section>

      <Section title="Semantik — Keterangan Transaksi &amp; Role">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Swatch name="Blue — Penjualan / Admin" className="bg-blue-600" hex="#2563eb" />
          <Swatch name="Purple — Retur" className="bg-purple-600" hex="#9333ea" />
          <Swatch name="Orange — Rusak" className="bg-orange-600" hex="#ea580c" />
          <Swatch name="Red — Kedaluarsa" className="bg-red-500" hex="#ef4444" />
          <Swatch name="Gray — Lainnya / Staf" className="bg-gray-500" hex="#6b7280" />
        </div>
      </Section>

      <Section title="Kartu Rumus (border-l accent)" desc="RumusDisplay.tsx — tiap kartu langkah kalkulasi EOQ/SS/ROP/TC punya warna border-l berbeda.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Swatch name="EOQ" token="border-l-blue-500" className="bg-blue-500" hex="#3b82f6" />
          <Swatch name="Safety Stock" token="border-l-emerald-500" className="bg-emerald-500" hex="#10b981" />
          <Swatch name="ROP" token="border-l-orange-500" className="bg-orange-500" hex="#f97316" />
          <Swatch name="Total Cost" token="border-l-purple-500" className="bg-purple-500" hex="#a855f7" />
        </div>
      </Section>
    </section>
  )
}
