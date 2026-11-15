import type { ReactNode } from 'react'
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
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
