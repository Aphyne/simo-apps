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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Props {
  trigger: React.ReactNode
  title?: string
  description?: string
  onConfirm: () => void
  loading?: boolean
  // Tulisan tombol aksi dan keadaan memproses; bawaan untuk menghapus.
  confirmLabel?: string
  loadingLabel?: string
}

export default function ConfirmDialog({
  trigger,
  title = 'Hapus Data',
  description = 'Tindakan ini tidak bisa dibatalkan. Data akan dihapus permanen.',
  onConfirm,
  loading,
  confirmLabel = 'Hapus',
  loadingLabel = 'Menghapus...',
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading ? loadingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
