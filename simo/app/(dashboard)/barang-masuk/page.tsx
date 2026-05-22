'use client'

import { useState } from 'react'
import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import BarangMasukForm from '@/components/transaksi/BarangMasukForm'
import BarangMasukTable from '@/components/transaksi/BarangMasukTable'

export default function BarangMasukPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Barang Masuk</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Catat penerimaan barang dari supplier — stok otomatis bertambah
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PackagePlus className="w-4 h-4 mr-1.5" />
              Catat Barang Masuk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Catat Barang Masuk</DialogTitle>
            </DialogHeader>
            <BarangMasukForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <BarangMasukTable />
    </div>
  )
}
