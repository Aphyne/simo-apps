import { PageHeader, Section } from '../_components'

function Row({ name, token, className, sample }: { name: string; token: string; className: string; sample: string }) {
  return (
    <div className="grid grid-cols-1 items-baseline gap-x-6 gap-y-1 border-b py-4 first:pt-0 last:border-0 last:pb-0 sm:grid-cols-[200px_1fr]">
      <div>
        <p className="text-[13px] font-medium text-foreground">{name}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{token}</p>
      </div>
      <p className={className}>{sample}</p>
    </div>
  )
}

export function TipografiSection() {
  return (
    <section id="tipografi">
      <PageHeader
        title="Tipografi"
        desc="Figtree untuk semua teks, dimuat lewat next/font (dipilih skill untuk produk farmasi dan kesehatan: bersih, terbaca, ramah). Skala rapat dengan rasio sekitar 1,2. Label, kepala tabel, dan keterangan memakai huruf biasa, bukan kapital dan tanpa jarak antarhuruf. Angka selalu tabular."
      />

      <Section title="Skala" meta="font-sans · text-{ukuran}">
        <Row name="Judul halaman" token="text-3xl font-semibold" className="text-3xl font-semibold tracking-tight text-foreground" sample="Design system SIMO" />
        <Row name="Judul bagian" token="text-xl font-semibold" className="text-xl font-semibold tracking-tight text-foreground" sample="Stok dan penjualan" />
        <Row name="Judul panel" token="text-sm font-semibold" className="text-sm font-semibold text-foreground" sample="Stok menipis" />
        <Row name="Isi" token="text-sm" className="text-sm leading-relaxed text-foreground" sample="Teks paragraf standar untuk isi halaman dan deskripsi, dibatasi sekitar 70 karakter per baris." />
        <Row name="Label dan keterangan" token="text-[13px] text-muted-foreground" className="text-[13px] font-medium text-muted-foreground" sample="Penjualan hari ini" />
        <Row name="Catatan kecil" token="text-xs text-muted-foreground" className="text-xs text-muted-foreground" sample="Dicatat oleh Admin pada 16 Desember 2026" />
        <Row name="Kode" token="font-mono text-xs" className="font-mono text-xs text-muted-foreground" sample="OBT-011" />
        <Row name="Angka besar" token="text-3xl font-semibold tabular-nums" className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground" sample="1.250" />
      </Section>

      <Section title="Angka tabular" desc="Dipakai di kolom tabel, angka ringkas, dan sumbu grafik supaya digit sejajar.">
        <div className="flex flex-wrap gap-x-12 gap-y-4">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Tanpa tabular-nums</p>
            <p className="text-xl font-semibold text-foreground">Rp1.111.111</p>
            <p className="text-xl font-semibold text-foreground">Rp8.888.888</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Dengan tabular-nums</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">Rp1.111.111</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">Rp8.888.888</p>
          </div>
        </div>
      </Section>
    </section>
  )
}
