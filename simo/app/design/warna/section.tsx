import { PageHeader, Section } from '../_components'
import { Swatch } from '../_swatch'

// Kelas ditulis utuh (bukan dirangkai) supaya terdeteksi Tailwind.
const SKALA = [
  { fam: 'brand', peran: 'Aksen utama: tombol primer, nav aktif, cincin fokus, tautan. 600 = isi pekat, 500 = fokus input, 700 = hover, 50/100 = tint.',
    langkah: [
      ['50', 'bg-brand-50'], ['100', 'bg-brand-100'], ['200', 'bg-brand-200'], ['300', 'bg-brand-300'], ['400', 'bg-brand-400'],
      ['500', 'bg-brand-500'], ['600', 'bg-brand-600'], ['700', 'bg-brand-700'], ['800', 'bg-brand-800'], ['900', 'bg-brand-900'],
    ] },
  { fam: 'danger', peran: 'Error, stok kritis, hapus. 600 untuk teks error, 100 untuk badge.',
    langkah: [
      ['50', 'bg-danger-50'], ['100', 'bg-danger-100'], ['200', 'bg-danger-200'], ['300', 'bg-danger-300'], ['400', 'bg-danger-400'],
      ['500', 'bg-danger-500'], ['600', 'bg-danger-600'], ['700', 'bg-danger-700'], ['800', 'bg-danger-800'], ['900', 'bg-danger-900'],
    ] },
  { fam: 'success', peran: 'Aman, sukses. 700 untuk teks data hijau, 100 untuk badge.',
    langkah: [
      ['50', 'bg-success-50'], ['100', 'bg-success-100'], ['200', 'bg-success-200'], ['300', 'bg-success-300'], ['400', 'bg-success-400'],
      ['500', 'bg-success-500'], ['600', 'bg-success-600'], ['700', 'bg-success-700'], ['800', 'bg-success-800'], ['900', 'bg-success-900'],
    ] },
  { fam: 'warning', peran: 'Mendekati ROP/kedaluwarsa, peringatan. 700 untuk teks, 100 untuk badge.',
    langkah: [
      ['50', 'bg-warning-50'], ['100', 'bg-warning-100'], ['200', 'bg-warning-200'], ['300', 'bg-warning-300'], ['400', 'bg-warning-400'],
      ['500', 'bg-warning-500'], ['600', 'bg-warning-600'], ['700', 'bg-warning-700'], ['800', 'bg-warning-800'], ['900', 'bg-warning-900'],
    ] },
] as const

export function WarnaSection() {
  return (
    <section id="warna">
      <PageHeader title="Warna" desc="Warna diberi nama lewat token di simo/app/globals.css. Blok di bawah memakai kelas token itu sendiri dan nilainya dibaca dari CSS di browser, jadi mengubah token di globals.css langsung terlihat di sini. Warna semantik dipakai konsisten untuk status stok dan keterangan transaksi, dan selalu disertai teks, bukan hanya warna." />

      {SKALA.map((s) => (
        <Section key={s.fam} title={`${s.fam} (50 sampai 900)`} desc={s.peran} meta={`bg-${s.fam}-{50..900}`}>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {s.langkah.map(([n, kelas]) => (
              <Swatch key={kelas} compact name={`${s.fam}-${n}`} token={kelas} className={kelas} />
            ))}
          </div>
        </Section>
      ))}

      <Section title="Teks" desc="fg-subtle hanya untuk ikon dan elemen non-teks (tidak lolos AA untuk teks)." meta="text-{fg, fg-secondary, ...}">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Swatch name="Judul, angka utama" token="fg" className="bg-fg" />
          <Swatch name="Label form, sel tabel" token="fg-secondary" className="bg-fg-secondary" />
          <Swatch name="Teks isi" token="fg-tertiary" className="bg-fg-tertiary" />
          <Swatch name="Sublabel, caption" token="fg-muted" className="bg-fg-muted" />
          <Swatch name="Hanya ikon" token="fg-subtle" className="bg-fg-subtle" />
          <Swatch name="Teks di atas warna pekat" token="fg-inverse" className="bg-fg-inverse" />
        </div>
      </Section>

      <Section title="Permukaan dan garis" meta="bg-surface* · border-line*">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Swatch name="Kartu, panel, input" token="surface" className="bg-surface" />
          <Swatch name="Latar halaman, header tabel" token="surface-subtle" className="bg-surface-subtle" />
          <Swatch name="Hover netral, skeleton, chip" token="surface-muted" className="bg-surface-muted" />
          <Swatch name="Border kartu, tabel" token="line" className="bg-line" />
          <Swatch name="Pemisah baris halus" token="line-subtle" className="bg-line-subtle" />
          <Swatch name="Border input, tombol sekunder" token="line-strong" className="bg-line-strong" />
        </div>
      </Section>

      <Section title="Semantik: Status Stok" desc="AMAN / MENDEKATI_ROP / HARUS_REORDER, selalu disertai label teks, tidak pernah hanya warna.">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Swatch name="Aman" token="success-700 (teks) · success-100 (badge)" className="bg-success-700" note="StatusBadge saat ini memakai green, bukan success (lihat docs/DESIGN.md bagian 5)." />
          <Swatch name="Mendekati ROP" token="warning-700 (teks) · warning-100 (badge)" className="bg-warning-700" />
          <Swatch name="Harus Reorder" token="danger-600 (teks) · danger-100 (badge)" className="bg-danger-600" />
        </div>
      </Section>

      <Section title="Semantik: Keterangan Transaksi dan Role">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Swatch name="Penjualan / Admin" token="brand-600" className="bg-brand-600" />
          <Swatch name="Retur" token="purple-600" className="bg-purple-600" note="Tanpa token (belum ada nama peran)." />
          <Swatch name="Rusak" token="warning-600" className="bg-warning-600" />
          <Swatch name="Kedaluarsa" token="danger-500" className="bg-danger-500" />
          <Swatch name="Lainnya / Staf" token="fg-muted" className="bg-fg-muted" />
        </div>
      </Section>

      <Section title="Kartu Rumus (border-l accent)" desc="RumusDisplay.tsx: tiap kartu langkah kalkulasi EOQ/SS/ROP/TC punya warna border-l berbeda.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Swatch name="EOQ" token="brand-500" className="bg-brand-500" />
          <Swatch name="Safety Stock" token="success-500" className="bg-success-500" />
          <Swatch name="ROP" token="warning-500" className="bg-warning-500" />
          <Swatch name="Total Cost" token="purple-500" className="bg-purple-500" note="Tanpa token." />
        </div>
      </Section>
    </section>
  )
}
