import type { ReorderAlertItem } from '@/hooks/useObat'

// Urutan keparahan obat yang perlu dipesan (DESIGN.md 4.3): Habis dahulu, lalu rasio stok/ROP terkecil, lalu ROP terbesar.
// Dipakai halaman Reorder dan notifikasi lonceng di header supaya keduanya mengurutkan dengan cara yang sama.
export function urutKeparahan(a: ReorderAlertItem, b: ReorderAlertItem): number {
  const rasio = (it: ReorderAlertItem) => (Number(it.rop) > 0 ? it.stok / Number(it.rop) : Infinity)
  return (Number(a.stok > 0) - Number(b.stok > 0)) || (rasio(a) - rasio(b)) || (Number(b.rop) - Number(a.rop))
}
