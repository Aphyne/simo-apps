'use client'

import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader, Section } from '../_components'

export function OverlaySection() {
  return (
    <section id="overlay">
      <PageHeader
        title="Overlay"
        desc="Dialog untuk form yang butuh fokus, AlertDialog untuk konfirmasi aksi yang menghapus. Pakai dialog hanya bila isian di tempat atau panel terbuka tidak cukup."
      />

      <Section title="Dialog form" desc="Klik untuk membuka. Judul menyebut aksinya, tombol utama memakai kata kerja yang sama." meta="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Reset password</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Reset password</DialogTitle>
              <DialogDescription>Atur password baru untuk Staf Apotek.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="ds-pw">Password baru</Label>
              <Input id="ds-pw" type="password" placeholder="Minimal 6 karakter" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Batal</Button>
              </DialogClose>
              <Button>Reset password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Konfirmasi hapus" desc="Menjelaskan akibatnya, bukan hanya bertanya Apakah Anda yakin." meta="AlertDialog">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Hapus supplier</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus supplier?</AlertDialogTitle>
              <AlertDialogDescription>Supplier yang masih dipakai oleh obat tidak bisa dihapus.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline">Batal</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive">Hapus</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Section>
    </section>
  )
}
