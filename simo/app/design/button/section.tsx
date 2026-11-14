import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, Section } from '../_components'

export function ButtonSection() {
  return (
    <section id="button">
      <PageHeader
        title="Tombol"
        desc="Komponen Button shadcn. Satu tombol biru per tampilan untuk aksi utama; sisanya outline atau ghost. Merah hanya untuk aksi yang menghapus. Label berupa kata kerja yang jelas, dalam huruf biasa."
      />

      <Section title="Varian" meta="variant">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Simpan</Button>
          <Button variant="outline">Batal</Button>
          <Button variant="secondary">Sekunder</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Hapus</Button>
          <Button variant="link">Tautan</Button>
          <Button disabled>Menyimpan</Button>
        </div>
      </Section>

      <Section title="Ukuran" meta="size: xs, sm, default, lg">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">Sangat kecil</Button>
          <Button size="sm">Kecil</Button>
          <Button>Standar (32px)</Button>
          <Button size="lg">Besar (36px)</Button>
        </div>
      </Section>

      <Section title="Dengan ikon" desc="Ikon Lucide di kiri teks lewat data-icon, bukan margin manual.">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">
            <Plus data-icon="inline-start" />
            Tambah obat
          </Button>
          <Button size="lg" variant="outline">
            <Download data-icon="inline-start" />
            Unduh laporan
          </Button>
        </div>
      </Section>

      <Section title="Tombol ikon" desc="Wajib punya aria-label karena tidak ada teks.">
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" aria-label="Ubah">
            <Pencil />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Hapus" className="text-destructive hover:text-destructive">
            <Trash2 />
          </Button>
        </div>
      </Section>
    </section>
  )
}
