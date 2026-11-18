'use client'

import { useEffect, useState } from 'react'
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import { FormActions } from '@/components/shared/FormParts'
import { KATEGORI_OBAT, SATUAN_OBAT } from '@/lib/constants'
import { gabungOpsi, MAKS_KATEGORI, MAKS_SATUAN, rapikanKategori, rapikanSatuan } from '@/lib/opsiObat'
import { useObatOpsi } from '@/hooks/useObat'
import type { ObatFormData } from '@/types/obat'
import type { Obat } from '@/types/obat'

// Tanda wajib: bintang untuk mata, "wajib" untuk pembaca layar.
function Wajib() {
  return (
    <>
      <span className="text-destructive" aria-hidden="true">*</span>
      <span className="sr-only">(wajib)</span>
    </>
  )
}

// Urutan field di layar: dipakai untuk memfokuskan galat pertama (termasuk Select, yang memakai input hidden).
const URUTAN_FIELD: (keyof ObatFormData)[] = ['nama', 'kategori', 'satuan', 'satuan_per_dus']
const BATAS_ISI_PER_DUS = 100000 // sama dengan batas di backend (obatController: SPEC_OBAT.satuan_per_dus)

interface Props {
  defaultValues?: Partial<Obat>
  // Boleh async. Bila melempar galat, pesan servernya ditampilkan di atas tombol Simpan.
  onSubmit: (data: ObatFormData) => void | Promise<void>
  // Bila diberikan, muncul tombol "Simpan dan tambah lagi": menyimpan lalu mengosongkan form (hanya halaman Tambah).
  onSimpanLagi?: (data: ObatFormData) => void | Promise<void>
  // Tujuan tombol Batal. Wajib: setiap pemakai form menentukan ke mana Batal membawa pengguna
  // (halaman asal, atau menutup dialog), tidak ada tujuan bawaan yang diam-diam memuat ulang halaman lain.
  onBatal: () => void
  // Dikabari setiap isian berubah atau kembali bersih, supaya halaman pemakai bisa meminta konfirmasi
  // juga pada jalan keluar lain (tombol Kembali di kepala halaman).
  onDirtyChange?: (kotor: boolean) => void
  isLoading?: boolean
  submitLabel?: string
}

