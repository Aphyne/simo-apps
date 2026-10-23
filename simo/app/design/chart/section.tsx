import { AlertTriangle, Pill, ShoppingCart, ArrowLeftRight, CalendarX } from 'lucide-react'
import { PageHeader, Section } from '../_components'

export function ChartSection() {
  return (
    <section id="chart">
      <PageHeader title="Chart" desc="Library: Recharts. Biru (#2563eb) sebagai warna data utama, abu-abu untuk pembanding/baseline." />

      <Section title="Stat Card" meta="StatCard.tsx">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl bg-blue-600 p-5 shadow-md flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-blue-100 font-medium truncate">Featured</p>
              <p className="text-2xl font-bold leading-tight text-white">1</p>
              <p className="text-xs text-blue-200 mt-0.5">stok ≤ ROP</p>
            </div>
          </div>
          {[
            { bg: 'bg-blue-100', color: 'text-blue-600', label: 'Blue', Icon: Pill },
            { bg: 'bg-emerald-100', color: 'text-emerald-600', label: 'Green', Icon: ShoppingCart },
            { bg: 'bg-purple-100', color: 'text-purple-600', label: 'Purple', Icon: ArrowLeftRight },
            { bg: 'bg-orange-100', color: 'text-orange-500', label: 'Orange', Icon: CalendarX },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                <c.Icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium truncate">{c.label} variant</p>
                <p className="text-2xl font-bold leading-tight text-gray-900">12</p>
                <p className="text-xs text-gray-500 mt-0.5">sublabel</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Line — Tren Permintaan" meta="TrenPermintaanChart.tsx">
        <svg viewBox="0 0 640 180" width="100%" height="180" role="img" aria-label="Contoh grafik garis tren naik lalu turun">
          <line x1="40" y1="10" x2="40" y2="150" stroke="#f0f0f0" strokeWidth="1" />
          <line x1="40" y1="150" x2="620" y2="150" stroke="#f0f0f0" strokeWidth="1" />
          <polyline points="60,110 180,45 300,55 420,140 540,148 600,148" fill="none" stroke="#2563eb" strokeWidth="2.5" />
          <circle cx="180" cy="45" r="4" fill="#2563eb" />
          <circle cx="420" cy="140" r="4" fill="#2563eb" />
        </svg>
      </Section>

      <Section title="Bar — Perbandingan Biaya" meta="PerbandinganBiayaChart.tsx">
        <svg viewBox="0 0 640 180" width="100%" height="180" role="img" aria-label="Contoh grafik batang berpasangan, abu-abu dan biru">
          <line x1="40" y1="150" x2="620" y2="150" stroke="#f0f0f0" strokeWidth="1" />
          {[{ x: 80, g: 90, b: 50 }, { x: 250, g: 70, b: 40 }, { x: 420, g: 110, b: 65 }].map((d, i) => (
            <g key={i}>
              <rect x={d.x} y={150 - d.g} width="24" height={d.g} rx="4" fill="#d1d5db" />
              <rect x={d.x + 30} y={150 - d.b} width="24" height={d.b} rx="4" fill="#2563eb" />
            </g>
          ))}
        </svg>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" />Tanpa EOQ</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" />Dengan EOQ</span>
        </div>
      </Section>

      <Section title="Donut — Distribusi Kategori" meta="ObatKategoriChart.tsx">
        <div className="flex items-center gap-6">
          <svg viewBox="0 0 100 100" width="110" height="110" role="img" aria-label="Contoh grafik donat distribusi kategori obat">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#2563eb" strokeWidth="16" strokeDasharray="95 240" strokeDashoffset="0" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray="60 240" strokeDashoffset="-95" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#f97316" strokeWidth="16" strokeDasharray="85 240" strokeDashoffset="-155" />
          </svg>
          <ol className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Analgesik</li>
            <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Antibiotik</li>
            <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" />Vitamin</li>
          </ol>
        </div>
      </Section>

      <Section title="Rumus Display — Kalkulasi EOQ/ROP" meta="RumusDisplay.tsx">
        <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-500 bg-white p-4 max-w-xl">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">1</span>
            <div className="flex-1 space-y-2 min-w-0">
              <p className="font-semibold text-gray-800 text-sm">Economic Order Quantity (EOQ)</p>
              <div className="bg-gray-50 rounded-lg px-3 py-1.5 font-mono text-sm text-gray-700 border border-gray-100">
                EOQ = √(2 × D × S / H)
              </div>
              <div className="text-sm text-gray-600">
                <span className="text-xs text-gray-500 uppercase tracking-wide mr-2">Substitusi:</span>
                <span className="font-mono">EOQ = √(2 × 1.200 × 50.000 / 250)</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-500">Hasil:</span>
                <span className="text-sm font-bold text-blue-700">693 unit</span>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </section>
  )
}
