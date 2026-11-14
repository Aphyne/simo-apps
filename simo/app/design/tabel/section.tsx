import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LevelBar } from '@/components/dashboard/StokMenipisCard'
import { PageHeader, Section } from '../_components'

const KEPALA = 'h-10 text-xs font-medium text-muted-foreground'

export function TabelSection() {
  return (
    <section id="tabel">
      <PageHeader
        title="Tabel"
        desc="Table shadcn di dalam Card. Kepala tabel huruf biasa, abu-abu pendukung. Angka rata kanan dan tabular. Garis antarbaris tipis, hover biru sangat lembut. Aksi ada di kolom terakhir sebagai tombol ikon."
      />

      <Section title="Tabel data" meta="Table, TableRow, TableCell" flush>
        <div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`${KEPALA} pl-4`}>Kode</TableHead>
                <TableHead className={KEPALA}>Nama obat</TableHead>
                <TableHead className={`${KEPALA} text-right`}>Stok</TableHead>
                <TableHead className={KEPALA}>Status</TableHead>
                <TableHead className={`${KEPALA} pr-4 text-right`}>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="py-3 pl-4 font-mono text-xs text-muted-foreground">OBT-011</TableCell>
                <TableCell className="py-3 font-medium text-foreground">Obh Combi Anak</TableCell>
                <TableCell className="py-3 text-right tabular-nums">2 botol</TableCell>
                <TableCell className="py-3"><Badge variant="destructive">Kritis</Badge></TableCell>
                <TableCell className="py-3 pr-4">
                  <div className="flex justify-end gap-1">
                    <Button size="icon-sm" variant="ghost" aria-label="Ubah Obh Combi Anak"><Pencil /></Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Hapus Obh Combi Anak" className="text-destructive hover:text-destructive"><Trash2 /></Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-3 pl-4 font-mono text-xs text-muted-foreground">OBT-012</TableCell>
                <TableCell className="py-3 font-medium text-foreground">Antasida Doen</TableCell>
                <TableCell className="py-3 text-right tabular-nums">800 tablet</TableCell>
                <TableCell className="py-3"><Badge variant="outline">Aman</Badge></TableCell>
                <TableCell className="py-3 pr-4">
                  <div className="flex justify-end gap-1">
                    <Button size="icon-sm" variant="ghost" aria-label="Ubah Antasida Doen"><Pencil /></Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Hapus Antasida Doen" className="text-destructive hover:text-destructive"><Trash2 /></Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={2} className="py-3 pl-4 text-xs font-medium text-muted-foreground">Total</TableCell>
                <TableCell className="py-3 text-right font-semibold tabular-nums">802 unit</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Section>

      <Section title="Garis level stok" desc="Panjang isi = stok terhadap dua kali ROP, penanda tegak = posisi ROP. Isi yang berhenti sebelum penanda berarti stok sudah di bawah titik pesan ulang. Angka stok dan ROP tetap tertulis. Untuk stok 0 garis tidak ditampilkan, cukup badge Habis." meta="LevelBar (dipakai di Dashboard)">
        <div className="space-y-4">
          {[
            ['Obh Combi Anak', 2, 9],
            ['Paracetamol 500mg', 120, 110],
            ['Antasida Doen', 190, 100],
          ].map(([nama, stok, rop]) => (
            <div key={String(nama)} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{nama}</p>
                <p className="text-xs tabular-nums text-muted-foreground">Stok {stok}, ROP {rop}</p>
              </div>
              <LevelBar stok={Number(stok)} rop={Number(rop)} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Keadaan kosong" desc="Satu kalimat dan, bila ada, aksi yang mengisinya.">
        <p className="py-8 text-center text-sm text-muted-foreground">Belum ada obat. Tambah obat pertama untuk mulai.</p>
      </Section>

      <Section title="Memuat" desc="Kerangka dengan tinggi baris yang sama dengan isi.">
        <div className="space-y-3" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-md bg-muted motion-safe:animate-pulse" />
          ))}
        </div>
      </Section>
    </section>
  )
}
