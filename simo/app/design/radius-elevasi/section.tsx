import Panel from '@/components/dashboard/Panel'
import { PageHeader, Section } from '../_components'
import { RadiusBox } from './radius-box'

export function RadiusElevasiSection() {
  return (
    <section id="radius-elevasi">
      <PageHeader
        title="Bentuk"
        desc="Datar, gaya bento. Ubin putih di atas kanvas abu muda, dipisahkan oleh jarak, bukan garis atau bayangan. Satu radius untuk satu tingkat: md untuk kontrol kecil, xl untuk tombol, 2xl untuk ubin, penuh untuk badge. Nilai piksel dibaca dari CSS (turunan --radius di globals.css)."
      />

      <Section title="Radius yang dipakai" meta="rounded-{md, xl, 2xl, full}">
        <div className="flex flex-wrap gap-10">
          <RadiusBox label="Kontrol: tombol, input" token="rounded-md" className="rounded-md" />
          <RadiusBox label="Tombol besar" token="rounded-xl" className="rounded-xl" />
          <RadiusBox label="Ubin dan panel" token="rounded-2xl" className="rounded-2xl" />
          <RadiusBox label="Badge" token="rounded-full" className="rounded-full" />
        </div>
      </Section>

      <Section title="Jarak, bukan garis" desc="Ubin dipisahkan jarak 16px di atas kanvas. Bayangan hanya untuk hal yang melayang di atas halaman: menu, popover, dialog.">
        <div className="grid grid-cols-1 gap-6 rounded-xl bg-background p-5 sm:grid-cols-3">
          <div>
            <div className="h-16 rounded-2xl bg-card" />
            <p className="mt-2 text-[13px] font-medium text-foreground">Panel</p>
            <p className="text-xs text-muted-foreground">Putih datar, tanpa garis dan bayangan</p>
          </div>
          <div>
            <div className="h-16 rounded-lg bg-popover shadow-md ring-1 ring-foreground/10" />
            <p className="mt-2 text-[13px] font-medium text-foreground">Menu dan popover</p>
            <p className="text-xs text-muted-foreground">Bayangan sedang dan garis tipis</p>
          </div>
          <div>
            <div className="h-16 rounded-lg bg-popover shadow-lg ring-1 ring-foreground/10" />
            <p className="mt-2 text-[13px] font-medium text-foreground">Dialog</p>
            <p className="text-xs text-muted-foreground">Bayangan lebih besar dan garis tipis</p>
          </div>
        </div>
      </Section>

      <Section title="Panel" desc="Satu pola panel untuk seluruh Dashboard, dibuat dari Card shadcn: judul di kiri, aksi tautan di kanan, isi di bawahnya. Putih datar, tanpa garis pemisah header." meta="components/dashboard/Panel.tsx" bare>
        <Panel title="Stok menipis" count={3} action={<a href="#radius-elevasi" className="text-primary hover:underline focus-visible:underline">Lihat semua</a>}>
          <p className="text-sm text-muted-foreground">Isi panel: tabel, daftar, atau grafik.</p>
        </Panel>
      </Section>
    </section>
  )
}
