'use client'

import { useState } from 'react'
import { PackageMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import BarangKeluarForm from '@/components/transaksi/BarangKeluarForm'
import BarangKeluarTable from '@/components/transaksi/BarangKeluarTable'

export default function BarangKeluarPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Barang Keluar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Catat penjualan atau pengeluaran barang — stok otomatis berkurang & alert ROP aktif
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <PackageMinus className="w-4 h-4 mr-1.5" />
              Catat Barang Keluar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Catat Barang Keluar</DialogTitle>
            </DialogHeader>
            <BarangKeluarForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <BarangKeluarTable />
    </div>
  )
}
