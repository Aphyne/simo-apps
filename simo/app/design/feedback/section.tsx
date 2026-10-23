import { PageHeader, Section } from '../_components'

export function FeedbackSection() {
  return (
    <section id="feedback">
      <PageHeader title="Feedback" desc="Badge untuk status singkat, alert untuk peringatan inline, toast untuk notifikasi reorder, progress untuk proses berjalan." />

      <Section title="Badge — Status Stok" meta="StatusBadge.tsx">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Aman</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">Mendekati ROP</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Harus Reorder</span>
        </div>
      </Section>

      <Section title="Badge — Keterangan Transaksi &amp; Role">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Penjualan</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Retur</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">Rusak</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-600">Kedaluarsa</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">Lainnya</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Admin</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">Staf</span>
        </div>
      </Section>

      <Section title="Alert inline">
        <div className="max-w-sm rounded-lg bg-orange-50 border border-orange-200 p-3">
          <p className="text-xs font-semibold text-orange-700">2 obat akan expired dalam 90 hari</p>
          <p className="text-xs text-orange-700 mt-1">Lihat di Monitoring →</p>
        </div>
      </Section>

      <Section title="Reorder Alert (bell dropdown)" meta="AlertNotification.tsx">
        <div className="w-72 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Reorder Alert</p>
            <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">1</span>
          </div>
          <div className="p-2">
            <div className="rounded-xl border border-gray-100 bg-white p-3 space-y-1.5 shadow-sm">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />STOK HABIS
              </span>
              <p className="text-sm font-semibold text-gray-900">Obh Combi Anak</p>
              <p className="text-xs text-gray-500">Stok sisa <span className="font-semibold text-red-600">2</span> botol · ROP 9</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Progress bar">
        <div className="max-w-xs space-y-3">
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: '65%' }} />
          </div>
          <p className="text-xs text-gray-500">Menghitung ulang 13 / 20 obat...</p>
        </div>
      </Section>

      <Section title="Empty state" desc="Pola konsisten di semua tabel/daftar saat data kosong.">
        <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
          <p className="text-sm">Belum ada barang keluar hari ini</p>
        </div>
      </Section>
    </section>
  )
}
