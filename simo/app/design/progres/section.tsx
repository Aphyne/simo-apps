import { Progress } from '@/components/ui/progress'
import { PageHeader, Section } from '../_components'
import { PROGRES_PENATAAN, type StatusPenataan } from './data'

const BADGE: Record<StatusPenataan, string> = {
  Mengikuti: 'bg-success-100 text-success-700',
  Belum: 'bg-warning-100 text-warning-700',
  'Belum tercatat': 'bg-surface-muted text-fg-tertiary',
}

export function ProgresSection() {
  const total = PROGRES_PENATAAN.length
  const hitung = (s: StatusPenataan) => PROGRES_PENATAAN.filter((b) => b.status === s).length
  const mengikuti = hitung('Mengikuti')
  const persen = Math.round((mengikuti / total) * 100)

  return (
    <section id="progres">
      <PageHeader title="Progres penataan" desc="Status tiap halaman terhadap design system. Salinan dari tabel Progres penataan di docs/DESIGN.md bagian 6; bila berbeda, DESIGN.md yang benar. Mengikuti berarti sudah di-acc Boss menurut checklist lama, bukan hasil audit baru." />

      <Section title="Ringkasan" meta="components/ui/progress.tsx">
        <div className="max-w-md space-y-2">
          <Progress value={persen} aria-label="Halaman yang sudah mengikuti design system" aria-valuemin={0} aria-valuemax={100} aria-valuenow={persen} className="h-2" />
          <p className="text-sm text-fg-secondary tabular-nums">{mengikuti} dari {total} halaman mengikuti ({persen}%)</p>
          <p className="text-xs text-fg-muted tabular-nums">Belum: {hitung('Belum')} · Belum tercatat: {hitung('Belum tercatat')}</p>
        </div>
        <p className="mt-4 text-xs text-fg-muted max-w-xl">
          Komponen Progress shadcn belum dipakai di halaman aplikasi mana pun, dan indikatornya memakai warna primary shadcn yang sedikit lebih gelap dari brand-600 (docs/DESIGN.md bagian 5, butir 4). Proses berjalan di aplikasi saat ini memakai teks, misalnya Menghitung 13/20.
        </p>
      </Section>

      <Section title="Status per halaman" meta="docs/DESIGN.md bagian 6">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-subtle">
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Halaman</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Rute / berkas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {PROGRES_PENATAAN.map((b) => (
                <tr key={b.halaman} className="hover:bg-surface-subtle transition-colors">
                  <td className="px-4 py-3 font-medium text-fg">{b.halaman}</td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted whitespace-nowrap">{b.rute}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${BADGE[b.status]}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-fg-tertiary">{b.catatan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </section>
  )
}
