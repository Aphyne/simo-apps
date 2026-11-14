import { Pill, ShoppingCart } from 'lucide-react'
import { StatTile, ReorderTile } from '@/components/dashboard/StatTile'
import TrenPermintaanChart from '@/components/dashboard/TrenPermintaanChart'
import { PageHeader, Section } from '../_components'

// Data contoh bentuk sama dengan respons API tren permintaan.
const CONTOH_TREN = [
  { bulan: '2026-05-01', total: '310' },
  { bulan: '2026-06-01', total: '420' },
  { bulan: '2026-07-01', total: '390' },
  { bulan: '2026-08-01', total: '510' },
  { bulan: '2026-09-01', total: '470' },
  { bulan: '2026-10-01', total: '560' },
]

export function ChartSection() {
  return (
    <section id="chart">
      <PageHeader
        title="Chart"
        desc="Recharts dengan warna dari token (var(--chart-1) dan seterusnya), tanpa hex di kode. Satu warna biru untuk data utama, slate untuk pembanding. Isian di bawah garis datar dan transparan, tanpa gradasi. Hanya garis bantu horizontal."
      />

      <Section title="Ubin angka" desc="Satu ubin biru pekat untuk hal yang paling perlu dikerjakan, sisanya putih datar. Tanpa kotak ikon dan tanpa warna latar per angka." meta="StatTile.tsx" bare>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ReorderTile value={3} total={20} action={null} />
          <StatTile label="Total obat" value={20} sublabel="jenis terdaftar" icon={Pill} />
          <StatTile label="Penjualan hari ini" value={48} sublabel="unit terjual" icon={ShoppingCart} />
        </div>
      </Section>

      <Section title="Garis: tren permintaan" desc="Data contoh." meta="TrenPermintaanChart.tsx">
        <TrenPermintaanChart data={CONTOH_TREN} />
      </Section>

      <Section title="Batang: perbandingan" desc="Pembanding memakai chart-2 (slate), data utama chart-1 (biru). Legenda selalu ditulis.">
        <svg viewBox="0 0 640 180" width="100%" height="180" role="img" aria-label="Contoh grafik batang berpasangan, slate dan biru">
          <line x1="40" y1="150" x2="620" y2="150" stroke="var(--border)" strokeWidth="1" />
          {[{ x: 80, g: 90, b: 50 }, { x: 250, g: 70, b: 40 }, { x: 420, g: 110, b: 65 }].map((d, i) => (
            <g key={i}>
              <rect x={d.x} y={150 - d.g} width="24" height={d.g} rx="3" fill="var(--chart-2)" />
              <rect x={d.x + 30} y={150 - d.b} width="24" height={d.b} rx="3" fill="var(--chart-1)" />
            </g>
          ))}
        </svg>
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-chart-2" />Tanpa EOQ</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-chart-1" />Dengan EOQ</span>
        </div>
      </Section>

      <Section title="Donat: distribusi kategori" desc="Hanya dua sampai tiga bagian. Selalu disertai daftar tertulis.">
        <div className="flex flex-wrap items-center gap-8">
          <svg viewBox="0 0 100 100" width="112" height="112" role="img" aria-label="Contoh donat distribusi kategori obat">
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--chart-1)" strokeWidth="14" strokeDasharray="105 240" strokeDashoffset="0" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--chart-2)" strokeWidth="14" strokeDasharray="70 240" strokeDashoffset="-105" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--chart-3)" strokeWidth="14" strokeDasharray="60 240" strokeDashoffset="-175" />
          </svg>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-chart-1" />Analgesik</li>
            <li className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-chart-2" />Antibiotik</li>
            <li className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-chart-3" />Vitamin</li>
          </ul>
        </div>
      </Section>
    </section>
  )
}
