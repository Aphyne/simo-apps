import { Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Section } from '../_components'

export function ButtonSection() {
  return (
    <section id="button">
      <PageHeader title="Button" desc="Rounded-lg, tanpa pill. Primer biru untuk aksi utama, outline untuk sekunder, merah untuk destruktif. Warna tinted (bg-{color}-50) untuk Aksi Cepat di dashboard." />

      <Section title="Varian" meta="bg-{color}-600 hover:bg-{color}-700">
        <div className="flex flex-wrap gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors">
            Simpan
          </button>
          <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm transition-colors">
            Batal
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors">
            Hapus
          </button>
          <button disabled className="bg-blue-600 text-white font-medium rounded-lg px-4 py-2 text-sm opacity-60 cursor-not-allowed">
            Menyimpan...
          </button>
        </div>
      </Section>

      <Section title="Aksi Cepat (tinted, full width)" desc="Dashboard — tombol besar dengan background pastel dan ikon di kiri.">
        <div className="flex flex-col gap-2 max-w-xs">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors text-left">
            Catat Stok Masuk
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium transition-colors text-left">
            Catat Stok Keluar
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium transition-colors text-left">
            Tambah Obat Baru
          </button>
        </div>
      </Section>

      <Section title="Ikon (aksi tabel)" desc="p-1.5, warna abu netral, hover berubah sesuai makna aksi.">
        <div className="flex gap-1">
          <button className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors" title="Hapus">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </Section>

      <Section title="Toggle role (aktif/nonaktif)" desc="UserTable — tombol dua-arah dengan warna berbeda tergantung status saat ini.">
        <div className="flex gap-2">
          <button className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">Nonaktifkan</button>
          <button className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">Aktifkan</button>
        </div>
      </Section>
    </section>
  )
}
