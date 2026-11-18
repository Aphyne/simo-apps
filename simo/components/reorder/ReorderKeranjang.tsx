'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, X, Eye, Download, MessageCircle, TriangleAlert, Trash2, Info } from 'lucide-react'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import Panel from '@/components/dashboard/Panel'
import IconAction from '@/components/shared/IconAction'
import StateMessage from '@/components/shared/StateMessage'
import type { ReorderAlertItem } from '@/hooks/useObat'
import {
  buatPesanPengantar,
  kirimPdfViaWa,
  normalisasiWa,
  unduhBlob,
  type IdentitasApotek,
} from '@/lib/reorder'
import { buatPdfSuratPesanan } from '@/lib/reorderPdf'
import { muatLogoApotek } from '@/lib/logoApotek'

export interface ItemKeranjang {
  item: ReorderAlertItem
  jumlah: number
}

interface GrupKeranjang {
  supplierId: number
  nama: string
  whatsapp: string | null
  alamat: string | null
  isi: ItemKeranjang[]
}

interface Props {
  isi: ItemKeranjang[]
  apotek: IdentitasApotek | null
  onUbahJumlah: (id: number, jumlah: number) => void
  onHapus: (id: number) => void
  onKosongkan: () => void
}

// Input jumlah yang boleh dikosongkan sementara saat mengetik (hapus lalu ketik angka baru).
// Nilai ke keranjang hanya diperbarui kalau isinya bilangan bulat >= 1; saat selesai (blur)
// isian yang kosong/tidak valid dikembalikan ke jumlah terakhir yang sah. Selama isian tidak sah, alasannya ditulis.
function InputJumlah({ label, jumlah, onUbah }: { label: string; jumlah: number; onUbah: (n: number) => void }) {
  const [teks, setTeks] = useState<string | null>(null) // null = tidak sedang mengedit
  const tidakSah = teks !== null && !(teks !== '' && Number.isInteger(Number(teks)) && Number(teks) >= 1)

  return (
    <span className="flex flex-col items-end gap-1">
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        aria-label={label}
        aria-invalid={tidakSah || undefined}
        value={teks ?? String(jumlah)}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = e.target.value
          setTeks(v)
          const n = Number(v)
          if (v !== '' && Number.isInteger(n) && n >= 1) onUbah(n)
        }}
        onBlur={() => setTeks(null)}
        className="h-10 w-20 rounded-xl text-right text-sm tabular-nums"
      />
      {tidakSah && <span role="alert" className="text-xs text-destructive">Isi bilangan bulat, minimal 1</span>}
    </span>
  )
}

function kelompokkan(isi: ItemKeranjang[]): GrupKeranjang[] {
  const map = new Map<number, GrupKeranjang>()
  for (const k of isi) {
    const sid = k.item.supplier_id
    if (sid === null) continue
    if (!map.has(sid)) {
      map.set(sid, {
        supplierId: sid,
        nama: k.item.supplier_nama ?? k.item.nama_supplier ?? 'Supplier',
        whatsapp: k.item.supplier_whatsapp,
        alamat: k.item.supplier_alamat,
        isi: [],
      })
    }
    map.get(sid)!.isi.push(k)
  }
  return [...map.values()]
}

