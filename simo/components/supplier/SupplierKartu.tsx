'use client'

import Link from 'next/link'
import { MessageCircle, Pencil, Phone, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import IconAction from '@/components/shared/IconAction'
import BarisKontak from '@/components/supplier/BarisKontak'
import { normalisasiWa } from '@/lib/reorder'
import { formatRupiah } from '@/lib/utils'
import type { Supplier } from '@/types/supplier'

const MAKS_CHIP = 3
// Awalan badan usaha dilewati saat mengambil huruf awal ("PT Kimia Farma" menjadi KF, bukan PK).
const AWALAN_USAHA = new Set(['pt', 'pbf', 'cv', 'ud', 'tbk', 'apotek'])

// Dua huruf awal untuk monogram. Dekoratif: nama lengkap selalu tertulis di sebelahnya.
export function inisialSupplier(nama: string): string {
  const kata = nama.split(/[^A-Za-z0-9]+/).filter(Boolean)
  const inti = kata.filter((k) => !AWALAN_USAHA.has(k.toLowerCase()))
  const sumber = inti.length > 0 ? inti : kata
  if (sumber.length >= 2) return (sumber[0][0] + sumber[1][0]).toUpperCase()
  return (sumber[0] ?? nama).slice(0, 2).toUpperCase()
}

// "Antibiotik, analgesik" menjadi larik jenis. Kosong berarti belum diisi.
function pecahJenis(jenis: string | null): string[] {
  return (jenis ?? '').split(',').map((j) => j.trim()).filter(Boolean)
}

interface Props {
  supplier: Supplier
  // Alamat halaman ubah (sudah membawa ?dari= ke daftar ini).
  hrefUbah: string
  sedangDihapus: boolean
  onHapus: () => void
}

// Satu kartu per supplier: putih datar di atas kanvas (tanpa garis dan bayangan, DESIGN.md 4.2). Urutan isi mengikuti
// yang dicari pengguna: siapa dan di mana, dua angka pokok untuk perbandingan (selalu di posisi yang sama antar kartu),
// kontak, jenis obat, lalu aksi. WhatsApp berupa tombol outline: satu tombol biru per tampilan hanya untuk "Tambah supplier".
export default function KartuSupplier({ supplier: s, hrefUbah, sedangDihapus, onHapus }: Props) {
  const linkWa = normalisasiWa(s.whatsapp)
  const biaya = Number(s.biaya_pesan)
  const jenis = pecahJenis(s.jenis_obat)
  const tampilJenis = jenis.slice(0, MAKS_CHIP)
  const sisaJenis = jenis.slice(MAKS_CHIP)

  return (
    <article aria-label={s.nama} className="flex flex-col gap-4 rounded-2xl bg-card p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground">
          {inisialSupplier(s.nama)}
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-foreground">
            <Link href={hrefUbah} className="rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{s.nama}</Link>
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{s.alamat || 'Alamat belum diisi'}</p>
        </div>
      </div>

      {/* Dua angka pokok yang dibandingkan antar supplier: lead time dan biaya pesan (masukan ROP dan EOQ). */}
      <dl className="grid grid-cols-2 divide-x divide-border">
        <div className="pr-4">
          <dt className="text-xs text-muted-foreground">Lead time</dt>
          <dd className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
            {s.lead_time_avg}<span className="text-sm font-normal text-muted-foreground"> hari</span>
          </dd>
        </div>
        <div className="pl-4">
          <dt className="text-xs text-muted-foreground">Biaya pesan</dt>
          <dd className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
            {biaya > 0 ? formatRupiah(biaya) : <span className="text-sm font-normal text-muted-foreground">Belum diisi</span>}
          </dd>
        </div>
      </dl>

      <div className="space-y-1 text-sm">
        <BarisKontak ikon={Phone} nilai={s.telepon} kosong="Telepon belum diisi" />
        <BarisKontak ikon={MessageCircle} nilai={s.whatsapp} kosong="WhatsApp belum diisi" peringatan />
      </div>

      {tampilJenis.length > 0 ? (
        <div role="group" className="flex flex-wrap gap-1.5" aria-label="Jenis obat yang disuplai">
          {tampilJenis.map((j) => <Badge key={j} variant="secondary">{j}</Badge>)}
          {sisaJenis.length > 0 && (
            <Badge variant="outline" title={sisaJenis.join(', ')}>
              +{sisaJenis.length}
              <span className="sr-only"> jenis lain: {sisaJenis.join(', ')}</span>
            </Badge>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Jenis obat belum diisi</p>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
        {linkWa && (
          <Button variant="outline" size="lg" className="h-10 rounded-xl px-3" asChild>
            <a href={`https://wa.me/${linkWa}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle data-icon="inline-start" />
              WhatsApp<span className="sr-only"> {s.nama} (buka di tab baru)</span>
            </a>
          </Button>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <IconAction label={`Ubah ${s.nama}`} asChild>
            <Link href={hrefUbah}><Pencil /></Link>
          </IconAction>
          <ConfirmDialog
            trigger={
              <IconAction label={`Hapus ${s.nama}`} disabled={sedangDihapus} className="text-destructive hover:text-destructive">
                <Trash2 />
              </IconAction>
            }
            title={`Hapus ${s.nama}?`}
            description="Supplier yang masih dipakai oleh obat tidak bisa dihapus."
            onConfirm={onHapus}
            loading={sedangDihapus}
          />
        </div>
      </div>
    </article>
  )
}

// Kerangka pemuatan berbentuk kartu: bagian dan tinggi sama dengan kartu asli supaya halaman tidak melompat.
export function KartuSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5" aria-hidden="true">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="ml-auto h-10 w-20 rounded-xl" />
      </div>
    </div>
  )
}
