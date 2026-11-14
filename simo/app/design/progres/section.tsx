import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, Section } from '../_components'
import { PROGRES_PENATAAN, type StatusPenataan } from './data'

const KEPALA = 'h-10 text-xs font-medium text-muted-foreground'

function StatusBadge({ status }: { status: StatusPenataan }) {
  if (status === 'Mengikuti') return <Badge variant="outline">Mengikuti</Badge>
  if (status === 'Belum') return <Badge className="bg-warning-50 text-warning-700">Belum</Badge>
  return <Badge variant="secondary">Belum tercatat</Badge>
}

export function ProgresSection() {
  const total = PROGRES_PENATAAN.length
  const hitung = (s: StatusPenataan) => PROGRES_PENATAAN.filter((b) => b.status === s).length
  const mengikuti = hitung('Mengikuti')
  const persen = Math.round((mengikuti / total) * 100)

  return (
    <section id="progres">
      <PageHeader
        title="Progres penataan"
        desc="Status tiap halaman terhadap design system v2 (Flat + Bento). Salinan tabel bagian 6 di docs/DESIGN.md; bila berbeda, DESIGN.md yang benar. Mengikuti berarti isi halaman sudah memakai token dan pola v2. Sidebar, header, latar, dan huruf sudah v2 di semua halaman, jadi Belum hanya berarti isinya masih gaya v1."
      />

      <Section title="Ringkasan" meta="components/ui/progress.tsx">
        <div className="max-w-md space-y-2">
          <Progress value={persen} aria-label="Halaman yang sudah mengikuti design system" className="h-2" />
          <p className="text-sm tabular-nums text-foreground">{mengikuti} dari {total} halaman mengikuti ({persen}%)</p>
          <p className="text-sm tabular-nums text-muted-foreground">Belum: {hitung('Belum')}. Belum tercatat: {hitung('Belum tercatat')}.</p>
        </div>
      </Section>

      <Section title="Status per halaman" meta="docs/DESIGN.md bagian 6" flush>
        <div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`${KEPALA} pl-4`}>Halaman</TableHead>
                <TableHead className={KEPALA}>Rute atau berkas</TableHead>
                <TableHead className={KEPALA}>Status</TableHead>
                <TableHead className={`${KEPALA} pr-4`}>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROGRES_PENATAAN.map((b) => (
                <TableRow key={b.halaman}>
                  <TableCell className="py-3 pl-4 font-medium text-foreground whitespace-normal">{b.halaman}</TableCell>
                  <TableCell className="py-3 font-mono text-xs text-muted-foreground">{b.rute}</TableCell>
                  <TableCell className="py-3"><StatusBadge status={b.status} /></TableCell>
                  <TableCell className="py-3 pr-4 text-muted-foreground whitespace-normal">{b.catatan || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>
    </section>
  )
}
