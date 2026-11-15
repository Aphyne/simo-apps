'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RefreshCw, Pencil, Lock, Package, Hourglass, Target, SearchX, TriangleAlert, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import StatusBadge from '@/components/ui/StatusBadge'
import RumusDisplay from '@/components/obat/RumusDisplay'
import ObatBatchSummary from '@/components/obat/ObatBatchSummary'
import Panel from '@/components/dashboard/Panel'
import { StatTile } from '@/components/dashboard/StatTile'
import PageHeader from '@/components/shared/PageHeader'
import StateMessage from '@/components/shared/StateMessage'
import { Fact, FactList } from '@/components/shared/FactList'
import { useObatById, useObatPerhitungan, useHitungUlang } from '@/hooks/useObat'
import { useAuthStore } from '@/store/auth.store'
import { denganAsal } from '@/components/shared/useAsalHalaman'
import { formatRupiah, formatTanggal, formatAngka } from '@/lib/utils'
import type { Obat } from '@/types/obat'

// Nilai yang belum terisi tidak boleh tampil sebagai angka nol yang tampak sah.
const BELUM_DIISI = <span className="font-normal text-muted-foreground">Belum diisi</span>
const rupiahAtauBelum = (n: number | null | undefined) => (n && n > 0 ? formatRupiah(n) : BELUM_DIISI)

// Kalimat HANYA memuat tindakan; angkanya sudah ada di ubin di bawahnya, jadi tidak diulang.
// Obat yang aman tidak butuh kalimat (badge "Aman" sudah cukup), maka mengembalikan null.
// Stok habis diperiksa lebih dulu: tidak bergantung pada ROP.
function kalimatAksi(obat: Obat): string | null {
  const rop = obat.rop === null || obat.rop === undefined ? 0 : Number(obat.rop)
  // Jumlah pesanan dibulatkan KE ATAS (barang tidak bisa dipesan pecahan); angka persis ada di panel perhitungan.
  const saran = obat.eoq ? ` Disarankan pesan sekitar ${formatAngka(Math.ceil(Number(obat.eoq)), 0)} ${obat.satuan}.` : ''
  if (obat.stok <= 0) return `Stok habis, segera pesan.${saran}`
  if (!(rop > 0)) return 'Titik pesan ulang belum bisa dihitung, jadi status stok belum bisa dinilai.'
  if (obat.status === 'HARUS_REORDER') return `Stok sudah di bawah titik pesan ulang, saatnya memesan.${saran}`
  if (obat.status === 'MENDEKATI_ROP') return 'Stok mendekati titik pesan ulang, siapkan pemesanan.'
  return null
}