export default function ObatForm({ defaultValues, onSubmit, onSimpanLagi, onBatal, onDirtyChange, isLoading, submitLabel = 'Simpan' }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<ObatFormData>({
    // Fokus galat pertama diatur sendiri (fokusGalat) supaya Select juga mendapat fokus.
    shouldFocusError: false,
    defaultValues: {
      nama: defaultValues?.nama ?? '',
      kategori: defaultValues?.kategori ?? '',
      satuan: defaultValues?.satuan ?? '',
      satuan_per_dus: defaultValues?.satuan_per_dus ?? 1,
    },
  })

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const satuanValue = useWatch({ control, name: 'satuan' })
  const kategoriValue = useWatch({ control, name: 'kategori' })
  const perDusValue = useWatch({ control, name: 'satuan_per_dus' })
  // Peringatan hanya muncul bila satuan atau isi per dus benar-benar diubah dari nilai awal (mode ubah).
  const satuanAwal = defaultValues?.satuan
  const perDusAwal = defaultValues?.satuan_per_dus
  const satuanBerubah = Boolean(satuanAwal && satuanValue && satuanValue !== satuanAwal)
  const perDusBerubah = Boolean(perDusAwal && perDusValue && Number(perDusValue) !== Number(perDusAwal))

  // Daftar baku + yang sudah dipakai obat lain. Nilai baru hanya bisa dibuat di form TAMBAH (tanpa defaultValues);
  // form Ubah hanya memilih yang sudah ada (keputusan Boss 18 Nov 2026).
  const bolehBuatBaru = !defaultValues
  const opsiDb = useObatOpsi().data
  const opsiKategori = gabungOpsi(KATEGORI_OBAT, opsiDb?.kategori)
  const opsiSatuan = gabungOpsi(SATUAN_OBAT, opsiDb?.satuan)

  // Konfirmasi: mengubah satuan mengubah arti semua angka stok dan batch yang sudah ada.
  // Muncul SETELAH validasi lolos dan sebelum data dikirim.
  const [konfirmasiTerbuka, setKonfirmasiTerbuka] = useState(false)
  const [dataTertunda, setDataTertunda] = useState<ObatFormData | null>(null)
  // Konfirmasi membuang isian yang belum disimpan (tombol Batal).
  const [buangTerbuka, setBuangTerbuka] = useState(false)

  // Nama obat yang baru disimpan lewat "Simpan dan tambah lagi" (untuk pesan konfirmasi di atas form).
  const [tersimpan, setTersimpan] = useState<string | null>(null)

  async function simpan(data: ObatFormData, lagi = false) {
    clearErrors('root.server')
    setTersimpan(null)
    try {
      if (lagi && onSimpanLagi) {
        await onSimpanLagi(data)
        setTersimpan(data.nama)
        // Kategori dan satuan dipertahankan (memasukkan banyak obat sekategori jadi cepat); banner menyebutnya.
        reset({ nama: '', kategori: data.kategori, satuan: data.satuan, satuan_per_dus: 1 })
        document.getElementById('nama')?.focus()
      } else {
        await onSubmit(data)
      }
    } catch (err) {
      const galat = err as { response?: { data?: { message?: string; field?: string } } }
      const pesan = galat?.response?.data?.message ?? 'Data belum bisa disimpan. Periksa koneksi, lalu coba lagi.'
      if (galat?.response?.data?.field === 'nama') {
        // Server menolak nama (mis. sudah ada): tampil di bawah field Nama, bukan hanya toast.
        setError('nama', { message: pesan })
        document.getElementById('nama')?.focus()
      } else {
        setError('root.server', { message: pesan })
      }
    }
  }

  function kirim(data: ObatFormData) {
    if (satuanBerubah) {
      setDataTertunda(data)
      setKonfirmasiTerbuka(true)
    } else {
      void simpan(data)
    }
  }

  // Fokus dan gulir ke field pertama yang salah, urut seperti di layar.
  function fokusGalat(galat: FieldErrors<ObatFormData>) {
    const pertama = URUTAN_FIELD.find((k) => galat[k])
    if (!pertama) return
    const el = document.getElementById(pertama)
    el?.focus()
    el?.scrollIntoView({ block: 'center' })
  }


  return (
    // noValidate: galat ditulis inline oleh form ini, bukan balon bawaan peramban.
    <form onSubmit={handleSubmit(kirim, fokusGalat)} noValidate className="space-y-6">

      {/* Keterangan tanda wajib: satu baris di atas form (semua kolom wajib) */}
      <p className="text-sm text-muted-foreground">
        <span className="text-destructive" aria-hidden="true">*</span> Semua kolom wajib diisi
      </p>

      {/* Wadah role=status selalu ada agar pembaca layar mengumumkan isinya saat muncul */}
      <div role="status">
        {tersimpan && (
          <p className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
            <span className="font-medium">{tersimpan}</span> sudah ditambahkan. Kategori dan satuan tetap dari obat sebelumnya, ubah bila perlu.
          </p>
        )}
      </div>

      {/* Form satu bagian: tanpa judul bagian dan tanpa nomor. Hint tertulis di bawah field. */}
      <FieldGroup className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">

        <Field className="md:col-span-2" data-invalid={!!errors.nama}>
          <FieldLabel htmlFor="nama">Nama obat <Wajib /></FieldLabel>
          <Input
            id="nama"
            placeholder="Contoh: Paracetamol 500mg"
            aria-required="true"
            aria-invalid={!!errors.nama}
            aria-describedby={errors.nama ? 'nama-error' : 'nama-hint'}
            className="h-10 rounded-xl"
            {...register('nama', { required: 'Nama obat wajib diisi' })}
          />
          {errors.nama ? (
            <FieldError id="nama-error">{errors.nama.message}</FieldError>
          ) : (
            <FieldDescription id="nama-hint">Huruf kapital dirapikan otomatis oleh sistem.</FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!errors.kategori}>
          <FieldLabel htmlFor="kategori">Kategori <Wajib /></FieldLabel>
          <PilihanCombobox
            id="kategori"
            options={opsiKategori}
            value={kategoriValue}
            onChange={(v) => setValue('kategori', v, { shouldValidate: true, shouldDirty: true })}
            placeholder="Pilih kategori"
            noun="kategori"
            tambahBaru={bolehBuatBaru ? { rapikan: rapikanKategori, maks: MAKS_KATEGORI } : undefined}
            error={!!errors.kategori}
            aria-required="true"
            aria-describedby={errors.kategori ? 'kategori-error' : undefined}
          />
          <input type="hidden" {...register('kategori', { required: 'Kategori wajib dipilih' })} />
          <FieldError id="kategori-error">{errors.kategori?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.satuan}>
          <FieldLabel htmlFor="satuan">Satuan terkecil <Wajib /></FieldLabel>
          <PilihanCombobox
            id="satuan"
            options={opsiSatuan}
            value={satuanValue}
            onChange={(v) => setValue('satuan', v, { shouldValidate: true, shouldDirty: true })}
            placeholder="Pilih satuan"
            noun="satuan"
            tambahBaru={bolehBuatBaru ? { rapikan: rapikanSatuan, maks: MAKS_SATUAN } : undefined}
            error={!!errors.satuan}
            aria-required="true"
            aria-describedby={errors.satuan ? 'satuan-error' : 'satuan-hint'}
          />
          <input type="hidden" {...register('satuan', { required: 'Satuan wajib dipilih' })} />
          {errors.satuan ? (
            <FieldError id="satuan-error">{errors.satuan.message}</FieldError>
          ) : (
            <FieldDescription id="satuan-hint">Satuan paling kecil yang dijual.</FieldDescription>
          )}
        </Field>

        {/* Satuan dan isi per dus berpasangan: ditulis sebagai satu kalimat ("1 dus berisi [100] tablet"),
            jadi hubungannya jelas tanpa paragraf penjelasan. */}
        <Field className="md:col-span-2" data-invalid={!!errors.satuan_per_dus}>
          <FieldLabel htmlFor="satuan_per_dus">Isi per dus <Wajib /></FieldLabel>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm">
            <span id="dus-awalan" className="text-muted-foreground">1 dus berisi</span>
            <Input
              id="satuan_per_dus"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              aria-required="true"
              aria-invalid={!!errors.satuan_per_dus}
              aria-describedby={`dus-awalan dus-satuan ${errors.satuan_per_dus ? 'satuan_per_dus-error' : 'satuan_per_dus-hint'}`}
              onKeyDown={(e) => { if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault() }}
              onWheel={(e) => e.currentTarget.blur()}
              className="h-10 w-28 rounded-xl tabular-nums"
              {...register('satuan_per_dus', {
                valueAsNumber: true,
                required: 'Isi per dus wajib diisi',
                min: { value: 1, message: 'Isi per dus minimal 1' },
                max: { value: BATAS_ISI_PER_DUS, message: 'Isi per dus maksimal 100.000' },
                validate: (v) => Number.isInteger(v) || 'Isi per dus harus bilangan bulat, tanpa koma',
              })}
            />
            <span id="dus-satuan" className={satuanValue ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {satuanValue || 'satuan (pilih dulu)'}
            </span>
          </div>
          {errors.satuan_per_dus ? (
            <FieldError id="satuan_per_dus-error">{errors.satuan_per_dus.message}</FieldError>
          ) : (
            <FieldDescription id="satuan_per_dus-hint">Isi 1 bila obat ini tidak dibeli per dus.</FieldDescription>
          )}
        </Field>

      </FieldGroup>

      {/* Peringatan singkat saat berubah; penjelasan lengkap ada di dialog konfirmasi */}
      {(satuanBerubah || perDusBerubah) && (
        <p role="status" className="rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700">
          {[
            satuanBerubah ? `Satuan berubah dari ${satuanAwal} ke ${satuanValue}.` : null,
            perDusBerubah ? `Isi per dus berubah dari ${perDusAwal} ke ${perDusValue}. Barang masuk berikutnya memakai angka baru.` : null,
          ].filter(Boolean).join(' ')}
        </p>
      )}

      {/* Gagal menyimpan: pesan dari server tetap tampil sampai dicoba lagi (toast hilang sendiri) */}
      {errors.root?.server?.message && (
        <FieldError className="rounded-xl bg-destructive/10 px-4 py-3">{errors.root.server.message}</FieldError>
      )}

      <FormActions>
        <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={() => (isDirty ? setBuangTerbuka(true) : onBatal())}>
          Batal
        </Button>
        {onSimpanLagi && (
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className="h-10 rounded-xl px-4"
            onClick={handleSubmit((d) => simpan(d, true), fokusGalat)}
          >
            {isLoading ? 'Menyimpan...' : 'Simpan dan tambah lagi'}
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="h-10 min-w-32 rounded-xl px-4">
          {isLoading ? 'Menyimpan...' : submitLabel}
        </Button>
      </FormActions>

      <AlertDialog open={konfirmasiTerbuka} onOpenChange={setKonfirmasiTerbuka}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah satuan menjadi {satuanValue}?</AlertDialogTitle>
            <AlertDialogDescription>
              Angka stok dan batch yang sudah ada tidak dikonversi: jumlahnya akan dibaca dalam satuan {satuanValue}, bukan {satuanAwal}. Lanjutkan hanya bila satuan sebelumnya memang salah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Periksa lagi</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (dataTertunda) void simpan(dataTertunda) }}>Ya, simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <KonfirmasiBuang open={buangTerbuka} onOpenChange={setBuangTerbuka} onBuang={onBatal} />
    </form>
  )
}
