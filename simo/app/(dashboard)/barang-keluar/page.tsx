import { Suspense } from 'react'
import BarangKeluarTable from '@/components/transaksi/BarangKeluarTable'

// BarangKeluarTable membaca filter dari URL (useSearchParams), jadi harus dibungkus Suspense agar build produksi tidak gagal.
export default function BarangKeluarPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl py-16 text-center text-sm text-muted-foreground" role="status">Memuat stok keluar</div>}>
      <BarangKeluarTable />
    </Suspense>
  )
}
