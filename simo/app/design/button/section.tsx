import { Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Section } from '../_components'

export function ButtonSection() {
  return (
    <section id="button">
      <PageHeader title="Button" desc="Rounded-lg, tanpa pill. Primer biru untuk aksi utama, outline untuk sekunder, merah untuk destruktif. Warna tinted (bg-{color}-50) untuk Aksi Cepat di dashboard." />

      <Section title="Varian" meta="bg-{color}-600 hover:bg-{color}-700">
        <div className="flex flex-wrap gap-3">
          <button className="bg-brand-600 hover:bg-brand-700 text-fg-inverse font-medium rounded-lg px-4 py-2 text-sm transition-colors">
            Simpan
          </button>
          <button className="border border-line-strong text-fg-secondary hover:bg-surface-subtle rounded-lg px-4 py-2 text-sm transition-colors">
            Batal
          </button>
          <button className="bg-danger-600 hover:bg-danger-700 text-fg-inverse font-medium rounded-lg px-4 py-2 text-sm transition-colors">
            Hapus
          </button>
          <button disabled className="bg-brand-600 text-fg-inverse font-medium rounded-lg px-4 py-2 text-sm opacity-60 cursor-not-allowed">
            Menyimpan...
          </button>
        </div>
      </Section>

      <Section title="Aksi Cepat (tinted, full width)" desc="Dashboard — tombol besar dengan background pastel dan ikon di kiri.">
        <div className="flex flex-col gap-2 max-w-xs">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-medium transition-colors text-left">
            Catat Stok Masuk
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-warning-50 hover:bg-warning-100 text-warning-700 text-sm font-medium transition-colors text-left">
            Catat Stok Keluar
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-success-50 hover:bg-success-100 text-success-700 text-sm font-medium transition-colors text-left">
            Tambah Obat Baru
          </button>
        </div>
      </Section>

      <Section title="Ikon (aksi tabel)" desc="p-1.5, warna abu netral, hover berubah sesuai makna aksi.">
        <div className="flex gap-1">
          <button className="rounded-lg p-1.5 text-fg-muted hover:bg-brand-50 hover:text-brand-600 transition-colors" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button className="rounded-lg p-1.5 text-fg-muted hover:bg-danger-50 hover:text-danger-600 transition-colors" title="Hapus">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </Section>

      <Section title="Toggle role (aktif/nonaktif)" desc="UserTable — tombol dua-arah dengan warna berbeda tergantung status saat ini.">
        <div className="flex gap-2">
          <button className="rounded-lg p-1.5 text-fg-muted hover:bg-danger-50 hover:text-danger-500 transition-colors">Nonaktifkan</button>
          <button className="rounded-lg p-1.5 text-fg-subtle hover:bg-success-50 hover:text-success-600 transition-colors">Aktifkan</button>
        </div>
      </Section>
    </section>
  )
}
