import ObatTable from '@/components/obat/ObatTable'

export default function ObatPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Data Obat</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola data master obat dan parameter EOQ/ROP</p>
      </div>
      <ObatTable />
    </div>
  )
}
