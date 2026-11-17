import { Suspense } from 'react'
import BarangMasukTable from '@/components/transaksi/BarangMasukTable'

// BarangMasukTable membaca filter dari URL (useSearchParams), jadi harus dibungkus Suspense agar build produksi tidak gagal.
export default function BarangMasukPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl py-16 text-center text-sm text-muted-foreground" role="status">Memuat stok masuk</div>}>
      <BarangMasukTable />
    </Suspense>
  )
}
