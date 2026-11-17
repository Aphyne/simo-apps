'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Fact, FactList } from '@/components/shared/FactList'
import { nilaiPenjualan } from '@/lib/barangKeluar'
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/utils'
import type { BarangKeluar } from '@/types/obat'

const BELUM_DIISI = <span className="font-normal text-muted-foreground">Belum diisi</span>

interface Props {
  item: BarangKeluar | null
  onClose: () => void
}

// Rincian satu baris stok keluar, termasuk catatan. Hanya dibaca; ubah dan hapus ada di baris tabel (admin).
export default function BarangKeluarDetailDialog({ item, onClose }: Props) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-xl">
        {item && <Isi item={item} />}
      </DialogContent>
    </Dialog>
  )
}

function Isi({ item }: { item: BarangKeluar }) {
  const penjualan = item.keterangan === 'Penjualan'
  const nilai = nilaiPenjualan(item)
  return (
    <>
      <DialogHeader className="gap-1.5 pr-8">
        <DialogTitle className="text-lg font-semibold">{item.nama_obat}</DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">{item.kode_obat}</span>
          <span>Stok keluar {formatTanggal(item.tanggal)}</span>
        </DialogDescription>
      </DialogHeader>

      <FactList>
        <Fact label="Jumlah keluar">{formatAngka(item.jumlah, 0)} {item.satuan}</Fact>
        <Fact label="Keterangan">
          <Badge variant={penjualan ? 'secondary' : 'outline'}>{item.keterangan}</Badge>
        </Fact>
        <Fact label="Stok berubah">
          {formatAngka(item.stok_sebelum, 0)} <span aria-hidden="true">→</span><span className="sr-only"> menjadi </span> {formatAngka(item.stok_sesudah, 0)}
          <span className="block text-sm font-normal text-muted-foreground">{item.satuan}</span>
        </Fact>
        <Fact label="Dicatat oleh">{item.nama_user}</Fact>
        {penjualan && (
          <>
            <Fact label={`Harga jual per ${item.satuan}`}>{Number(item.harga_jual) > 0 ? formatRupiah(Number(item.harga_jual)) : BELUM_DIISI}</Fact>
            <Fact label="Total penjualan"><span className="font-semibold">{nilai !== null ? formatRupiah(nilai) : BELUM_DIISI}</span></Fact>
          </>
        )}
        <Fact label="Catatan" className="col-span-2">{item.catatan || null}</Fact>
      </FactList>
    </>
  )
}
