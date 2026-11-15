'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatRupiah, formatAngka } from '@/lib/utils'
import type { DetailPerhitungan, LangkahPerhitungan } from '@/types/obat'

type ModalKey = 'eoq' | 'ss' | 'rop' | 'tc' | null

interface Param {
  label: string
  nilai: string
}

// Daftar parameter: label abu di atas, nilai di bawah. Tanpa kotak per parameter.
function ParamList({ items, className }: { items: Param[]; className?: string }) {
  return (
    <dl className={className ?? 'grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4'}>
      {items.map((p) => (
        <div key={p.label} className="min-w-0">
          <dt className="text-sm text-muted-foreground">{p.label}</dt>
          <dd className="mt-0.5 break-words text-base font-medium tabular-nums text-foreground">{p.nilai}</dd>
        </div>
      ))}
    </dl>
  )
}

// Isi dialog langkah perhitungan: rumus, substitusi, kalkulasi, hasil. Tanpa nomor dan tanpa warna per rumus.
function LangkahDetail({
  langkah, satuan, isRupiah,
}: {
  langkah: LangkahPerhitungan
  satuan?: string
  isRupiah?: boolean
}) {
  const hasilStr =
    langkah.hasil === null ? '-'
    : isRupiah ? formatRupiah(langkah.hasil)
    : `${formatAngka(langkah.hasil, 2)}${satuan ? ` ${satuan}` : ''}`

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Rumus</p>
        <p className="mt-1 break-all rounded-lg bg-muted px-3 py-2 font-mono text-sm text-foreground">{langkah.rumus}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Substitusi</p>
        <p className="mt-1 break-all font-mono text-sm text-foreground">{langkah.substitusi}</p>
      </div>
      {langkah.langkah && (
        <div>
          <p className="text-sm text-muted-foreground">Kalkulasi</p>
          <p className="mt-1 break-all font-mono text-sm text-foreground">{langkah.langkah}</p>
        </div>
      )}
      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">Hasil</p>
        {langkah.hasil !== null ? (
          <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums text-foreground">{hasilStr}</p>
        ) : (
          <p className="mt-0.5 text-sm text-muted-foreground">Belum bisa dihitung dari data yang ada.</p>
        )}
      </div>
      {langkah.catatan && (
        <p className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700">{langkah.catatan}</p>
      )}
    </div>
  )
}

// Satu hasil: nama, angka besar, dan satu tombol teks ke cara menghitungnya. Bila belum bisa dihitung,
// satu kalimat menyebut penyebabnya. Tombol selalu di dasar kolom supaya sejajar antar kolom.
function HasilKolom({
  label, nilai, satuan, isRupiah, onInfo,
}: {
  label: string
  nilai: number | null | undefined
  satuan?: string
  isRupiah?: boolean
  onInfo: () => void
}) {
  const ada = nilai !== null && nilai !== undefined

  return (
    <div className="flex min-w-0 flex-col lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {ada ? (
        <>
          <p className="mt-1 break-words text-3xl font-semibold leading-tight tracking-tight tabular-nums text-foreground">
            {isRupiah ? formatRupiah(nilai) : formatAngka(nilai, 2)}
          </p>
          {satuan && <p className="mt-0.5 text-sm text-muted-foreground">{satuan}</p>}
        </>
      ) : (
        <p className="mt-1 text-lg font-medium leading-tight text-muted-foreground">Belum bisa dihitung</p>
      )}
      <button
        type="button"
        onClick={onInfo}
        aria-label={`Lihat cara menghitung ${label}`}
        className="-ml-2 mt-auto h-10 self-start rounded-lg px-2 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Cara menghitung
      </button>
    </div>
  )
}

// Penyebab hasil kosong, dari parameter yang belum terisi. Biaya pesan dan harga terisi otomatis dari Barang masuk.
function alasanKosong(input: DetailPerhitungan['input']): string | null {
  const kurang: string[] = []
  if (!(input.D > 0)) kurang.push('riwayat penjualan')
  if (!(input.S > 0)) kurang.push('biaya sekali pesan (terisi dari Barang masuk)')
  if (!(input.H > 0)) kurang.push('biaya simpan (terisi dari Barang masuk)')
  return kurang.length ? `Butuh ${kurang.join(', ')}.` : null
}

