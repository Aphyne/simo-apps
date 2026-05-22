import { Badge } from '@/components/ui/badge'
import type { StatusStok } from '@/types/obat'

interface Props {
  status: StatusStok
}

const config: Record<StatusStok, { label: string; className: string }> = {
  AMAN: {
    label: 'Aman',
    className: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200',
  },
  MENDEKATI_ROP: {
    label: 'Mendekati ROP',
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
  },
  HARUS_REORDER: {
    label: 'Harus Reorder',
    className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200',
  },
}

export default function StatusBadge({ status }: Props) {
  const { label, className } = config[status] ?? config.AMAN
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
