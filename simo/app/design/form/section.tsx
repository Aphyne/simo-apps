'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { FormActions, FormSection as BagianForm } from '@/components/shared/FormParts'
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

      <Section
        title="Field: label, hint, error"
        desc="Pola form multi-isian. Field memasangkan label, kontrol, hint, dan error. Input dan Select setinggi 40px, radius xl. Hint tertulis di bawah field (bukan tooltip) dan diganti pesan error saat gagal. Error berperan alert dan dihubungkan lewat aria-describedby. Tanda wajib: bintang untuk mata, kata wajib untuk pembaca layar."
        meta="Field, FieldLabel, FieldDescription, FieldError"
      >
        <FieldGroup className="grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="ds-f-nama">
              Nama obat <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(wajib)</span>
            </FieldLabel>
            <Input id="ds-f-nama" placeholder="Contoh: Paracetamol 500mg" aria-required="true" className="h-10 rounded-xl" />
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-f-dus">Isi per dus</FieldLabel>
            <Input id="ds-f-dus" type="number" defaultValue={100} aria-describedby="ds-f-dus-hint" className="h-10 rounded-xl tabular-nums" />
            <FieldDescription id="ds-f-dus-hint">Jumlah tablet dalam satu dus. Contoh: satu dus berisi 100 tablet, isi 100.</FieldDescription>
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor="ds-f-satuan">Satuan terkecil</FieldLabel>
            <Select>
              <SelectTrigger id="ds-f-satuan" aria-invalid aria-describedby="ds-f-satuan-err" className="h-10 w-full rounded-xl data-[size=default]:h-10">
                <SelectValue placeholder="Pilih satuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tablet">tablet</SelectItem>
                <SelectItem value="botol">botol</SelectItem>
              </SelectContent>
            </Select>
            <FieldError id="ds-f-satuan-err">Satuan wajib dipilih</FieldError>
          </Field>
        </FieldGroup>
      </Section>

      <Section
        title="Bagian form dan bilah aksi"
        desc="Form satu bagian tidak diberi judul bagian (judul halaman sudah cukup) dan tidak diberi nomor. Form dengan beberapa bagian memakai FormSection: judul text-15 semibold dan satu kalimat keterangan. Bilah aksi di kaki: garis tipis, Batal outline lalu aksi utama biru di kanan; di layar sempit bertumpuk dengan aksi utama di atas."
        meta="FormSection, FormActions"
      >
        <div className="max-w-2xl space-y-6">
          <BagianForm title="Harga" description="Dipakai untuk menghitung nilai stok dan pendapatan.">
            <Field>
              <FieldLabel htmlFor="ds-f-harga">Harga jual per tablet</FieldLabel>
              <Input id="ds-f-harga" inputMode="numeric" defaultValue="1800" className="h-10 rounded-xl tabular-nums" />
            </Field>
          </BagianForm>
          <FormActions>
            <Button type="button" variant="outline" className="h-10 rounded-xl px-4">Batal</Button>
            <Button type="button" className="h-10 min-w-32 rounded-xl px-4">Simpan perubahan</Button>
          </FormActions>
        </div>
      </Section>
    </section>
  )
}
