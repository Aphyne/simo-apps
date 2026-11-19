import type { ModulPakai } from '@/hooks/useAktivitas'
import { cn } from '@/lib/utils'

interface Props {
  modul: ModulPakai[]
  className?: string
}

// Pemakaian per modul sebagai batang horizontal: panjang = halaman dibuka + aksi data. Modul yang belum pernah dibuka
// tetap tampil (di bawah) dan ditulis begitu, karena itu temuan, bukan baris yang boleh hilang. Angkanya selalu tertulis.
export default function FiturDipakai({ modul, className }: Props) {
  const total = (m: ModulPakai) => m.halaman + m.aksi
  const urut = [...modul].sort((a, b) => total(b) - total(a))
  const terbesar = Math.max(1, ...urut.map(total))
  const dipakai = urut.filter((m) => total(m) > 0).length

  return (
    <div className={className}>
      <p className="mb-3 text-sm text-muted-foreground">
        {dipakai} dari {modul.length} modul pernah dipakai pada rentang ini.
      </p>
      <ul className="flex flex-col gap-3">
        {urut.map((m) => {
          const t = total(m)
          return (
            <li key={m.kunci} className="grid grid-cols-[7.5rem_1fr] items-center gap-x-3 gap-y-1 sm:grid-cols-[8.5rem_1fr_auto]">
              <span className={cn('text-sm', t > 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}>{m.label}</span>
              <span className="h-2 rounded-full bg-muted" aria-hidden="true">
                {t > 0 && <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (t / terbesar) * 100)}%` }} />}
              </span>
              <span className="col-span-2 text-sm tabular-nums text-muted-foreground sm:col-span-1 sm:w-44 sm:text-right">
                {t > 0 ? `${m.halaman} dibuka · ${m.aksi} aksi` : 'Belum pernah dibuka'}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
