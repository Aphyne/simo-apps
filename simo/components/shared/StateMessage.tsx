import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StateMessageProps {
  icon: LucideIcon
  title: string
  // Apa yang terjadi dan apa yang bisa dilakukan, satu atau dua kalimat.
  description?: string
  // Aksi yang menyelesaikan keadaan ini (mis. atur ulang filter). Satu saja.
  action?: ReactNode
  className?: string
}

// Keadaan kosong, tidak ketemu, atau gagal: ikon kecil, satu kalimat tebal, satu kalimat keterangan.
// Kalimatnya berisi arah, bukan sekadar "tidak ada data".
export default function StateMessage({ icon: Icon, title, description, action, className }: StateMessageProps) {
  return (
    <div role="status" className={cn('flex flex-col items-center gap-2 px-5 py-12 text-center', className)}>
      <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
