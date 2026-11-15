import { Suspense } from 'react'
import ObatTable from '@/components/obat/ObatTable'

// ObatTable membaca filter dari URL (useSearchParams), jadi harus dibungkus Suspense agar build produksi tidak gagal.
export default function ObatPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl py-16 text-center text-sm text-muted-foreground" role="status">Memuat data obat</div>}>
      <ObatTable />
    </Suspense>
  )
}
