'use client'

import { useEffect } from 'react'
import { useForm, useWatch, Controller, type FieldErrors } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import PeringatanExpired, { cekExpired } from '@/components/transaksi/PeringatanExpired'
import HintJumlahDus from '@/components/transaksi/HintJumlahDus'
import { useNow } from '@/hooks/useNow'
import { FormActions, InputSatuan, Opsional, Wajib } from '@/components/shared/FormParts'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpdateBarangMasuk } from '@/hooks/useBarangMasuk'
import { useObatSemua } from '@/hooks/useObat'
import { hargaBeliDusSebelumPPN, tanggalLokalYMD } from '@/lib/barangMasuk'
import { useSupplierDropdown } from '@/hooks/useSupplier'
import type { BarangMasuk, BarangMasukUpdateFormData } from '@/types/obat'

interface Props {
  item: BarangMasuk
  onSuccess: () => void
  // Tombol Batal. Induk menentukan apakah perlu konfirmasi membuang perubahan (lihat onDirtyChange).
  onBatal: () => void
  onDirtyChange?: (kotor: boolean) => void
}

interface FormValues extends BarangMasukUpdateFormData {
  supplier_id_str: string
}

// Urutan kolom di layar: dipakai untuk memfokuskan galat pertama (termasuk Select).
const URUTAN_FIELD: { kunci: keyof FormValues; id: string }[] = [
  { kunci: 'supplier_id_str', id: 'supplier' },
  { kunci: 'no_faktur', id: 'no_faktur' },
  { kunci: 'tanggal', id: 'tanggal' },
  { kunci: 'jatuh_tempo', id: 'jatuh_tempo' },
  { kunci: 'ppn_pct', id: 'ppn_pct' },
  { kunci: 'no_batch', id: 'no_batch' },
  { kunci: 'expired_batch', id: 'expired_batch' },
  { kunci: 'jumlah_dus', id: 'jumlah_dus' },
  { kunci: 'biaya_simpan_pct', id: 'biaya_simpan_pct' },
]

// Pembungkus: menunggu data obat (isi per dus dan biaya simpan sekarang) supaya nilai awal form benar sejak
// render pertama. Bila data obat gagal dimuat, form tetap terbuka dengan nilai turunan dari baris ini.
export default function BarangMasukEditForm(props: Props) {
  const { data: obatData, isLoading } = useObatSemua()
  if (isLoading) {
    return (
      <div className="space-y-5" aria-busy="true">
        <Skeleton className="h-12 w-2/3" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    )
  }
  const obat = obatData?.data.find((o) => o.id === props.item.obat_id)
  const { item } = props
  // Isi per dus dari data obat; cadangan: turunan dari jumlah baris ini (kurang tepat bila jumlah dus pecahan).
  const spd = obat?.satuan_per_dus || (item.jumlah_dus > 0 ? item.jumlah_satuan / item.jumlah_dus : 1)
  return <FormUbah {...props} spd={spd} stokObat={obat ? Number(obat.stok) : undefined} />
}

