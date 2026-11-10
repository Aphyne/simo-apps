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
    className: 'bg-warning-100 text-warning-700 hover:bg-warning-100 border-warning-200',
  },
  HARUS_REORDER: {
    label: 'Harus Reorder',
    className: 'bg-danger-100 text-danger-700 hover:bg-danger-100 border-danger-200',
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
