'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, Section } from '../_components'

export function FormSection() {
  return (
    <section id="form">
      <PageHeader
        title="Form"
        desc="Input, Select, dan Label shadcn. Label selalu terlihat di atas field. Cincin fokus biru. Pesan error ditulis di bawah field dan menjelaskan apa yang harus diperbaiki."
      />

      <Section title="Input dan select" meta="Input, Select">
        <div className="grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ds-nama">Nama obat</Label>
            <Input id="ds-nama" placeholder="Contoh: Paracetamol 500 mg" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ds-kategori">Kategori</Label>
            <Select defaultValue="analgesik">
              <SelectTrigger id="ds-kategori" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="analgesik">Analgesik</SelectItem>
                <SelectItem value="antibiotik">Antibiotik</SelectItem>
                <SelectItem value="vitamin">Vitamin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Dengan ikon" desc="Pencarian: ikon di kiri, padding kiri disesuaikan.">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Cari obat" placeholder="Cari nama atau kode obat" className="pl-8" />
        </div>
      </Section>

      <Section title="Keadaan" desc="Error memakai aria-invalid dan pesan di bawah field. Field nonaktif dikurangi kontrasnya.">
        <div className="grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ds-stok">Stok awal</Label>
            <Input id="ds-stok" defaultValue="-5" aria-invalid aria-describedby="ds-stok-err" />
            <p id="ds-stok-err" className="text-sm text-destructive">Stok tidak boleh negatif.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ds-kode">Kode obat</Label>
            <Input id="ds-kode" defaultValue="OBT-011" disabled />
            <p className="text-sm text-muted-foreground">Dibuat otomatis, tidak bisa diubah.</p>
          </div>
        </div>
      </Section>
    </section>
  )
}
