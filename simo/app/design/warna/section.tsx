import { PageHeader, Section } from '../_components'
import { Swatch } from '../_swatch'

export function WarnaSection() {
  return (
    <section id="warna">
      <PageHeader
        title="Warna"
        desc="Dua keluarga: biru untuk aksi, pilihan aktif, dan data utama; slate untuk teks, garis, dan permukaan. Tanpa gradasi. Merah dan oranye hanya muncul sebagai status stok, selalu bersama teks. Semua nilai di bawah dibaca dari globals.css."
      />

      <Section title="Biru" desc="Satu-satunya warna aksen. Tombol utama, tautan, cincin fokus, dan garis data utama." meta="bg-primary · bg-accent · bg-chart-1">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Swatch name="Primer" token="primary" className="bg-primary" note="Tombol utama, tautan, angka yang ditekankan." />
          <Swatch name="Primer, teks di atasnya" token="primary-foreground" className="bg-primary-foreground" />
          <Swatch name="Aksen lembut" token="accent" className="bg-accent" note="Hover menu dan baris terpilih." />
          <Swatch name="Aksen, teks" token="accent-foreground" className="bg-accent-foreground" />
        </div>
      </Section>

      <Section title="Slate" desc="Netral bersuhu dingin. Teks, garis, dan permukaan." meta="bg-background · bg-card · bg-muted · border">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Swatch name="Latar halaman" token="background" className="bg-background" />
          <Swatch name="Panel dan kartu" token="card" className="bg-card" />
          <Swatch name="Permukaan redup" token="muted" className="bg-muted" note="Skeleton, chip, jalur progres." />
          <Swatch name="Sekunder" token="secondary" className="bg-secondary" />
          <Swatch name="Teks utama" token="foreground" className="bg-foreground" />
          <Swatch name="Teks pendukung" token="muted-foreground" className="bg-muted-foreground" note="Label, keterangan, sumbu grafik." />
          <Swatch name="Garis" token="border" className="bg-border" note="Panel, pemisah baris." />
          <Swatch name="Garis kontrol" token="input" className="bg-input" note="Tepi input dan tombol outline." />
        </div>
      </Section>

      <Section title="Status stok" desc="Dua keadaan yang memang butuh warna. Kritis memakai merah, mendekati ROP memakai oranye. Aman tidak diberi warna." meta="danger-* · warning-*">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Swatch name="Kritis" token="destructive" className="bg-destructive" note="Badge, angka, garis level stok di bawah ROP." />
          <Swatch name="Mendekati ROP" token="warning-700 (teks) · warning-50 (latar)" className="bg-warning-700" />
          <Swatch name="Aman" token="foreground" className="bg-foreground" note="Teks biasa, tanpa warna khusus." />
        </div>
      </Section>

      <Section title="Warna grafik" desc="Urutan pemakaian: chart-1 untuk data utama, chart-2 untuk pembanding atau baseline. Sisanya hanya bila perlu lebih dari dua seri." meta="var(--chart-1) … var(--chart-5)">
        <div className="grid grid-cols-5 gap-4">
          <Swatch compact name="chart-1" token="data utama" className="bg-chart-1" />
          <Swatch compact name="chart-2" token="pembanding" className="bg-chart-2" />
          <Swatch compact name="chart-3" token="seri ketiga" className="bg-chart-3" />
          <Swatch compact name="chart-4" token="seri keempat" className="bg-chart-4" />
          <Swatch compact name="chart-5" token="seri kelima" className="bg-chart-5" />
        </div>
      </Section>

      <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
        Token lama (brand, fg, surface, line, danger, warning) masih dipakai halaman lain dan belum dimigrasikan. Sudah memakai sistem ini: Dashboard, Design, serta sidebar, header, latar, dan huruf di semua halaman. Isi halaman lain belum.
      </p>
    </section>
  )
}
