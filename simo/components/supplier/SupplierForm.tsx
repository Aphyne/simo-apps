'use client'

import { useEffect, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import { FormActions, InputSatuan, Opsional, Wajib } from '@/components/shared/FormParts'
import type { Supplier, SupplierFormData } from '@/types/supplier'

// Urutan field di layar: dipakai untuk memfokuskan galat pertama.
const URUTAN_FIELD: (keyof SupplierFormData)[] = ['nama', 'telepon', 'whatsapp', 'lead_time_avg', 'biaya_pesan']
// Sama dengan batas di backend (supplierController): lead time bulat 1 sampai 365 hari, biaya pesan 0 sampai 1 miliar.
const LEAD_TIME_MAKS = 365
const BIAYA_PESAN_MAKS = 1e9

interface Props {
  defaultValues?: Partial<Supplier>
  // Boleh async. Bila melempar galat, pesan servernya ditampilkan di atas tombol Simpan.
  onSubmit: (data: SupplierFormData) => void | Promise<void>
  // Tujuan tombol Batal (halaman asal). Wajib, sama seperti form obat.
  onBatal: () => void
  // Dikabari setiap isian berubah atau kembali bersih, supaya halaman bisa meminta konfirmasi di tombol Kembali.
  onDirtyChange?: (kotor: boolean) => void
  isLoading?: boolean
  submitLabel?: string
}

export default function SupplierForm({ defaultValues, onSubmit, onBatal, onDirtyChange, isLoading, submitLabel = 'Simpan' }: Props) {
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<SupplierFormData>({
    // Fokus galat pertama diatur sendiri (fokusGalat) supaya urutannya sama dengan di layar.
    shouldFocusError: false,
    defaultValues: {
      nama: defaultValues?.nama ?? '',
      alamat: defaultValues?.alamat ?? '',
      telepon: defaultValues?.telepon ?? '',
      whatsapp: defaultValues?.whatsapp ?? '',
      jenis_obat: defaultValues?.jenis_obat ?? '',
      lead_time_avg: defaultValues?.lead_time_avg ?? 1,
      biaya_pesan: defaultValues?.biaya_pesan ?? 5000,
    },
  })

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const [buangTerbuka, setBuangTerbuka] = useState(false)

  function validateKontak() {
    const { telepon, whatsapp } = getValues()
    return !!(telepon?.trim() || whatsapp?.trim()) || 'Isi minimal salah satu nomor kontak'
  }

  async function simpan(data: SupplierFormData) {
    clearErrors('root.server')
    try {
      await onSubmit(data)
    } catch (err) {
      const galat = err as { response?: { data?: { message?: string } } }
      setError('root.server', { message: galat?.response?.data?.message ?? 'Data belum bisa disimpan. Periksa koneksi, lalu coba lagi.' })
    }
  }

  // Fokus dan gulir ke field pertama yang salah, urut seperti di layar.
  function fokusGalat(galat: FieldErrors<SupplierFormData>) {
    const pertama = URUTAN_FIELD.find((k) => galat[k])
    if (!pertama) return
    const el = document.getElementById(pertama)
    el?.focus()
    el?.scrollIntoView({ block: 'center' })
  }

  // Galat "isi minimal salah satu" berlaku untuk pasangan telepon dan WhatsApp, jadi ditulis sekali di bawah pasangannya.
  const galatKontak = errors.telepon?.message ?? errors.whatsapp?.message

  return (
    // noValidate: galat ditulis inline oleh form ini, bukan balon bawaan peramban.
    <form onSubmit={handleSubmit(simpan, fokusGalat)} noValidate className="space-y-6">
      <p className="text-sm text-muted-foreground">
        <span className="text-destructive" aria-hidden="true">*</span> Wajib diisi
      </p>

      <FieldGroup className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">
        <Field className="md:col-span-2" data-invalid={!!errors.nama}>
          <FieldLabel htmlFor="nama">Nama supplier <Wajib /></FieldLabel>
          <Input
            id="nama"
            placeholder="Contoh: PBF Kimia Farma"
            aria-required="true"
            aria-invalid={!!errors.nama}
            aria-describedby={errors.nama ? 'nama-error' : undefined}
            className="h-10 rounded-xl"
            {...register('nama', { validate: (v) => !!v?.trim() || 'Nama supplier wajib diisi' })}
          />
          <FieldError id="nama-error">{errors.nama?.message}</FieldError>
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel htmlFor="alamat">Alamat <Opsional /></FieldLabel>
          <Input id="alamat" placeholder="Alamat lengkap supplier" autoComplete="street-address" className="h-10 rounded-xl" {...register('alamat')} />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel htmlFor="jenis_obat">Jenis obat yang disuplai <Opsional /></FieldLabel>
          <Input
            id="jenis_obat"
            placeholder="Contoh: Antibiotik, analgesik, antasida"
            aria-describedby="jenis_obat-hint"
            className="h-10 rounded-xl"
            {...register('jenis_obat')}
          />
          <FieldDescription id="jenis_obat-hint">Pisahkan dengan koma bila lebih dari satu jenis.</FieldDescription>
        </Field>

        {/* Telepon dan WhatsApp berpasangan: wajib diisi minimal salah satu. */}
        <FieldSet className="md:col-span-2" data-invalid={!!galatKontak}>
          <FieldLegend className="mb-0 text-sm font-medium text-foreground">
            Kontak <Wajib /> <span className="font-normal text-muted-foreground">(isi minimal salah satu)</span>
          </FieldLegend>
          <FieldGroup className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
            <Field data-invalid={!!errors.telepon}>
              <FieldLabel htmlFor="telepon">Telepon</FieldLabel>
              <Input
                id="telepon"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Contoh: 0986-211234"
                aria-invalid={!!errors.telepon}
                aria-describedby={galatKontak ? 'kontak-error' : undefined}
                className="h-10 rounded-xl"
                {...register('telepon', { validate: validateKontak, onChange: () => trigger('whatsapp') })}
              />
            </Field>
            <Field data-invalid={!!errors.whatsapp}>
              <FieldLabel htmlFor="whatsapp">WhatsApp</FieldLabel>
              <Input
                id="whatsapp"
                type="tel"
                inputMode="numeric"
                placeholder="Contoh: 081234560001"
                aria-invalid={!!errors.whatsapp}
                aria-describedby={galatKontak ? 'kontak-error' : 'whatsapp-hint'}
                className="h-10 rounded-xl"
                {...register('whatsapp', { validate: validateKontak, onChange: () => trigger('telepon') })}
              />
              {!galatKontak && <FieldDescription id="whatsapp-hint">Angka saja, tanpa tanda hubung. Dipakai untuk mengirim Surat Pesanan.</FieldDescription>}
            </Field>
          </FieldGroup>
          <FieldError id="kontak-error">{galatKontak}</FieldError>
        </FieldSet>

        <Field data-invalid={!!errors.lead_time_avg}>
          <FieldLabel htmlFor="lead_time_avg">Lead time <Wajib /></FieldLabel>
          <InputSatuan
            id="lead_time_avg"
            type="number"
            min={1}
            max={LEAD_TIME_MAKS}
            step={1}
            inputMode="numeric"
            akhiran="hari"
            aria-required="true"
            aria-invalid={!!errors.lead_time_avg}
            aria-describedby={errors.lead_time_avg ? 'lead_time_avg-error' : 'lead_time_avg-hint'}
            onKeyDown={(e) => { if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault() }}
            className="pr-12"
            {...register('lead_time_avg', {
              valueAsNumber: true,
              required: 'Lead time wajib diisi',
              min: { value: 1, message: 'Lead time minimal 1 hari' },
              max: { value: LEAD_TIME_MAKS, message: `Lead time maksimal ${LEAD_TIME_MAKS} hari` },
              validate: (v) => Number.isInteger(v) || 'Lead time harus bilangan bulat, tanpa koma',
            })}
          />
          {errors.lead_time_avg ? (
            <FieldError id="lead_time_avg-error">{errors.lead_time_avg.message}</FieldError>
          ) : (
            <FieldDescription id="lead_time_avg-hint">Hari dari pesan sampai barang datang.</FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!errors.biaya_pesan}>
          <FieldLabel htmlFor="biaya_pesan">Biaya pesan per faktur <Wajib /></FieldLabel>
          <InputSatuan
            id="biaya_pesan"
            type="number"
            min={1}
            max={BIAYA_PESAN_MAKS}
            step={100}
            inputMode="numeric"
            awalan="Rp"
            aria-required="true"
            aria-invalid={!!errors.biaya_pesan}
            aria-describedby={errors.biaya_pesan ? 'biaya_pesan-error' : 'biaya_pesan-hint'}
            {...register('biaya_pesan', {
              valueAsNumber: true,
              required: 'Biaya pesan wajib diisi',
              min: { value: 1, message: 'Biaya pesan minimal Rp 1; EOQ tidak bisa dihitung tanpa biaya pesan' },
              max: { value: BIAYA_PESAN_MAKS, message: 'Biaya pesan maksimal Rp 1.000.000.000' },
            })}
          />
          {errors.biaya_pesan ? (
            <FieldError id="biaya_pesan-error">{errors.biaya_pesan.message}</FieldError>
          ) : (
            <FieldDescription id="biaya_pesan-hint">Biaya sekali pesan ke supplier ini, dibagi rata ke obat dalam satu faktur.</FieldDescription>
          )}
        </Field>
      </FieldGroup>

      {/* Gagal menyimpan: pesan dari server tetap tampil sampai dicoba lagi (toast hilang sendiri) */}
      {errors.root?.server?.message && (
        <FieldError className="rounded-xl bg-destructive/10 px-4 py-3">{errors.root.server.message}</FieldError>
      )}

      <FormActions>
        <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={() => (isDirty ? setBuangTerbuka(true) : onBatal())}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading} className="h-10 min-w-32 rounded-xl px-4">
          {isLoading ? 'Menyimpan...' : submitLabel}
        </Button>
      </FormActions>

      <KonfirmasiBuang open={buangTerbuka} onOpenChange={setBuangTerbuka} onBuang={onBatal} />
    </form>
  )
}
