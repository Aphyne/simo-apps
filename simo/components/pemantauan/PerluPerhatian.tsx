import { CircleCheck, ShieldAlert, UserX, UserMinus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AnalitikAktivitas } from '@/hooks/useAktivitas'
import { waktuRelatif } from './format'

interface Props {
  data: NonNullable<AnalitikAktivitas['perhatian']>
}

// Temuan dari kondisi SEKARANG (bukan dari rentang yang dipilih): login gagal beruntun, akun aktif yang lama tidak muncul,
// dan akun nonaktif. Baris datar dipisah garis tipis (bukan kartu di dalam kartu). Kosong ditulis eksplisit sebagai aman.
export default function PerluPerhatian({ data }: Props) {
  const gagal = data.login_gagal_beruntun
  const lama = data.akun_lama_diam
  const kosong = gagal.length === 0 && lama.length === 0 && data.akun_nonaktif === 0

  if (kosong) {
    return (
      <div role="status" className="flex flex-col items-center gap-2 py-6 text-center">
        <CircleCheck className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">Tidak ada yang perlu diperhatikan</p>
        <p className="max-w-xs text-sm text-muted-foreground">Tidak ada login gagal beruntun dan semua akun aktif muncul dalam 7 hari terakhir.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {gagal.map((g) => (
        <li key={g.username} className="flex items-start gap-3 border-t py-3 first:border-t-0 first:pt-0">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
              Login gagal beruntun <Badge variant="destructive" className="text-danger-700">{g.jumlah} kali</Badge>
            </p>
            <p className="text-sm text-muted-foreground">
              Username <span className="font-mono text-xs">@{g.username}</span> dalam 24 jam terakhir, terakhir {waktuRelatif(g.terakhir).toLowerCase()}. Bisa salah ketik, bisa juga orang lain mencoba masuk.
            </p>
          </div>
        </li>
      ))}
      {lama.map((u) => (
        <li key={u.id} className="flex items-start gap-3 border-t py-3 first:border-t-0 first:pt-0">
          <UserMinus className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{u.nama} belum muncul</p>
            <p className="text-sm text-muted-foreground">
              {u.last_seen_at ? `Terakhir aktif ${waktuRelatif(u.last_seen_at).toLowerCase()}.` : 'Belum pernah aktif sejak akunnya dibuat.'} Akun masih aktif.
            </p>
          </div>
        </li>
      ))}
      {data.akun_nonaktif > 0 && (
        <li className="flex items-start gap-3 border-t py-3 first:border-t-0 first:pt-0">
          <UserX className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{data.akun_nonaktif} akun nonaktif.</span> Tidak bisa masuk sampai diaktifkan di Manajemen User.
          </p>
        </li>
      )}
    </ul>
  )
}
