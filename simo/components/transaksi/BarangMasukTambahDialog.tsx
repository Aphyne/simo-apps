'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import BarangMasukForm from '@/components/transaksi/BarangMasukForm'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Dipanggil setelah stok masuk tersimpan (dialog sudah ditutup).
  onSuccess?: () => void
}

// Dialog "Catat stok masuk", dipakai di halaman Stok masuk dan Dashboard. Menutupnya (Batal, Esc, X, klik di luar)
// meminta konfirmasi bila isian sudah diubah, karena satu faktur bisa berisi banyak obat.
export default function BarangMasukTambahDialog({ open, onOpenChange, onSuccess }: Props) {
  const [kotor, setKotor] = useState(false)
  const [konfirmasi, setKonfirmasi] = useState(false)

  function tutup() {
    setKotor(false)
    setKonfirmasi(false)
    onOpenChange(false)
  }

  function mintaTutup() {
    if (kotor) setKonfirmasi(true)
    else tutup()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : mintaTutup())}>
        <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-3xl">
          <DialogHeader className="gap-1.5 pr-8">
            <DialogTitle className="text-lg font-semibold">Catat stok masuk</DialogTitle>
            <DialogDescription>Catat obat yang diterima dari satu faktur supplier. Stok bertambah setelah disimpan.</DialogDescription>
          </DialogHeader>
          <BarangMasukForm
            onSuccess={() => { tutup(); onSuccess?.() }}
            onBatal={mintaTutup}
            onDirtyChange={setKotor}
          />
        </DialogContent>
      </Dialog>
      <KonfirmasiBuang open={konfirmasi} onOpenChange={setKonfirmasi} onBuang={tutup} />
    </>
  )
}
