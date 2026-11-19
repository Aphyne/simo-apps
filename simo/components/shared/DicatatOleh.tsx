import { cn } from '@/lib/utils'

// "oleh Siti · Staf": siapa yang mencatat sebuah transaksi (diambil backend dari akun yang login, bukan isian).
// Ditaruh di bawah nama obat atau faktur supaya selalu terlihat, tidak hanya di layar sangat lebar.
export default function DicatatOleh({ nama, role, className }: { nama: string | null | undefined; role: string | null | undefined; className?: string }) {
  if (!nama) return null
  return (
    <span className={cn('block text-xs text-muted-foreground', className)}>
      oleh <span className="font-medium text-foreground">{nama}</span>
      {role && <> <span aria-hidden="true">·</span> {role === 'admin' ? 'Admin' : 'Staf'}</>}
    </span>
  )
}
