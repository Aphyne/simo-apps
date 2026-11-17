import type { ReactNode } from 'react'
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

// Satu bagian form. Pakai hanya bila form punya lebih dari satu bagian; form satu bagian
// cukup FieldGroup tanpa judul (judul halaman sudah menjelaskan isinya).
// Judul bagian: huruf biasa, tanpa nomor (isi form bukan urutan langkah).
export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <FieldSet className={cn('gap-5', className)}>
      <div>
        <FieldLegend className="mb-0 text-[15px] font-semibold text-foreground">{title}</FieldLegend>
        {description && <FieldDescription className="mt-1">{description}</FieldDescription>}
      </div>
      <FieldGroup>{children}</FieldGroup>
    </FieldSet>
  )
}

// Bilah aksi di kaki form: garis tipis di atas, Batal (outline) lalu aksi utama (biru) di kanan.
// Di layar sempit tombol bertumpuk dengan aksi utama di atas.
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-end', className)}>
      {children}
    </div>
  )
}

// Tanda wajib: bintang merah untuk mata, "(wajib)" untuk pembaca layar. Pasangkan dengan satu baris
// keterangan "* Wajib diisi" di atas form; kolom yang boleh kosong ditulis "(opsional)" di labelnya.
export function Wajib() {
  return (
    <>
      <span className="text-destructive" aria-hidden="true">*</span>
      <span className="sr-only">(wajib)</span>
    </>
  )
}

export function Opsional() {
  return <span className="font-normal text-muted-foreground">(opsional)</span>
}

// Input dengan awalan ("Rp") atau akhiran ("%") di dalam kotak, supaya satuan tidak ikut terketik.
// Awalan dan akhiran bersifat dekoratif; sebut satuannya di label atau hint untuk pembaca layar.
export function InputSatuan({
  awalan,
  akhiran,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { awalan?: string; akhiran?: string }) {
  return (
    <div className="relative">
      {awalan && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">
          {awalan}
        </span>
      )}
      <Input
        className={cn('h-10 rounded-xl tabular-nums', awalan && 'pl-10', akhiran && 'pr-9', className)}
        onWheel={(e) => e.currentTarget.blur()}
        onFocus={(e) => e.currentTarget.select()}
        {...props}
      />
      {akhiran && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">
          {akhiran}
        </span>
      )}
    </div>
  )
}
