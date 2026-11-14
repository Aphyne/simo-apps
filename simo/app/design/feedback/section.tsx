'use client'

import { CalendarX, PackageOpen, Pill, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StatTile } from '@/components/dashboard/StatTile'
import { StatusBadge } from '@/components/dashboard/StokMenipisCard'
import { PageHeader, Section } from '../_components'

export function FeedbackSection() {
  return (
    <section id="feedback">
      <PageHeader
        title="Umpan balik"
        desc="Badge untuk status singkat, alert untuk peringatan di tempat, toast untuk hasil sebuah aksi, progress untuk proses berjalan. Status selalu ditulis dengan kata, tidak hanya warna."
      />

      <Section title="Badge status stok" desc="Empat tingkat, dari yang paling mendesak: Habis (stok 0), Kritis (di bawah ROP), Mendekati ROP, Aman. Dua yang pertama memakai merah, dan teks Kritis memakai danger-700 agar kontrasnya 5,4:1." meta="StatusBadge (dipakai di Dashboard)">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge stok={0} rop={1} />
          <StatusBadge stok={2} rop={9} />
          <StatusBadge stok={120} rop={110} />
          <Badge variant="outline">Aman</Badge>
        </div>
      </Section>

      <Section title="Badge lain" desc="Netral untuk keterangan biasa, biru untuk yang aktif atau terpilih.">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Admin</Badge>
          <Badge variant="secondary">Staf</Badge>
          <Badge variant="secondary">Penjualan</Badge>
          <Badge variant="secondary">Retur</Badge>
          <Badge variant="secondary">Rusak</Badge>
        </div>
      </Section>

      <Section title="Alert di tempat" desc="Satu panel dengan garis tipis, ikon di kiri. Pesan menyebut jumlah dan apa yang bisa dilakukan.">
        <div role="status" className="flex max-w-md items-start gap-3 rounded-lg border bg-muted/50 p-4">
          <CalendarX className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium text-foreground">2 obat akan expired dalam 90 hari</p>
            <p className="mt-0.5 text-muted-foreground">Buka Monitoring untuk melihat daftarnya.</p>
          </div>
        </div>
      </Section>

      <Section title="Toast" desc="Hasil sebuah aksi. Kata kerja yang sama dengan tombolnya: Simpan berakhir dengan Tersimpan." meta="sonner">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.success('Obat tersimpan')}>Contoh sukses</Button>
          <Button variant="outline" onClick={() => toast.error('Obat gagal disimpan. Periksa kolom stok awal.')}>Contoh gagal</Button>
        </div>
      </Section>

      <Section title="Data gagal dimuat" desc="Angka tidak boleh tampil 0 atau 'aman' saat server tidak menjawab. Angka diganti '-', dan tiap panel menjelaskan bahwa ini bukan berarti stok aman." meta="StatTile value={null}" bare>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile label="Total obat" value={null} sublabel="jenis terdaftar" icon={Pill} />
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card px-5 py-8 text-center">
            <TriangleAlert className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Data stok belum bisa dimuat</p>
            <p className="text-sm text-muted-foreground">Ini bukan berarti semua stok aman. Coba lagi lewat tombol di atas.</p>
          </div>
        </div>
      </Section>

      <Section title="Progress" meta="Progress">
        <div className="max-w-xs space-y-2">
          <Progress value={65} aria-label="Menghitung ulang obat" />
          <p className="text-sm tabular-nums text-muted-foreground">Menghitung ulang 13 dari 20 obat</p>
        </div>
      </Section>

      <Section title="Keadaan kosong" desc="Ikon kecil, satu kalimat yang menjelaskan apa yang belum ada, dan bila bisa satu aksi.">
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <PackageOpen className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Belum ada barang keluar hari ini</p>
          <p className="text-sm text-muted-foreground">Catatan akan muncul di sini setelah stok keluar dicatat.</p>
        </div>
      </Section>
    </section>
  )
}