export default function DetailObatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const { data: obat, isLoading: loadingObat, isError, refetch } = useObatById(id)
  const { data: perhitungan, isLoading: loadingCalc } = useObatPerhitungan(id, isAdmin)
  const hitungUlang = useHitungUlang()

  if (loadingObat) {
    return (
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4" aria-busy="true" aria-label="Memuat detail obat">
        <div className="col-span-12 space-y-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="col-span-6 h-[106px] rounded-2xl sm:col-span-4" />
        <Skeleton className="col-span-6 h-[106px] rounded-2xl sm:col-span-4" />
        <Skeleton className="col-span-12 h-[106px] rounded-2xl sm:col-span-4" />
        <Skeleton className="col-span-12 h-28 rounded-2xl" />
        <Skeleton className="col-span-12 h-48 rounded-2xl" />
      </div>
    )
  }

  // Gagal memuat dibedakan dari "tidak ditemukan": yang pertama bukan berarti obatnya tidak ada.
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl bg-card">
        <StateMessage
          icon={TriangleAlert}
          title="Data obat belum bisa dimuat"
          description="Ini bukan berarti obatnya tidak ada. Periksa koneksi, lalu coba lagi."
          action={<Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={() => refetch()}>Coba lagi</Button>}
        />
      </div>
    )
  }

  if (!obat) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl bg-card">
        <StateMessage
          icon={SearchX}
          title="Obat tidak ditemukan"
          description="Obat ini mungkin sudah dihapus. Kembali ke daftar untuk memilih obat lain."
          action={<Button variant="outline" className="h-10 rounded-xl px-4" onClick={() => router.back()}>Kembali</Button>}
        />
      </div>
    )
  }

  // Kolom numeric Postgres tiba sebagai teks ("1.95"), jadi diubah ke angka dulu.
  const ropAda = obat.rop !== null && obat.rop !== undefined && Number(obat.rop) > 0
  const habis = obat.stok <= 0
  const perluPesan = habis || obat.status === 'HARUS_REORDER'
  // Rincian: harga dan biaya terisi dari Barang masuk, lama pengiriman dari Supplier.
  const adaYangKosong = !(obat.harga_beli > 0) || !(obat.harga_jual > 0) || !(obat.lead_time > 0) || !obat.nama_supplier

  const tombolUbah = (
    <Button variant={perluPesan ? 'outline' : 'default'} size="lg" className="h-10 rounded-xl px-4" asChild>
      <Link href={denganAsal(`/obat/${id}/edit`, `/obat/${id}/detail`)}>
        <Pencil data-icon="inline-start" />
        Ubah data
      </Link>
    </Button>
  )

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">

      {/* ── Kepala: nama, kode, kategori, status, kalimat tindakan ─────────── */}
      {/* Satu tombol biru: bila perlu dipesan, jalan ke halaman Reorder (khusus admin); bila tidak, Ubah data. */}
      <PageHeader
        className="col-span-12"
        title={obat.nama}
        backLabel="Kembali ke data obat"
        onBack={() => router.back()}
        meta={
          <>
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground/80">{obat.kode}</span>
            <span>{obat.kategori}</span>
            <StatusBadge status={obat.status} stok={obat.stok} />
          </>
        }
        description={kalimatAksi(obat) ?? undefined}
        actions={
          isAdmin && (
            <>
              {perluPesan && tombolUbah}
              {perluPesan ? (
                <Button size="lg" className="h-10 rounded-xl px-4" asChild>
                  <Link href="/reorder">
                    <ShoppingCart data-icon="inline-start" />
                    Buka Reorder
                  </Link>
                </Button>
              ) : (
                tombolUbah
              )}
            </>
          )
        }
      />

      {/* ── Tiga angka utama, ringkas; stok dan titik pesan berdampingan ───── */}
      <StatTile
        compact
        className="col-span-6 sm:col-span-4"
        label="Stok saat ini"
        value={obat.stok}
        sublabel={obat.satuan}
        icon={Package}
      />
      <StatTile
        compact
        className="col-span-6 sm:col-span-4"
        label="Titik pesan ulang (ROP)"
        value={ropAda ? Number(obat.rop) : null}
        sublabel={ropAda ? obat.satuan : 'belum bisa dihitung'}
        icon={Target}
      />
      <StatTile
        compact
        className="col-span-12 sm:col-span-4"
        label="Estimasi habis"
        value={obat.estimasi_habis_hari ?? null}
        teks={habis ? 'Habis' : undefined}
        sublabel={habis ? '' : obat.estimasi_habis_hari != null ? 'hari lagi' : 'menunggu riwayat penjualan'}
        icon={Hourglass}
      />

      {/* ── Rincian: satu baris penuh ──────────────────────────────────────── */}
      <Panel
        title="Rincian obat"
        className="col-span-12"
        action={
          adaYangKosong ? (
            <span className="text-sm font-normal text-muted-foreground">
              Harga dan biaya terisi dari Barang masuk, lama pengiriman dari Supplier
            </span>
          ) : undefined
        }
      >
        <FactList className="sm:grid-cols-3 lg:grid-cols-6">
          <Fact label={`Harga beli per ${obat.satuan}`}>{rupiahAtauBelum(obat.harga_beli)}</Fact>
          <Fact label={`Harga jual per ${obat.satuan}`}>{rupiahAtauBelum(obat.harga_jual)}</Fact>
          <Fact label="Isi per dus">{obat.satuan_per_dus} {obat.satuan}</Fact>
          <Fact label="Lama pengiriman">{obat.lead_time > 0 ? `${obat.lead_time} hari` : BELUM_DIISI}</Fact>
          <Fact label="Supplier">{obat.nama_supplier ?? BELUM_DIISI}</Fact>
          <Fact label="Expired terdekat">
            {obat.expired_terdekat ? formatTanggal(obat.expired_terdekat) : <span className="font-normal text-muted-foreground">Belum ada</span>}
          </Fact>
        </FactList>
      </Panel>

      {/* ── Perhitungan: untuk admin ───────────────────────────────────────── */}
      {!isAdmin ? (
        <p className="col-span-12 flex items-center gap-2 rounded-2xl bg-card px-5 py-4 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Rincian perhitungan kapan dan berapa harus memesan hanya bisa dilihat oleh admin.
        </p>
      ) : (
        <Panel
          title="Kapan dan berapa harus pesan"
          className="col-span-12"
          action={
            <Button
              variant="outline"
              className="h-10 rounded-xl px-3"
              onClick={() => hitungUlang.mutate(Number(id))}
              disabled={hitungUlang.isPending}
            >
              <RefreshCw data-icon="inline-start" className={hitungUlang.isPending ? 'motion-safe:animate-spin' : ''} />
              {hitungUlang.isPending ? 'Menghitung...' : 'Hitung ulang'}
            </Button>
          }
        >
          {loadingCalc ? (
            <div className="space-y-3" aria-busy="true" aria-label="Memuat perhitungan">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
          ) : perhitungan ? (
            <RumusDisplay data={perhitungan} satuan={obat.satuan} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Perhitungan belum tersedia untuk obat ini. Coba tombol Hitung ulang di kanan atas panel ini.
            </p>
          )}
        </Panel>
      )}

      {/* ── Estimasi sisa per batch ────────────────────────────────────────── */}
      <ObatBatchSummary id={id} className="col-span-12" />

    </div>
  )
}
