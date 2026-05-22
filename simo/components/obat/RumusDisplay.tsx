import { formatRupiah, formatAngka } from '@/lib/utils'
import type { DetailPerhitungan, LangkahPerhitungan } from '@/types/obat'

// ─── Satu kartu langkah perhitungan ──────────────────────────────────────────
function KartuLangkah({
  nomor,
  judul,
  warna,
  langkah,
  satuan,
  isRupiah,
}: {
  nomor: number
  judul: string
  warna: string
  langkah: LangkahPerhitungan
  satuan?: string
  isRupiah?: boolean
}) {
  const hasilStr =
    langkah.hasil === null
      ? '—'
      : isRupiah
      ? formatRupiah(langkah.hasil)
      : `${formatAngka(langkah.hasil, 2)}${satuan ? ` ${satuan}` : ''}`

  return (
    <div className={`rounded-lg border-l-4 ${warna} bg-white border border-gray-100 p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
          {nomor}
        </span>
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-gray-800">{judul}</p>

          {/* Rumus */}
          <div className="bg-gray-50 rounded px-3 py-1.5 font-mono text-sm text-gray-700">
            {langkah.rumus}
          </div>

          {/* Substitusi */}
          <div className="text-sm text-gray-600">
            <span className="text-xs text-gray-400 uppercase tracking-wide mr-2">Substitusi:</span>
            <span className="font-mono">{langkah.substitusi}</span>
          </div>

          {/* Langkah antara */}
          {langkah.langkah && (
            <div className="text-sm text-gray-600">
              <span className="text-xs text-gray-400 uppercase tracking-wide mr-2">Kalkulasi:</span>
              <span className="font-mono">{langkah.langkah}</span>
            </div>
          )}

          {/* Hasil */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-500">Hasil:</span>
            {langkah.hasil !== null ? (
              <span className="text-lg font-bold text-gray-900">{hasilStr}</span>
            ) : (
              <span className="text-sm text-gray-400 italic">Tidak dapat dihitung</span>
            )}
          </div>

          {/* Catatan khusus */}
          {langkah.catatan && (
            <div className="mt-2 rounded bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              ℹ️ {langkah.catatan}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function RumusDisplay({ data }: { data: DetailPerhitungan }) {
  const { input, langkah_eoq, langkah_safety_stock, langkah_rop, langkah_tc } = data

  return (
    <div className="space-y-6">
      {/* Parameter Input */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-3">Parameter yang Digunakan</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: 'D (Demand Tahunan)', nilai: `${formatAngka(input.D, 0)} unit/tahun` },
            { label: 'd (Demand Harian)', nilai: `${formatAngka(input.demand_harian, 2)} unit/hari` },
            { label: 'σ (Std. Deviasi)', nilai: `${formatAngka(input.sigma, 4)} unit/hari` },
            { label: 'S (Biaya Pesan)', nilai: formatRupiah(input.S) },
            { label: 'H (Biaya Simpan)', nilai: `${formatRupiah(input.H)}/unit/tahun` },
            { label: 'LT (Lead Time)', nilai: `${input.LT} hari` },
            { label: 'Z (Service Level)', nilai: `${input.Z} (${data.obat ? '' : ''}service level)` },
          ].map((p) => (
            <div key={p.label} className="bg-white rounded px-3 py-2 border border-blue-100">
              <p className="text-xs text-gray-400">{p.label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{p.nilai}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Langkah-langkah */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Langkah Perhitungan</h4>

        <KartuLangkah
          nomor={1}
          judul="Economic Order Quantity (EOQ)"
          warna="border-l-blue-500"
          langkah={langkah_eoq}
          satuan="unit per pemesanan"
        />
        <KartuLangkah
          nomor={2}
          judul="Safety Stock (SS) — Stok Pengaman"
          warna="border-l-green-500"
          langkah={langkah_safety_stock}
          satuan="unit stok pengaman"
        />
        <KartuLangkah
          nomor={3}
          judul="Reorder Point (ROP) — Titik Pemesanan Ulang"
          warna="border-l-orange-500"
          langkah={langkah_rop}
          satuan="unit titik pemesanan ulang"
        />
        <KartuLangkah
          nomor={4}
          judul="Total Cost (TC) — Total Biaya Persediaan"
          warna="border-l-purple-500"
          langkah={langkah_tc}
          isRupiah
        />
      </div>

      {/* Ringkasan Hasil */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan Hasil Kalkulasi</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'EOQ', nilai: langkah_eoq.hasil, satuan: 'unit', warna: 'text-blue-700' },
            { label: 'Safety Stock', nilai: langkah_safety_stock.hasil, satuan: 'unit', warna: 'text-green-700' },
            { label: 'ROP', nilai: langkah_rop.hasil, satuan: 'unit', warna: 'text-orange-600' },
            { label: 'Total Cost', nilai: langkah_tc.hasil, isRupiah: true, warna: 'text-purple-700' },
          ].map((r) => (
            <div key={r.label} className="bg-white rounded-lg border p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">{r.label}</p>
              {r.nilai !== null && r.nilai !== undefined ? (
                <p className={`text-xl font-bold ${r.warna}`}>
                  {r.isRupiah ? formatRupiah(r.nilai) : formatAngka(r.nilai, 2)}
                </p>
              ) : (
                <p className="text-sm text-gray-300 italic">—</p>
              )}
              {r.satuan && r.nilai !== null && (
                <p className="text-xs text-gray-400 mt-0.5">{r.satuan}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