export default function ReorderKeranjang({ isi, apotek, onUbahJumlah, onHapus, onKosongkan }: Props) {
  const [sibuk, setSibuk] = useState<number | null>(null)
  const grup = kelompokkan(isi)

  // Logo apotek dimuat sekali di awal supaya pembuatan PDF tetap sinkron (tanpa menunda Lihat/PDF/Kirim).
  const logoRef = useRef<string | null>(null)
  useEffect(() => {
    muatLogoApotek().then((l) => { logoRef.current = l })
  }, [])

  function bikinPdf(g: GrupKeranjang) {
    if (!apotek) {
      toast.error('Identitas apotek belum termuat, coba lagi sebentar')
      return null
    }
    const pdf = buatPdfSuratPesanan({
      apotek,
      supplier: { id: g.supplierId, nama: g.nama, alamat: g.alamat },
      items: g.isi.map((k) => ({ nama: k.item.nama, jumlah: k.jumlah, satuan: k.item.satuan_pesan })),
      logo: logoRef.current,
    })
    return { pdf, apotek }
  }

  function pratinjau(g: GrupKeranjang) {
    const h = bikinPdf(g)
    if (!h) return
    window.open(URL.createObjectURL(h.pdf.blob), '_blank', 'noopener,noreferrer')
  }

  function unduh(g: GrupKeranjang) {
    const h = bikinPdf(g)
    if (!h) return
    unduhBlob(h.pdf.blob, h.pdf.namaFile)
    toast.success('Surat Pesanan PDF diunduh')
  }

  async function kirim(g: GrupKeranjang) {
    const h = bikinPdf(g)
    if (!h) return
    setSibuk(g.supplierId)
    try {
      const hasil = await kirimPdfViaWa({
        blob: h.pdf.blob,
        namaFile: h.pdf.namaFile,
        nomorSupplier: g.whatsapp,
        pesan: buatPesanPengantar({
          apotek: h.apotek,
          supplier: { id: g.supplierId, nama: g.nama },
          jumlahItem: g.isi.length,
          nomor: h.pdf.nomor,
        }),
      })
      if (hasil === 'diunduh') {
        toast.success('PDF terunduh. Lampirkan ke chat WhatsApp yang terbuka (ikon klip, atau tarik file ke chat).', { duration: 8000 })
      }
    } finally {
      setSibuk(null)
    }
  }

  // Mengosongkan dua obat atau lebih meminta konfirmasi (jumlah per obat sudah diatur satu per satu); satu obat langsung.
  const tombolKosongkan = isi.length > 0 && (() => {
    const tombol = (
      <Button variant="ghost" size="lg" className="h-10 rounded-xl px-3 text-muted-foreground" onClick={isi.length >= 2 ? undefined : onKosongkan}>
        <Trash2 data-icon="inline-start" />
        Kosongkan
      </Button>
    )
    if (isi.length < 2) return tombol
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{tombol}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kosongkan keranjang?</AlertDialogTitle>
            <AlertDialogDescription>{isi.length} obat beserta jumlah yang sudah Anda atur akan dikeluarkan dari keranjang.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onKosongkan} className="bg-destructive text-white hover:bg-destructive/90">Kosongkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  })()

  return (
    <div id="keranjang" className="scroll-mt-4 xl:sticky xl:top-4">
      <Panel title="Keranjang reorder" count={isi.length} action={tombolKosongkan || undefined} bodyClassName="px-0 pb-0">
        <div className="xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto">
          {isi.length === 0 && (
            <StateMessage
              icon={ShoppingCart}
              title="Keranjang masih kosong"
              description="Tambahkan obat dari daftar, atau pakai Tambah semua."
              className="border-t border-border"
            />
          )}

          {grup.map((g) => {
            const adaWa = !!normalisasiWa(g.whatsapp)
            const lagiKirim = sibuk === g.supplierId
            return (
              <section key={g.supplierId} className="border-t border-border px-5 py-4" aria-label={`Pesanan untuk ${g.nama}`}>
                <h3 className="text-sm font-semibold text-foreground">{g.nama}</h3>
                {adaWa ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">WhatsApp {g.whatsapp}</p>
                ) : (
                  <p className="mt-2 flex items-start gap-2 rounded-xl bg-warning-50 px-3 py-2 text-xs font-medium text-warning-700">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      Nomor WhatsApp belum diisi, jadi WhatsApp terbuka tanpa tujuan dan Anda memilih kontaknya sendiri.{' '}
                      <Link href="/supplier" target="_blank" rel="noopener" className="underline underline-offset-2">
                        Isi nomor supplier<span className="sr-only"> (buka di tab baru, keranjang tetap tersimpan di tab ini)</span>
                      </Link>
                    </span>
                  </p>
                )}

                <ul className="mt-3 space-y-1">
                  {g.isi.map(({ item, jumlah }) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1">
                      <span className="min-w-0 flex-1 basis-40">
                        <span className="block text-sm font-medium leading-snug text-foreground">{item.nama}</span>
                        <span className="block text-xs text-muted-foreground">Saran sistem: {item.saran_jumlah} {item.satuan_pesan} (dari {item.basis_saran})</span>
                      </span>
                      <span className="ml-auto flex items-center gap-2">
                        <InputJumlah label={`Jumlah pesan ${item.nama}`} jumlah={jumlah} onUbah={(n) => onUbahJumlah(item.id, n)} />
                        <span className="w-10 truncate text-xs text-muted-foreground">{item.satuan_pesan}</span>
                        <IconAction label={`Keluarkan ${item.nama} dari keranjang`} onClick={() => onHapus(item.id)}>
                          <X />
                        </IconAction>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="lg" className="h-10 rounded-xl px-3" onClick={() => pratinjau(g)}>
                    <Eye data-icon="inline-start" />
                    Lihat
                  </Button>
                  <Button variant="outline" size="lg" className="h-10 rounded-xl px-3" onClick={() => unduh(g)}>
                    <Download data-icon="inline-start" />
                    PDF
                  </Button>
                  <Button size="lg" className="h-10 flex-1 rounded-xl px-4" onClick={() => kirim(g)} disabled={lagiKirim}>
                    <MessageCircle data-icon="inline-start" />
                    {lagiKirim ? 'Menyiapkan...' : 'Kirim via WhatsApp'}
                  </Button>
                </div>
              </section>
            )
          })}

          {/* Aturan kepatuhan, tepat di tempat surat disiapkan. Selalu tampil, juga saat keranjang kosong. */}
          <p className="flex items-start gap-2 border-t border-border px-5 py-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Obat prekursor/OOT memakai Surat Pesanan khusus. Jangan dipesan dari sini.
          </p>
        </div>
      </Panel>
    </div>
  )
}
