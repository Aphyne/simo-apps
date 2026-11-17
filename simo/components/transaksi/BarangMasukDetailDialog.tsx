'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Fact, FactList } from '@/components/shared/FactList'
import ExpiredCell from '@/components/shared/ExpiredCell'
import JatuhTempoCell from '@/components/transaksi/JatuhTempoCell'
import { isRiwayatFaktur } from '@/lib/barangMasuk'
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/utils'
import type { BarangMasuk } from '@/types/obat'

const BELUM_DIISI = <span className="font-normal text-muted-foreground">Belum diisi</span>

interface Props {
  item: BarangMasuk | null
  onClose: () => void
}

// Rincian satu baris stok masuk. Hanya dibaca; mengubah atau menghapus ada di baris tabel (admin).
export default function BarangMasukDetailDialog({ item, onClose }: Props) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-xl">
        {item && <Isi item={item} />}
      </DialogContent>
    </Dialog>
  )
}

function Isi({ item }: { item: BarangMasuk }) {
  const ppnPct = Number(item.ppn_pct) || 0
  const spd = item.jumlah_dus > 0 ? item.jumlah_satuan / item.jumlah_dus : 1
  const adaHarga = item.harga_beli != null
  const hargaDusSesudah = adaHarga ? (item.harga_beli as number) * spd : 0
  const hargaDusSebelum = hargaDusSesudah / (1 + ppnPct / 100)
  const subSesudah = adaHarga ? (item.harga_beli as number) * item.jumlah_satuan : 0
  const subSebelum = subSesudah / (1 + ppnPct / 100)

  return (
    <>
      <DialogHeader className="gap-1.5 pr-8">
        <DialogTitle className="text-lg font-semibold">{item.nama_obat}</DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">{item.kode_obat}</span>
          <span>Stok masuk {formatTanggal(item.tanggal)}</span>
        </DialogDescription>
      </DialogHeader>

      <FactList>
        <Fact label="Jumlah masuk">
          {formatAngka(item.jumlah_satuan, 0)} {item.satuan}
          <span className="block text-sm font-normal text-muted-foreground">{formatAngka(Number(item.jumlah_dus), 2)} dus</span>
        </Fact>
        <Fact label="Stok berubah">
          {isRiwayatFaktur(item) ? (
            <>Tidak berubah<span className="block text-sm font-normal text-muted-foreground">Riwayat faktur: stok sudah termasuk barang ini</span></>
          ) : (
            <>
              {formatAngka(item.stok_sebelum, 0)} <span aria-hidden="true">→</span><span className="sr-only"> menjadi </span> {formatAngka(item.stok_sesudah, 0)}
              <span className="block text-sm font-normal text-muted-foreground">{item.satuan}</span>
            </>
          )}
        </Fact>
        <Fact label="No. faktur">{item.no_faktur}</Fact>
        <Fact label="Supplier">{item.nama_supplier}</Fact>
        <Fact label="No. batch">{item.no_batch ? <span className="font-mono text-sm">{item.no_batch}</span> : null}</Fact>
        <Fact label="Tanggal expired"><ExpiredCell tanggal={item.expired_batch} /></Fact>
        <Fact label={`Harga jual per ${item.satuan}`}>{item.harga_jual != null ? formatRupiah(item.harga_jual) : BELUM_DIISI}</Fact>
        <Fact label="Jatuh tempo faktur"><JatuhTempoCell tanggal={item.jatuh_tempo} /></Fact>
        <Fact label="Dicatat oleh">{item.nama_user}</Fact>
        {item.catatan && <Fact label="Catatan" className="col-span-2">{item.catatan}</Fact>}
      </FactList>

      <section aria-labelledby="harga-judul" className="border-t pt-5">
        <h3 id="harga-judul" className="text-[15px] font-semibold text-foreground">
          Harga beli {ppnPct > 0 ? `(PPN ${formatAngka(ppnPct, 2)}%)` : '(tanpa PPN)'}
        </h3>
        {adaHarga ? (
          <FactList className="mt-4">
            <Fact label="Per dus, sebelum PPN">{formatRupiah(hargaDusSebelum)}</Fact>
            <Fact label="Per dus, sesudah PPN">{formatRupiah(hargaDusSesudah)}</Fact>
            <Fact label="Subtotal sebelum PPN">{formatRupiah(subSebelum)}</Fact>
            <Fact label="Subtotal sesudah PPN"><span className="font-semibold">{formatRupiah(subSesudah)}</span></Fact>
          </FactList>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Harga beli belum diisi untuk baris ini, jadi subtotal belum bisa dihitung.</p>
        )}
      </section>
    </>
  )
}
