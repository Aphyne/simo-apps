'use client'

import Link from 'next/link'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useSupplierList, useDeleteSupplier } from '@/hooks/useSupplier'

export default function SupplierTable() {
  const { data: suppliers = [], isLoading } = useSupplierList()
  const deleteMutation = useDeleteSupplier()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/supplier/tambah">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Supplier
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Telepon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">WhatsApp</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Jenis Obat</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Lead Time</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">Memuat data...</td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">Belum ada data supplier</td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.nama}</p>
                    {s.alamat && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{s.alamat}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.telepon ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.whatsapp ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <span className="truncate block">{s.jenis_obat ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{s.lead_time_avg} hari</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <Link href={`/supplier/${s.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        }
                        title={`Hapus ${s.nama}?`}
                        description="Supplier yang masih digunakan oleh obat tidak bisa dihapus."
                        onConfirm={() => deleteMutation.mutate(s.id)}
                        loading={deleteMutation.isPending}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
