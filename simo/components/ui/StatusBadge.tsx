import { Badge } from '@/components/ui/badge'
import type { StatusStok } from '@/types/obat'

interface Props {
  status: StatusStok
  // Bila diberikan dan stok sudah 0, tampil "Habis" (tingkat tertinggi, DESIGN.md 4.3) menggantikan "Harus reorder".
  stok?: number
}

// Status stok memakai pola badge DESIGN.md 4.3. Warna selalu disertai teks.
// Harus reorder = stok di bawah ROP (di dashboard disebut Kritis).
const config: Record<StatusStok, { label: string; variant: 'outline' | 'destructive'; className?: string }> = {
  AMAN: { label: 'Aman', variant: 'outline' },
  MENDEKATI_ROP: { label: 'Mendekati ROP', variant: 'outline', className: 'border-transparent bg-warning-50 text-warning-700' },
  HARUS_REORDER: { label: 'Harus reorder', variant: 'destructive', className: 'text-danger-700' },
}

export default function StatusBadge({ status, stok }: Props) {
  if (stok !== undefined && stok <= 0) {
    return <Badge className="bg-destructive text-white">Habis</Badge>
  }
  const { label, variant, className } = config[status] ?? config.AMAN
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}
