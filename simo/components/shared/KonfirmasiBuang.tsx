'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Dipanggil saat pengguna memilih membuang isian dan meninggalkan halaman.
  onBuang: () => void
}

// Satu dialog untuk semua jalan keluar dari form yang sudah diubah (Batal dan Kembali), supaya
// tidak ada jalan keluar yang diam-diam membuang isian.
export default function KonfirmasiBuang({ open, onOpenChange, onBuang }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Buang isian ini?</AlertDialogTitle>
          <AlertDialogDescription>Perubahan yang belum disimpan akan hilang.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Lanjut mengisi</AlertDialogCancel>
          <AlertDialogAction onClick={onBuang}>Buang isian</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
