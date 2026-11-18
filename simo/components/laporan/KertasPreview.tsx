// Lembar kertas pratinjau di dialog Preview. Susunan mengikuti PDF yang diunduh (lib/export.ts): kop apotek dengan
// logo di kiri, judul, keterangan filter, tanggal cetak, tabel datar, "Total N baris data"; lebar 210mm (A4).
// Tampilan di sini memakai design system v2 (Figtree); PDF memakai Helvetica karena font standar PDF.
import type { ReactNode } from 'react'
import { LOGO_APOTEK_SRC } from '@/lib/logoApotek'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type Sel = string | number

// Angka dan rupiah rata kanan; teks rata kiri.
const angka = (c: Sel) => typeof c === 'number' || /^(Rp\s?)?-?[\d.,]+$/.test(String(c).trim())

interface TabelKertasProps {
  kolom: string[]
  baris: Sel[][]
  footerBaris?: Sel[][]
  // Lebar kolom tetap (mis. Kartu Stok). Tanpa ini lebar kolom menyesuaikan isi.
  lebar?: string[]
}

function TabelKertas({ kolom, baris, footerBaris, lebar }: TabelKertasProps) {
  // Kolom dianggap angka bila semua isi barisnya angka (kepala ikut rata kanan).
  const kanan = kolom.map((_, ci) => baris.length > 0 && baris.every((r) => angka(r[ci] ?? '') || String(r[ci] ?? '').trim() === '-'))
  return (
    <Table className={cn('mt-4 text-[11px]', lebar && 'table-fixed')}>
      {lebar && (
        <colgroup>
          {lebar.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
      )}
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {kolom.map((h, i) => (
            <TableHead key={i} className={cn('h-8 whitespace-normal px-2 text-[10px] font-medium text-muted-foreground first:pl-0 last:pr-0', kanan[i] && 'text-right')}>
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {baris.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={kolom.length} className="py-6 text-center text-muted-foreground">Tidak ada data</TableCell>
          </TableRow>
        ) : baris.map((row, ri) => (
          <TableRow key={ri} className="hover:bg-transparent">
            {row.map((cell, ci) => (
              <TableCell key={ci} className={cn('whitespace-normal break-words px-2 py-1.5 tabular-nums text-foreground first:pl-0 last:pr-0', kanan[ci] && 'text-right')}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      {footerBaris && footerBaris.length > 0 && (
        <TableFooter>
          {footerBaris.map((row, ri) => (
            <TableRow key={ri} className="hover:bg-transparent">
              {row.map((cell, ci) => (
                <TableCell key={ci} className={cn('whitespace-pre-wrap break-words px-2 py-1.5 font-semibold tabular-nums text-foreground first:pl-2 last:pr-2', kanan[ci] && 'text-right')}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableFooter>
      )}
    </Table>
  )
}

interface KertasLaporanProps {
  judul: string
  keterangan?: string
  namaApotek: string
  alamatApotek: string
  kolom: string[]
  baris: Sel[][]
  footerBaris?: Sel[][]
}

// Kop: logo kecil lepas di pojok kiri-atas, nama apotek + garis + alamat center berurutan ke bawah, judul laporan
// center, lalu keterangan filter + tanggal cetak rata kiri.
export function KertasLaporan({ judul, keterangan, namaApotek, alamatApotek, kolom, baris, footerBaris }: KertasLaporanProps) {
  const tgl = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  return (
    <Kertas>
      <KopApotek nama={namaApotek} alamat={alamatApotek} />
      <div className="mt-4 text-center text-base font-semibold uppercase text-foreground">{judul}</div>

      <div className="mt-4 text-sm text-muted-foreground">
        {keterangan && <div>{keterangan}</div>}
        <div>Dicetak: {tgl}</div>
      </div>
      <TabelKertas kolom={kolom} baris={baris} footerBaris={footerBaris} />
      <div className="mt-4 text-right text-xs text-muted-foreground">Total {baris.length} baris data</div>
    </Kertas>
  )
}

interface KertasKartuStokProps {
  info: { namaApotek: string; alamatApotek: string; kodeObat: string; namaObat: string; kemasan: string; satuan: string; tanggalFilter: string }
  kolom: string[]
  baris: Sel[][]
}

// Kartu Stok: kop yang sama, lalu info obat rata kiri. Lebar kolom proporsional: Tanggal/Masuk/Keluar/Sisa/Expired
// sempit (isinya pendek), Keterangan dan Dicatat Oleh lebih lebar dan boleh wrap.
export function KertasKartuStok({ info, kolom, baris }: KertasKartuStokProps) {
  const baris2 = [
    ['Kode Obat', info.kodeObat],
    ['Nama Obat', info.namaObat],
    ['Kemasan', info.kemasan],
    ['Satuan', info.satuan],
    ['Tanggal', info.tanggalFilter],
  ]
  return (
    <Kertas>
      <KopApotek nama={info.namaApotek} alamat={info.alamatApotek} />
      <div className="mt-4 text-center text-base font-semibold text-foreground">KARTU STOK</div>

      <div className="mt-4 space-y-1 text-sm">
        {baris2.map(([label, nilai]) => (
          <div key={label} className="flex">
            <span className="w-28 text-muted-foreground">{label}</span>
            <span className="text-foreground">: {nilai}</span>
          </div>
        ))}
      </div>

      <TabelKertas kolom={kolom} baris={baris} lebar={['14%', '22%', '8%', '8%', '8%', '14%', '26%']} />
      <div className="mt-4 text-right text-xs text-muted-foreground">Total {baris.length} baris data</div>
    </Kertas>
  )
}

// Kop: logo apotek di kiri, nama dan alamat center, garis tipis di bawahnya.
function KopApotek({ nama, alamat }: { nama: string; alamat: string }) {
  return (
    <div>
      <div className="relative flex min-h-14 flex-col justify-center text-center">
        {/* <img> biasa (bukan next/image): logo apotek harus langsung berganti saat berkasnya diganti, tanpa cache pengoptimal gambar. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_APOTEK_SRC} alt="" width={56} height={56} className="absolute left-0 top-0 size-14" />
        <div className="text-lg font-semibold uppercase tracking-tight text-foreground">{nama}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{alamat}</div>
      </div>
      <div className="mt-3 border-t border-border" />
    </div>
  )
}

function Kertas({ children }: { children: ReactNode }) {
  // Lebar ~210mm (A4 portrait) supaya proporsinya sama dengan halaman yang dicetak.
  return (
    <div className="mx-auto rounded-xl bg-card px-10 py-8" style={{ width: '210mm' }}>
      {children}
    </div>
  )
}
