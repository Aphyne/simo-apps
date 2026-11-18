'use client'

import { useEffect, useState } from 'react'
import { useForm, useWatch, Controller, type FieldErrors } from 'react-hook-form'
import { Pencil, Trash2, TriangleAlert, PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ObatCombobox from '@/components/ui/ObatCombobox'
import IconAction from '@/components/shared/IconAction'
import { FormActions, FormSection, InputSatuan, Opsional, Wajib } from '@/components/shared/FormParts'
import { useCreateBarangKeluarBulk } from '@/hooks/useBarangKeluar'
import { useObatSemua } from '@/hooks/useObat'
import { KETERANGAN_KELUAR, tanggalLokal } from '@/lib/barangKeluar'
import { formatAngka, formatRupiah } from '@/lib/utils'
import type { Obat } from '@/types/obat'

interface Props {
  onSuccess: () => void
  // Tombol Batal. Induk menentukan apakah perlu konfirmasi membuang isian (lihat onDirtyChange).
  onBatal: () => void
  // Dikabari setiap isian berubah atau kembali bersih, supaya dialog tidak tertutup diam-diam saat ada isian.
  onDirtyChange?: (kotor: boolean) => void
}

interface HeaderValues {
  tanggal: string
  keterangan_str: string
  catatan: string
}

interface ItemDaftar {
  obat_id: number
  nama: string
  kode: string
  satuan: string
  harga_jual: number
  jumlah: number
}

// Kalimat di bawah kolom jumlah: stok sekarang dan sisanya, dengan peringatan bila tidak cukup atau akan
// di bawah titik pesan ulang (ROP). Peringatan memakai ikon dan teks, bukan hanya warna.
function StokInfo({ obat, tersedia, jumlah, penjualan }: { obat: Obat; tersedia: number; jumlah: number; penjualan: boolean }) {
  const sisa = jumlah > 0 ? tersedia - jumlah : null
  const rop = obat.rop !== null && obat.rop !== undefined ? Number(obat.rop) : null
  const tidakCukup = sisa !== null && sisa < 0
  const dibawahRop = sisa !== null && sisa >= 0 && rop !== null && rop > 0 && sisa <= rop
  const harga = Number(obat.harga_jual) || 0
  return (
    // aria-live: pembaca layar mengumumkan perubahan stok dan peringatan saat jumlah diketik
    <FieldDescription id="jumlah-keluar-hint" aria-live="polite">
      Stok tersedia <span className="font-medium text-foreground">{formatAngka(tersedia, 0)} {obat.satuan}</span>
      {sisa !== null && !tidakCukup && <>. Sisa setelah keluar <span className="font-medium text-foreground">{formatAngka(sisa, 0)} {obat.satuan}</span></>}
      .
      {penjualan && (
        harga > 0 ? (
          <>
            {' '}Harga jual <span className="font-medium text-foreground">{formatRupiah(harga)}</span> per {obat.satuan}
            {jumlah > 0 && <>, subtotal <span className="font-medium text-foreground">{formatRupiah(harga * jumlah)}</span></>}.
          </>
        ) : (
          <> Harga jual obat ini belum diisi.</>
        )
      )}
      {tidakCukup && (
        <span role="alert" className="mt-1 flex items-start gap-1.5 font-medium text-danger-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Stok tidak cukup, kurang {formatAngka(-sisa, 0)} {obat.satuan}.
        </span>
      )}
      {dibawahRop && (
        <span role="alert" className="mt-1 flex items-start gap-1.5 font-medium text-warning-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Stok akan sama dengan atau di bawah titik pesan ulang (ROP {formatAngka(rop, 2)}).
        </span>
      )}
    </FieldDescription>
  )
}

export default function BarangKeluarForm({ onSuccess, onBatal, onDirtyChange }: Props) {
  const { data: obatData } = useObatSemua()
  const bulkMutation = useCreateBarangKeluarBulk()
  const obatList = obatData?.data ?? []

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<HeaderValues>({
    // Fokus galat pertama diatur sendiri (fokusGalat) supaya Select juga mendapat fokus.
    shouldFocusError: false,
    defaultValues: { tanggal: tanggalLokal(), keterangan_str: 'Penjualan', catatan: '' },
  })
  const keterangan = useWatch({ control, name: 'keterangan_str' })
  const penjualan = keterangan === 'Penjualan'
  const tanggalIsi = useWatch({ control, name: 'tanggal' })
  // Ringkasan transaksi yang baru disimpan lewat "Simpan dan catat lagi" (mis. "3 obat, Rp 45.000").
  const [tersimpan, setTersimpan] = useState<string | null>(null)

  // Baris yang sedang diisi (belum masuk daftar)
  const [obatIdStr, setObatIdStr] = useState('')
  const [jumlahStr, setJumlahStr] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [itemError, setItemError] = useState('')
  // Daftar obat yang akan dikeluarkan
  const [daftar, setDaftar] = useState<ItemDaftar[]>([])
  const [daftarError, setDaftarError] = useState('')

  const selectedObat = obatList.find((o) => String(o.id) === obatIdStr)
  const jumlahAngka = Number(jumlahStr)
  // Stok yang masih tersedia untuk obat ini: stok sekarang dikurangi baris lain di daftar yang memakai obat yang sama.
  const sudahDialokasikan = selectedObat
    ? daftar.reduce((sum, it, i) => (it.obat_id === selectedObat.id && i !== editingIndex ? sum + it.jumlah : sum), 0)
    : 0
  const tersedia = selectedObat ? Number(selectedObat.stok) - sudahDialokasikan : 0
  const totalHarga = daftar.reduce((sum, it) => sum + it.harga_jual * it.jumlah, 0)
  const tanpaHarga = daftar.filter((it) => !(it.harga_jual > 0)).length

  useEffect(() => {
    onDirtyChange?.(isDirty || daftar.length > 0 || obatIdStr !== '' || jumlahStr !== '')
  }, [isDirty, daftar.length, obatIdStr, jumlahStr, onDirtyChange])

  function resetBaris() {
    setObatIdStr('')
    setJumlahStr('')
    setEditingIndex(null)
    setItemError('')
  }

  function masukkanKeDaftar() {
    if (!selectedObat) {
      setItemError('Pilih obat dulu')
      document.getElementById('obat-keluar')?.focus()
      return
    }
    if (!(jumlahAngka > 0) || !Number.isInteger(jumlahAngka)) {
      setItemError('Jumlah harus bilangan bulat lebih dari 0')
      document.getElementById('jumlah-keluar')?.focus()
      return
    }
    if (tersedia < jumlahAngka) {
      setItemError(`Stok ${selectedObat.nama} tidak cukup (tersedia ${formatAngka(tersedia, 0)} ${selectedObat.satuan}). Bila stok fisik berbeda dengan stok sistem, hubungi admin.`)
      document.getElementById('jumlah-keluar')?.focus()
      return
    }
    const item: ItemDaftar = {
      obat_id: selectedObat.id,
      nama: selectedObat.nama,
      kode: selectedObat.kode,
      satuan: selectedObat.satuan,
      harga_jual: Number(selectedObat.harga_jual) || 0,
      jumlah: jumlahAngka,
    }
    setDaftar((prev) => {
      if (editingIndex !== null) {
        const next = [...prev]
        next[editingIndex] = item
        return next
      }
      return [...prev, item]
    })
    setDaftarError('')
    resetBaris()
    // Siap mengisi obat berikutnya
    setTimeout(() => document.getElementById('obat-keluar')?.focus(), 0)
  }

  function ubahItem(index: number) {
    const item = daftar[index]
    setObatIdStr(String(item.obat_id))
    setJumlahStr(String(item.jumlah))
    setEditingIndex(index)
    setItemError('')
    document.getElementById('obat-keluar')?.scrollIntoView({ block: 'center' })
  }

  function hapusItem(index: number) {
    setDaftar((prev) => prev.filter((_, i) => i !== index))
    if (editingIndex === index) resetBaris()
  }

  async function onSubmit(header: HeaderValues, lagi = false) {
    clearErrors('root.server')
    setTersimpan(null)
    if (daftar.length === 0) {
      setDaftarError('Tambahkan minimal satu obat ke daftar')
      document.getElementById('obat-keluar')?.focus()
      return
    }
    // Atomik di backend: bila satu obat gagal (mis. stok berubah oleh transaksi lain tepat sebelum simpan),
    // SEMUA dibatalkan dan daftar tetap utuh di sini supaya tinggal diperbaiki lalu disimpan ulang.
    try {
      await bulkMutation.mutateAsync({
        tanggal: header.tanggal,
        keterangan: header.keterangan_str,
        catatan: header.catatan || undefined,
        items: daftar.map((it) => ({ obat_id: it.obat_id, jumlah: it.jumlah })),
      })
      if (lagi) {
        // Dialog tetap terbuka untuk transaksi berikutnya: tanggal dan keterangan dipertahankan, daftar dan catatan dikosongkan.
        setTersimpan(`${daftar.length} obat${header.keterangan_str === 'Penjualan' && totalHarga > 0 ? `, ${formatRupiah(totalHarga)}` : ''}`)
        setDaftar([])
        resetBaris()
        reset({ tanggal: header.tanggal, keterangan_str: header.keterangan_str, catatan: '' })
        setTimeout(() => document.getElementById('obat-keluar')?.focus(), 0)
      } else {
        onSuccess()
      }
    } catch (err) {
      // Toast dari hook hilang sendiri; pesan server juga ditulis tetap di atas tombol Simpan.
      const galat = err as { response?: { data?: { message?: string } } }
      setError('root.server', { message: galat?.response?.data?.message ?? 'Stok keluar belum bisa disimpan. Periksa koneksi, lalu coba lagi.' })
    }
  }

  function fokusGalat(galat: FieldErrors<HeaderValues>) {
    const id = galat.tanggal ? 'tanggal' : galat.keterangan_str ? 'keterangan' : null
    const el = id ? document.getElementById(id) : null
    el?.focus()
    el?.scrollIntoView({ block: 'center' })
  }

  // Galat dari server berada di dasar form yang panjang: gulir ke sana supaya terlihat.
  const galatServer = errors.root?.server?.message
  useEffect(() => {
    if (galatServer) document.getElementById('galat-server')?.scrollIntoView({ block: 'center' })
  }, [galatServer])

  return (
    // noValidate: galat ditulis inline oleh form ini, bukan balon bawaan peramban.
    <form onSubmit={handleSubmit((h) => onSubmit(h, false), fokusGalat)} noValidate className="space-y-6">

      <p className="text-sm text-muted-foreground">
        <span className="text-destructive" aria-hidden="true">*</span> Wajib diisi
      </p>

      {/* Wadah role=status selalu ada agar pembaca layar mengumumkan isinya saat muncul */}
      <div role="status">
        {tersimpan && (
          <p className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
            <span className="font-medium">{tersimpan}</span> tersimpan dan stok sudah berkurang. Catat transaksi berikutnya di bawah.
          </p>
        )}
      </div>

      {/* ── Transaksi: berlaku untuk semua obat di bawahnya ─────────────── */}
      <FormSection title="Transaksi" description="Berlaku untuk semua obat dalam catatan ini.">
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
          <Field data-invalid={!!errors.tanggal}>
            <FieldLabel htmlFor="tanggal">Tanggal keluar <Wajib /></FieldLabel>
            <Input
              id="tanggal"
              type="date"
              aria-required="true"
              aria-invalid={!!errors.tanggal}
              aria-describedby={errors.tanggal ? 'tanggal-error' : undefined}
              className="h-10 rounded-xl"
              {...register('tanggal', { required: 'Tanggal wajib diisi' })}
            />
            <FieldError id="tanggal-error">{errors.tanggal?.message}</FieldError>
            {!errors.tanggal && tanggalIsi > tanggalLokal() && (
              <p className="flex items-start gap-1.5 text-sm font-medium text-warning-700">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Tanggal ini di masa depan. Pastikan tanggalnya benar.
              </p>
            )}
          </Field>

          <Field data-invalid={!!errors.keterangan_str}>
            <FieldLabel htmlFor="keterangan">Keterangan <Wajib /></FieldLabel>
            <Controller
              name="keterangan_str"
              control={control}
              rules={{ required: 'Pilih keterangan' }}
              render={({ field }) => (
                <PilihanCombobox
                  id="keterangan"
                  options={KETERANGAN_KELUAR.map((k) => ({ value: k, label: k }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Pilih keterangan"
                  noun="keterangan"
                  error={!!errors.keterangan_str}
                  aria-required="true"
                  aria-describedby={errors.keterangan_str ? 'keterangan-error' : 'keterangan-hint'}
                />
              )}
            />
            {errors.keterangan_str ? (
              <FieldError id="keterangan-error">{errors.keterangan_str.message}</FieldError>
            ) : (
              <FieldDescription id="keterangan-hint">Penjualan dihitung sebagai pendapatan; yang lain tidak.</FieldDescription>
            )}
          </Field>
        </div>
      </FormSection>

      {/* ── Daftar obat: isi satu obat, masukkan ke daftar, ulangi ──────── */}
      <FormSection title={`Daftar obat (${daftar.length})`}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 rounded-xl bg-muted/50 p-4 md:grid-cols-[minmax(0,1fr)_11rem]">
            <Field>
              <FieldLabel htmlFor="obat-keluar">{editingIndex !== null ? 'Ubah obat' : 'Obat'}</FieldLabel>
              <ObatCombobox
                id="obat-keluar"
                obatList={obatList}
                value={obatIdStr}
                onChange={(v) => {
                  setObatIdStr(v); setItemError(''); setDaftarError(''); setTersimpan(null)
                  // Setelah obat dipilih, langsung ke kolom Jumlah
                  if (v) setTimeout(() => document.getElementById('jumlah-keluar')?.focus(), 0)
                }}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="jumlah-keluar">Jumlah{selectedObat ? ` (${selectedObat.satuan})` : ''}</FieldLabel>
              <InputSatuan
                id="jumlah-keluar"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="0"
                value={jumlahStr}
                aria-describedby={selectedObat ? 'jumlah-keluar-hint' : undefined}
                onChange={(e) => { setJumlahStr(e.target.value); setItemError(''); setDaftarError('') }}
                // Enter di kolom jumlah memasukkan obat ke daftar (bukan menyimpan seluruh form)
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); masukkanKeDaftar() } }}
              />
            </Field>

            <div className="space-y-2 md:col-span-2">
              {selectedObat && <StokInfo obat={selectedObat} tersedia={tersedia} jumlah={jumlahAngka} penjualan={penjualan} />}
              {itemError && <FieldError role="alert">{itemError}</FieldError>}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={masukkanKeDaftar}>
                  {editingIndex !== null ? 'Simpan perubahan baris' : 'Masukkan ke daftar'}
                </Button>
                {editingIndex !== null && (
                  <Button type="button" variant="ghost" className="h-10 rounded-xl px-3" onClick={resetBaris}>
                    Batal ubah
                  </Button>
                )}
              </div>
            </div>
          </div>

          {daftar.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-5 py-8 text-center" role="status">
              <PackageOpen className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">Belum ada obat di daftar</p>
              <p className="max-w-sm text-sm text-muted-foreground">Pilih obat dan jumlahnya di atas, lalu tekan Masukkan ke daftar. Ulangi untuk obat lain.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4 text-xs font-medium text-muted-foreground">Obat</TableHead>
                    <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">Jumlah</TableHead>
                    {penjualan && <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">Harga</TableHead>}
                    {penjualan && <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">Total</TableHead>}
                    <TableHead className="h-10 pr-3 text-right text-xs font-medium text-muted-foreground">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daftar.map((item, index) => (
                    <TableRow key={`${item.obat_id}-${index}`} className={index === editingIndex ? 'bg-accent hover:bg-accent' : undefined}>
                      <TableCell className="whitespace-normal py-2.5 pl-4">
                        <span className="block font-medium leading-tight text-foreground">{item.nama}</span>
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{item.kode}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2.5 text-right tabular-nums">
                        <span className="font-semibold text-foreground">{formatAngka(item.jumlah, 0)}</span>
                        <span className="ml-1 text-xs text-muted-foreground">{item.satuan}</span>
                      </TableCell>
                      {penjualan && (
                        <TableCell className="whitespace-nowrap py-2.5 text-right tabular-nums text-muted-foreground">
                          {item.harga_jual > 0 ? formatRupiah(item.harga_jual) : <>-<span className="sr-only"> Harga belum diisi</span></>}
                        </TableCell>
                      )}
                      {penjualan && (
                        <TableCell className="whitespace-nowrap py-2.5 text-right font-medium tabular-nums">
                          {item.harga_jual > 0 ? formatRupiah(item.harga_jual * item.jumlah) : <span className="font-normal text-muted-foreground">-</span>}
                        </TableCell>
                      )}
                      <TableCell className="py-1.5 pr-3">
                        <div className="flex justify-end gap-1">
                          <IconAction type="button" label={`Ubah ${item.nama}`} onClick={() => ubahItem(index)}><Pencil /></IconAction>
                          <IconAction type="button" label={`Hapus ${item.nama} dari daftar`} className="text-destructive hover:text-destructive" onClick={() => hapusItem(index)}><Trash2 /></IconAction>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {penjualan && (
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    Total penjualan
                    {tanpaHarga > 0 && <span>, {tanpaHarga} obat belum punya harga jual</span>}
                  </span>
                  <span className="text-base font-semibold tabular-nums text-foreground">{formatRupiah(totalHarga)}</span>
                </div>
              )}
            </div>
          )}
          {daftarError && <FieldError role="alert">{daftarError}</FieldError>}
        </div>
      </FormSection>

      <Field>
        <FieldLabel htmlFor="catatan">Catatan <Opsional /></FieldLabel>
        <Input id="catatan" placeholder="Catatan tambahan untuk transaksi ini" className="h-10 rounded-xl" {...register('catatan')} />
      </Field>

      {/* Gagal menyimpan: pesan server tetap tampil sampai dicoba lagi (toast hilang sendiri) */}
      {errors.root?.server?.message && (
        <FieldError id="galat-server" className="rounded-xl bg-destructive/10 px-4 py-3">{errors.root.server.message}</FieldError>
      )}

      <FormActions className="sticky -bottom-5 z-10 -mx-5 -mb-5 bg-popover px-5 pb-5">
        <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={onBatal}>
          Batal
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl px-4"
          disabled={bulkMutation.isPending}
          onClick={handleSubmit((h) => onSubmit(h, true), fokusGalat)}
        >
          Simpan dan catat lagi
        </Button>
        <Button type="submit" className="h-10 min-w-40 rounded-xl px-4" disabled={bulkMutation.isPending}>
          {bulkMutation.isPending ? 'Menyimpan...' : 'Simpan stok keluar'}
        </Button>
      </FormActions>

    </form>
  )
}