// ─── Komponen utama ───────────────────────────────────────────────────────────
// `satuan` = satuan obat ("botol"); bila tidak diberikan dipakai "unit".
export default function RumusDisplay({ data, satuan = 'unit' }: { data: DetailPerhitungan; satuan?: string }) {
  const { input, langkah_eoq, langkah_safety_stock, langkah_rop, langkah_tc } = data
  const [openModal, setOpenModal] = useState<ModalKey>(null)
  const alasan = alasanKosong(input)
  const adaKosong = [langkah_eoq.hasil, langkah_safety_stock.hasil, langkah_tc.hasil].some((h) => h === null)

  const pD = { label: 'Penjualan setahun (D)', nilai: `${formatAngka(input.D, 0)} ${satuan}/tahun` }
  const pdHarian = { label: 'Penjualan per hari (d)', nilai: `${formatAngka(input.demand_harian, 2)} ${satuan}/hari` }
  const pSigma = { label: 'Naik turun penjualan (σ)', nilai: `${formatAngka(input.sigma, 4)} ${satuan}/hari` }
  const pS = { label: 'Biaya sekali pesan (S)', nilai: input.S > 0 ? formatRupiah(input.S) : 'Belum diisi' }
  const pH = { label: 'Biaya simpan (H)', nilai: input.H > 0 ? `${formatRupiah(input.H)}/${satuan}/tahun` : 'Belum diisi' }
  const pLT = { label: 'Lama pengiriman (LT)', nilai: input.LT > 0 ? `${input.LT} hari` : 'Belum diisi' }
  const pZ = { label: 'Tingkat layanan (Z)', nilai: formatAngka(Number(input.Z), 2) }

  const cards: {
    key: ModalKey
    label: string
    nilai: number | null
    satuan?: string
    judul: string
    langkah: LangkahPerhitungan
    definisi: string
    isRupiah?: boolean
    params: Param[]
  }[] = [
    {
      key: 'eoq' as ModalKey,
      label: 'Jumlah sekali pesan (EOQ)',
      nilai: langkah_eoq.hasil,
      satuan: `${satuan} per pemesanan`,
      judul: 'Economic Order Quantity (EOQ), jumlah sekali pesan',
      langkah: langkah_eoq,
      definisi: 'Jumlah yang sebaiknya dipesan setiap kali memesan, agar total biaya pemesanan dan biaya penyimpanan per tahun paling hemat.',
      params: [pD, pS, pH],
    },
    {
      key: 'ss' as ModalKey,
      label: 'Stok pengaman',
      nilai: langkah_safety_stock.hasil,
      satuan: `${satuan} cadangan`,
      judul: 'Safety Stock (SS), stok pengaman',
      langkah: langkah_safety_stock,
      definisi: 'Stok cadangan sebagai penyangga bila penjualan tiba-tiba naik atau barang dari supplier terlambat. Semakin besar naik turun penjualan, semakin besar stok pengaman yang dibutuhkan.',
      params: [pZ, pSigma, pLT],
    },
    {
      key: 'rop' as ModalKey,
      label: 'Titik pesan ulang (ROP)',
      nilai: langkah_rop.hasil,
      satuan: satuan,
      judul: 'Reorder Point (ROP), titik pesan ulang',
      langkah: langkah_rop,
      definisi: 'Batas stok minimum. Saat stok tersisa menyentuh angka ini, saatnya memesan ulang supaya stok tidak habis sebelum barang baru tiba.',
      params: [pdHarian, pLT],
    },
    {
      key: 'tc' as ModalKey,
      label: 'Total biaya setahun',
      nilai: langkah_tc.hasil,
      judul: 'Total Cost (TC), total biaya persediaan',
      langkah: langkah_tc,
      isRupiah: true,
      definisi: 'Perkiraan total biaya persediaan per tahun: biaya memesan (berapa kali pesan × biaya sekali pesan) ditambah biaya menyimpan (rata-rata stok × biaya simpan).',
      params: [pD, pS, pH],
    },
  ]

  const activeCard = cards.find((c) => c.key === openModal)

  // Seluruh parameter yang dipakai, ditulis sekali di bawah hasil dan dilipat.
  const semuaParam: Param[] = [pD, pdHarian, pSigma, pS, pH, pLT, pZ]

  return (
    <div className="space-y-5">

      {/* ── Satu blok penyebab bila ada hasil yang belum bisa dihitung (tidak diulang per kolom) ── */}
      {adaKosong && alasan && (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
          <span className="font-medium">Belum bisa dihitung.</span> {alasan}
        </p>
      )}

      {/* ── Tiga hasil, dipisah garis tipis. Titik pesan ulang (ROP) sudah ada di ubin atas, jadi tidak diulang di sini ── */}
      <section aria-label="Hasil perhitungan" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {cards.filter((c) => c.key !== 'rop').map((c) => (
          <HasilKolom
            key={String(c.key)}
            label={c.label}
            nilai={c.nilai}
            satuan={c.satuan}
            isRupiah={c.isRupiah}
            onInfo={() => setOpenModal(c.key)}
          />
        ))}
      </section>
      <button
        type="button"
        onClick={() => setOpenModal('rop')}
        className="-ml-2 h-10 rounded-lg px-2 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Cara menghitung titik pesan ulang (ROP)
      </button>

      {/* ── Parameter yang dipakai: dilipat, karena yang dicari biasanya hasilnya ── */}
      <details className="group border-t pt-4">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-lg py-1 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          Lihat data yang dipakai menghitung
          <ChevronDown className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </summary>
        <div className="pt-4">
          <ParamList items={semuaParam} />
        </div>
      </details>

      {/* ── Dialog cara menghitung ───────────────────────────────────────── */}
      <Dialog open={openModal !== null} onOpenChange={(open) => { if (!open) setOpenModal(null) }}>
        <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto rounded-2xl p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-8 text-base font-semibold">{activeCard?.judul}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">{activeCard?.definisi}</DialogDescription>
          </DialogHeader>

          {activeCard && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Data yang dipakai</h3>
                <ParamList items={activeCard.params} className="grid grid-cols-2 gap-x-6 gap-y-4" />
              </div>
              <div className="border-t pt-5">
                <LangkahDetail langkah={activeCard.langkah} satuan={activeCard.satuan} isRupiah={activeCard.isRupiah} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
