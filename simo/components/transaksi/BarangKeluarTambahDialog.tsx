'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import BarangKeluarForm from '@/components/transaksi/BarangKeluarForm'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Dipanggil setelah stok keluar tersimpan (dialog sudah ditutup).
  onSuccess?: () => void
}

// Dialog "Catat stok keluar", dipakai di halaman Stok keluar dan Dashboard. Menutupnya (Batal, Esc, X, klik di luar)
// meminta konfirmasi bila isian sudah diubah, karena satu catatan bisa berisi banyak obat.
export default function BarangKeluarTambahDialog({ open, onOpenChange, onSuccess }: Props) {
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
        <DialogContent
          className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-2xl"
          // Kasir langsung mengetik obat: fokus awal ke kolom Obat, bukan ke tombol tutup.
          onOpenAutoFocus={(e) => { e.preventDefault(); document.getElementById('obat-keluar')?.focus() }}
        >
          <DialogHeader className="gap-1.5 pr-8">
            <DialogTitle className="text-lg font-semibold">Catat stok keluar</DialogTitle>
            <DialogDescription>Catat obat yang keluar karena dijual, diretur, rusak, atau kedaluarsa. Stok berkurang setelah disimpan.</DialogDescription>
          </DialogHeader>
          <BarangKeluarForm
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
