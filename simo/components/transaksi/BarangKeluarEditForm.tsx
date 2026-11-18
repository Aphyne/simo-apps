'use client'

import { useEffect } from 'react'
import { useForm, useWatch, Controller, type FieldErrors } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import { FormActions, InputSatuan, Opsional, Wajib } from '@/components/shared/FormParts'
import { useUpdateBarangKeluar } from '@/hooks/useBarangKeluar'
import { useObatSemua } from '@/hooks/useObat'
import { formatAngka } from '@/lib/utils'
import { KETERANGAN_KELUAR } from '@/lib/barangKeluar'
import { tanggalLokalYMD } from '@/lib/barangMasuk'
import type { BarangKeluar, BarangKeluarUpdateFormData } from '@/types/obat'

interface Props {
  item: BarangKeluar
  onSuccess: () => void
  // Tombol Batal. Induk menentukan apakah perlu konfirmasi membuang perubahan (lihat onDirtyChange).
  onBatal: () => void
  onDirtyChange?: (kotor: boolean) => void
}

// Urutan kolom di layar: dipakai untuk memfokuskan galat pertama (termasuk Select).
const URUTAN_FIELD: { kunci: keyof BarangKeluarUpdateFormData; id: string }[] = [
  { kunci: 'tanggal', id: 'tanggal' },
  { kunci: 'jumlah', id: 'jumlah' },
  { kunci: 'keterangan', id: 'keterangan' },
]

export default function BarangKeluarEditForm({ item, onSuccess, onBatal, onDirtyChange }: Props) {
  const updateMutation = useUpdateBarangKeluar(item.id)
  const { data: obatData } = useObatSemua()
  const obatSekarang = obatData?.data.find((o) => o.id === item.obat_id)

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<BarangKeluarUpdateFormData>({
    // Fokus galat pertama diatur sendiri (fokusGalat) supaya Select juga mendapat fokus.
    shouldFocusError: false,
    defaultValues: {
      tanggal: tanggalLokalYMD(item.tanggal),
      jumlah: item.jumlah,
      keterangan: item.keterangan,
      catatan: item.catatan ?? '',
    },
  })

  const jumlahBaru = useWatch({ control, name: 'jumlah' })
  // Stok obat sesudah perubahan = stok sekarang + jumlah lama catatan ini - jumlah baru.
  const stokSesudah = obatSekarang && Number(jumlahBaru) > 0 ? Number(obatSekarang.stok) + item.jumlah - Number(jumlahBaru) : null

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const galatServer = errors.root?.server?.message
  useEffect(() => {
    if (galatServer) document.getElementById('galat-server')?.scrollIntoView({ block: 'center' })
  }, [galatServer])

  async function onSubmit(values: BarangKeluarUpdateFormData) {
    clearErrors('root.server')
    try {
      await updateMutation.mutateAsync({
        tanggal: values.tanggal,
        jumlah: Number(values.jumlah),
        keterangan: values.keterangan,
        catatan: values.catatan || undefined,
      })
      onSuccess()
    } catch (err) {
      // Toast dari hook hilang sendiri; pesan server juga ditulis tetap di atas tombol Simpan.
      const galat = err as { response?: { data?: { message?: string } } }
      setError('root.server', { message: galat?.response?.data?.message ?? 'Perubahan belum bisa disimpan. Periksa koneksi, lalu coba lagi.' })
    }
  }

  function fokusGalat(galat: FieldErrors<BarangKeluarUpdateFormData>) {
    const pertama = URUTAN_FIELD.find((f) => galat[f.kunci])
    const el = pertama ? document.getElementById(pertama.id) : null
    el?.focus()
    el?.scrollIntoView({ block: 'center' })
  }

  return (
    // noValidate: galat ditulis inline oleh form ini, bukan balon bawaan peramban.
    <form onSubmit={handleSubmit(onSubmit, fokusGalat)} noValidate className="space-y-6">

      <p className="text-sm text-muted-foreground">
        <span className="text-destructive" aria-hidden="true">*</span> Wajib diisi
      </p>

      {/* Obat tidak bisa diganti: ditulis sebagai fakta, bukan kolom yang dikunci */}
      <div>
        <p className="text-sm text-muted-foreground">Obat</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-base font-medium text-foreground">
          {item.nama_obat}
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-normal text-muted-foreground">{item.kode_obat}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Obat tidak bisa diganti. Bila obatnya salah, hapus baris ini lalu catat ulang.</p>
      </div>

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
        </Field>

        <Field data-invalid={!!errors.jumlah}>
          <FieldLabel htmlFor="jumlah">Jumlah ({item.satuan}) <Wajib /></FieldLabel>
          <InputSatuan
            id="jumlah"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            aria-required="true"
            aria-invalid={!!errors.jumlah}
            aria-describedby={errors.jumlah ? 'jumlah-error' : 'jumlah-hint'}
            {...register('jumlah', {
              valueAsNumber: true,
              required: 'Jumlah wajib diisi',
              min: { value: 1, message: 'Jumlah harus lebih dari 0' },
              validate: (v) => Number.isInteger(v) || 'Jumlah harus bilangan bulat, tanpa koma',
            })}
          />
          {errors.jumlah ? (
            <FieldError id="jumlah-error">{errors.jumlah.message}</FieldError>
          ) : (
            <FieldDescription id="jumlah-hint" aria-live="polite">
              {obatSekarang && stokSesudah !== null ? (
                stokSesudah < 0 ? (
                  <span className="font-medium text-danger-700">Ditolak: stok akan menjadi minus ({formatAngka(stokSesudah, 0)} {item.satuan}).</span>
                ) : (
                  <>Stok berubah dari {formatAngka(Number(obatSekarang.stok), 0)} menjadi <span className="font-medium text-foreground">{formatAngka(stokSesudah, 0)} {item.satuan}</span>.</>
                )
              ) : 'Ditolak bila stok jadi minus.'}
            </FieldDescription>
          )}
        </Field>

        <Field className="md:col-span-2" data-invalid={!!errors.keterangan}>
          <FieldLabel htmlFor="keterangan">Keterangan <Wajib /></FieldLabel>
          <Controller
            name="keterangan"
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
                error={!!errors.keterangan}
                aria-required="true"
                aria-describedby={errors.keterangan ? 'keterangan-error' : undefined}
              />
            )}
          />
          <FieldError id="keterangan-error">{errors.keterangan?.message}</FieldError>
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel htmlFor="catatan">Catatan <Opsional /></FieldLabel>
          <Input id="catatan" placeholder="Catatan tambahan" className="h-10 rounded-xl" {...register('catatan')} />
        </Field>
      </div>

      {/* Gagal menyimpan: pesan server tetap tampil sampai dicoba lagi (toast hilang sendiri) */}
      {errors.root?.server?.message && (
        <FieldError id="galat-server" className="rounded-xl bg-destructive/10 px-4 py-3">{errors.root.server.message}</FieldError>
      )}

      <FormActions>
        <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={onBatal}>
          Batal
        </Button>
        <Button type="submit" className="h-10 min-w-40 rounded-xl px-4" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Menyimpan...' : 'Simpan perubahan'}
        </Button>
      </FormActions>

    </form>
  )
}
