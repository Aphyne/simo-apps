import SupplierTable from '@/components/supplier/SupplierTable'

export default function SupplierPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Data Supplier</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola daftar pemasok obat apotek</p>
      </div>
      <SupplierTable />
    </div>
  )
}
