import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatAngka(value: number | null | undefined, desimal = 2): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: desimal,
  }).format(value)
}

export function formatTanggal(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: id })
  } catch {
    return '-'
  }
}

export function formatTanggalPendek(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: id })
  } catch {
    return '-'
  }
}

export function formatTanggalInput(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export function generateKodeObat(nomor: number): string {
  return `OBT-${String(nomor).padStart(3, '0')}`
}