function FormUbah({ item, spd, stokObat, onSuccess, onBatal, onDirtyChange }: Props & { spd: number; stokObat?: number }) {
  const { data: supplierList } = useSupplierDropdown()
  const updateMutation = useUpdateBarangMasuk(item.id)
  const ppnTersimpan = Number(item.ppn_pct) || 0
  const diskonTersimpan = Number(item.diskon_pct) || 0

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    // Fokus galat pertama diatur sendiri (fokusGalat) supaya Select juga mendapat fokus.
    shouldFocusError: false,
    defaultValues: {
      tanggal: tanggalLokalYMD(item.tanggal),
      supplier_id_str: item.supplier_id ? String(item.supplier_id) : '',
      no_faktur: item.no_faktur ?? '',
      no_batch: item.no_batch ?? '',
      expired_batch: tanggalLokalYMD(item.expired_batch),
      jumlah_dus: item.jumlah_dus,
      // Harga tersimpan per satuan SESUDAH PPN; kolom form adalah per dus SEBELUM PPN, dan PPN ikut terisi
      // dari nilai tersimpan, supaya menyimpan ulang tidak menghilangkan PPN.
      harga_beli_dus: item.harga_beli != null ? hargaBeliDusSebelumPPN(item.harga_beli, spd, ppnTersimpan, diskonTersimpan) : 0,
      harga_jual: item.harga_jual ?? 0,
      biaya_simpan_pct: 20,
      ppn_pct: ppnTersimpan,
      jatuh_tempo: tanggalLokalYMD(item.jatuh_tempo),
      catatan: item.catatan ?? '',
    },
  })

  const expiredBaru = useWatch({ control, name: 'expired_batch' })
  const jumlahDusBaru = useWatch({ control, name: 'jumlah_dus' })
  const sekarangMs = useNow().getTime()

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const galatServer = errors.root?.server?.message
  useEffect(() => {
    if (galatServer) document.getElementById('galat-server')?.scrollIntoView({ block: 'center' })
  }, [galatServer])

  async function onSubmit(values: FormValues) {
    clearErrors('root.server')
    try {
      await updateMutation.mutateAsync({
        tanggal: values.tanggal,
        supplier_id: parseInt(values.supplier_id_str),
        no_faktur: values.no_faktur,
        no_batch: values.no_batch,
        expired_batch: values.expired_batch,
        jumlah_dus: Number(values.jumlah_dus),
        harga_beli_dus: values.harga_beli_dus || undefined,
        harga_jual: values.harga_jual || undefined,
        // 0 adalah nilai valid (bukan "kosong") — jangan pakai `||` karena 0 ikut falsy
        biaya_simpan_pct: values.biaya_simpan_pct === undefined || isNaN(values.biaya_simpan_pct) ? undefined : values.biaya_simpan_pct,
        ppn_pct: values.ppn_pct || undefined,
        // String kosong menghapus jatuh tempo; nilainya berlaku untuk semua baris faktur yang sama.
        jatuh_tempo: values.jatuh_tempo ?? '',
        catatan: values.catatan || undefined,
      })
      onSuccess()
    } catch (err) {
      // Toast dari hook hilang sendiri; pesan server juga ditulis tetap di atas tombol Simpan.
      const galat = err as { response?: { data?: { message?: string } } }
      setError('root.server', { message: galat?.response?.data?.message ?? 'Perubahan belum bisa disimpan. Periksa koneksi, lalu coba lagi.' })
    }
  }

  function fokusGalat(galat: FieldErrors<FormValues>) {
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

      <FieldGroup className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
        <Field data-invalid={!!errors.supplier_id_str}>
          <FieldLabel htmlFor="supplier">Supplier <Wajib /></FieldLabel>
          <Controller
            name="supplier_id_str"
            control={control}
            rules={{ required: 'Pilih supplier' }}
            render={({ field }) => (
              <PilihanCombobox
                id="supplier"
                options={(supplierList ?? []).map((s) => ({ value: String(s.id), label: s.nama }))}
                value={field.value}
                onChange={field.onChange}
                placeholder="Pilih supplier"
                noun="supplier"
                error={!!errors.supplier_id_str}
                aria-required="true"
                aria-describedby={errors.supplier_id_str ? 'supplier-error' : undefined}
              />
            )}
          />
          <FieldError id="supplier-error">{errors.supplier_id_str?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.no_faktur}>
          <FieldLabel htmlFor="no_faktur">No. faktur <Wajib /></FieldLabel>
          <Input
            id="no_faktur"
            aria-required="true"
            aria-invalid={!!errors.no_faktur}
            aria-describedby={errors.no_faktur ? 'no_faktur-error' : undefined}
            className="h-10 rounded-xl"
            {...register('no_faktur', { required: 'No. faktur wajib diisi' })}
          />
          <FieldError id="no_faktur-error">{errors.no_faktur?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.tanggal}>
          <FieldLabel htmlFor="tanggal">Tanggal masuk <Wajib /></FieldLabel>
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

        <Field data-invalid={!!errors.jatuh_tempo}>
          <FieldLabel htmlFor="jatuh_tempo">Jatuh tempo <Opsional /></FieldLabel>
          <Input
            id="jatuh_tempo"
            type="date"
            aria-invalid={!!errors.jatuh_tempo}
            aria-describedby={errors.jatuh_tempo ? 'jatuh_tempo-error' : 'jatuh_tempo-hint'}
            className="h-10 rounded-xl"
            {...register('jatuh_tempo', {
              validate: (v) => !v || v >= getValues('tanggal') || 'Jatuh tempo tidak boleh sebelum tanggal masuk',
            })}
          />
          {errors.jatuh_tempo ? (
            <FieldError id="jatuh_tempo-error">{errors.jatuh_tempo.message}</FieldError>
          ) : (
            <FieldDescription id="jatuh_tempo-hint">Berlaku untuk semua obat di faktur ini.</FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!errors.ppn_pct}>
          <FieldLabel htmlFor="ppn_pct">PPN <Opsional /></FieldLabel>
          <InputSatuan
            id="ppn_pct"
            type="number"
            min="0"
            max="100"
            step="0.5"
            inputMode="decimal"
            akhiran="%"
            aria-invalid={!!errors.ppn_pct}
            aria-describedby={errors.ppn_pct ? 'ppn_pct-error' : 'ppn_pct-hint'}
            {...register('ppn_pct', {
              valueAsNumber: true,
              min: { value: 0, message: 'PPN minimal 0%' },
              max: { value: 100, message: 'PPN maksimal 100%' },
            })}
          />
          {errors.ppn_pct ? (
            <FieldError id="ppn_pct-error">{errors.ppn_pct.message}</FieldError>
          ) : (
            <FieldDescription id="ppn_pct-hint">Isi bila harga di faktur belum termasuk PPN.</FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!errors.no_batch}>
          <FieldLabel htmlFor="no_batch">No. batch <Wajib /></FieldLabel>
          <Input
            id="no_batch"
            aria-required="true"
            aria-invalid={!!errors.no_batch}
            aria-describedby={errors.no_batch ? 'no_batch-error' : undefined}
            className="h-10 rounded-xl"
            {...register('no_batch', { required: 'No. batch wajib diisi' })}
          />
          <FieldError id="no_batch-error">{errors.no_batch?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.expired_batch}>
          <FieldLabel htmlFor="expired_batch">Tanggal expired <Wajib /></FieldLabel>
          <Input
            id="expired_batch"
            type="date"
            aria-required="true"
            aria-invalid={!!errors.expired_batch}
            aria-describedby={errors.expired_batch ? 'expired_batch-error' : cekExpired(expiredBaru, sekarangMs) ? 'expired_batch-peringatan' : undefined}
            className="h-10 rounded-xl"
            {...register('expired_batch', { required: 'Tanggal expired wajib diisi' })}
          />
          <FieldError id="expired_batch-error">{errors.expired_batch?.message}</FieldError>
          {!errors.expired_batch && <PeringatanExpired id="expired_batch-peringatan" tanggal={expiredBaru} />}
        </Field>

        <Field data-invalid={!!errors.jumlah_dus}>
          <FieldLabel htmlFor="jumlah_dus">Jumlah (dus) <Wajib /></FieldLabel>
          <InputSatuan
            id="jumlah_dus"
            type="number"
            step="any"
            min="0.01"
            inputMode="decimal"
            aria-required="true"
            aria-invalid={!!errors.jumlah_dus}
            aria-describedby={errors.jumlah_dus ? 'jumlah_dus-error' : 'jumlah_dus-hint'}
            {...register('jumlah_dus', {
              valueAsNumber: true,
              required: 'Jumlah wajib diisi',
              min: { value: 0.01, message: 'Jumlah harus lebih dari 0' },
            })}
          />
          {errors.jumlah_dus ? (
            <FieldError id="jumlah_dus-error">{errors.jumlah_dus.message}</FieldError>
          ) : (
            <HintJumlahDus
              id="jumlah_dus-hint"
              dus={Number(jumlahDusBaru)}
              satuanPerDus={spd}
              satuan={item.satuan}
              // Stok sesudah ubah = stok sekarang dikurangi jumlah catatan ini yang lama, lalu ditambah jumlah baru.
              stokSebelum={stokObat !== undefined ? stokObat - item.jumlah_satuan : undefined}
            />
          )}
        </Field>

        <Field data-invalid={!!errors.biaya_simpan_pct}>
          <FieldLabel htmlFor="biaya_simpan_pct">Biaya simpan (H) <Opsional /></FieldLabel>
          <InputSatuan
            id="biaya_simpan_pct"
            type="number"
            min="0"
            max="100"
            step="0.5"
            inputMode="decimal"
            akhiran="%"
            aria-invalid={!!errors.biaya_simpan_pct}
            aria-describedby={errors.biaya_simpan_pct ? 'biaya_simpan_pct-error' : 'biaya_simpan_pct-hint'}
            {...register('biaya_simpan_pct', {
              valueAsNumber: true,
              min: { value: 0, message: 'Biaya simpan harus antara 0 sampai 100' },
              max: { value: 100, message: 'Biaya simpan harus antara 0 sampai 100' },
            })}
          />
          {errors.biaya_simpan_pct ? (
            <FieldError id="biaya_simpan_pct-error">{errors.biaya_simpan_pct.message}</FieldError>
          ) : (
            <FieldDescription id="biaya_simpan_pct-hint">Dipakai untuk menghitung EOQ dan ROP.</FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="harga_beli_dus">Harga beli per dus <Opsional /></FieldLabel>
          <InputSatuan
            id="harga_beli_dus"
            type="number"
            min="0"
            step="100"
            inputMode="numeric"
            awalan="Rp"
            {...register('harga_beli_dus', { valueAsNumber: true, min: 0 })}
            aria-describedby="harga_beli_dus-hint"
          />
          <FieldDescription id="harga_beli_dus-hint">Kosong = belum diisi. Harga obat tidak berubah.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="harga_jual">Harga jual per {item.satuan} <Opsional /></FieldLabel>
          <InputSatuan
            id="harga_jual"
            type="number"
            min="0"
            step="100"
            inputMode="numeric"
            awalan="Rp"
            {...register('harga_jual', { valueAsNumber: true, min: 0 })}
            aria-describedby="harga_jual-hint"
          />
          <FieldDescription id="harga_jual-hint">Kosong = tetap memakai harga jual obat sekarang, bila sudah ada.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="catatan">Catatan <Opsional /></FieldLabel>
          <Input id="catatan" placeholder="Catatan tambahan" className="h-10 rounded-xl" {...register('catatan')} />
        </Field>
      </FieldGroup>

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
