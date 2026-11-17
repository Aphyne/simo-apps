'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray, useWatch, Controller, type FieldErrors } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ObatCombobox from '@/components/ui/ObatCombobox'
import IconAction from '@/components/shared/IconAction'
import { FormActions, FormSection, InputSatuan, Opsional, Wajib } from '@/components/shared/FormParts'
import { useCreateBarangMasukBulk } from '@/hooks/useBarangMasuk'
import { useObatSemua } from '@/hooks/useObat'
import { useSupplierDropdown } from '@/hooks/useSupplier'
import PeringatanExpired, { cekExpired } from '@/components/transaksi/PeringatanExpired'
import HintJumlahDus from '@/components/transaksi/HintJumlahDus'
import { konversiDus } from '@/lib/barangMasuk'
import { useNow } from '@/hooks/useNow'
import { cn, formatAngka, formatRupiah } from '@/lib/utils'
import type { Obat } from '@/types/obat'

interface Props {
  onSuccess: () => void
  // Tombol Batal. Induk menentukan apakah perlu konfirmasi membuang isian (lihat onDirtyChange).
  onBatal: () => void
  // Dikabari setiap isian berubah atau kembali bersih, supaya dialog tidak tertutup diam-diam saat ada isian.
  onDirtyChange?: (kotor: boolean) => void
}

interface ItemForm {
  obat_id_str: string
  no_batch: string
  expired_batch: string
  jumlah_dus: number
  harga_beli_dus: number
  harga_jual: number
  biaya_simpan_pct: number
}

interface FormValues {
  supplier_id_str: string
  no_faktur: string
  tanggal: string
  jatuh_tempo: string
  ppn_pct: number
  catatan: string
  items: ItemForm[]
}

const EMPTY_ITEM: ItemForm = {
  obat_id_str: '',
  no_batch: '',
  expired_batch: '',
  jumlah_dus: 0,
  harga_beli_dus: 0,
  harga_jual: 0,
  biaya_simpan_pct: 20,
}

// Tanggal bawaan memakai jam setempat (toISOString memakai UTC, sebelum 07.00 WIB hasilnya kemarin).
function tanggalLokal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const KOLOM_ITEM: (keyof ItemForm)[] = ['obat_id_str', 'no_batch', 'expired_batch', 'jumlah_dus', 'harga_beli_dus', 'harga_jual', 'biaya_simpan_pct']
const ID_ITEM: Record<keyof ItemForm, string> = {
  obat_id_str: 'obat',
  no_batch: 'batch',
  expired_batch: 'expired',
  jumlah_dus: 'dus',
  biaya_simpan_pct: 'simpan',
  harga_beli_dus: 'beli',
  harga_jual: 'jual',
}

// Ringkasan harga riil per dus (setelah PPN) dan margin. Satu kalimat, bukan kotak.
function HargaRingkas({ obat, item, ppnPct }: { obat?: Obat; item: ItemForm; ppnPct: number }) {
  if (!obat || !item.harga_beli_dus) return null
  const spd = obat.satuan_per_dus || 1
  const hargaRiilDus = item.harga_beli_dus * (1 + (ppnPct || 0) / 100)
  const beliPerSatuan = hargaRiilDus / spd
  const margin = item.harga_jual > 0 ? ((item.harga_jual - beliPerSatuan) / beliPerSatuan) * 100 : null

  return (
    <p className="text-sm text-muted-foreground" role="status">
      Harga beli riil {formatRupiah(Math.round(hargaRiilDus))} per dus{ppnPct > 0 ? ' (setelah PPN)' : ''}, atau {formatRupiah(Math.round(beliPerSatuan))} per {obat.satuan}.
      {margin !== null && (
        <>
          {' '}
          <span className={cn('font-medium', margin >= 0 ? 'text-foreground' : 'text-danger-700')}>
            Margin {formatAngka(margin, 1)}%{margin < 0 ? ', harga jual di bawah harga beli' : ''}.
          </span>
        </>
      )}
    </p>
  )
}

export default function BarangMasukForm({ onSuccess, onBatal, onDirtyChange }: Props) {
  const { data: obatData } = useObatSemua()
  const { data: supplierList } = useSupplierDropdown()
  const bulkMutation = useCreateBarangMasukBulk()

  const obatList = obatData?.data ?? []

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isDirty },
    getValues,
  } = useForm<FormValues>({
    // Fokus galat pertama diatur sendiri (fokusGalat) supaya Select dan kolom cari obat juga mendapat fokus.
    shouldFocusError: false,
    defaultValues: {
      supplier_id_str: '',
      no_faktur: '',
      tanggal: tanggalLokal(),
      jatuh_tempo: '',
      ppn_pct: 0,
      catatan: '',
      items: [{ ...EMPTY_ITEM }],
    },
  })

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Galat dari server berada di dasar form yang panjang: gulir ke sana supaya terlihat.
  const galatServer = errors.root?.server?.message
  useEffect(() => {
    if (galatServer) document.getElementById('galat-server')?.scrollIntoView({ block: 'center' })
  }, [galatServer])

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = useWatch({ control, name: 'items' })
  const sekarangMs = useNow().getTime()
  const watchedPpn = useWatch({ control, name: 'ppn_pct' })

  async function onSubmit(values: FormValues) {
    clearErrors('root.server')
    const items = values.items.map((it) => ({
      obat_id: parseInt(it.obat_id_str),
      no_batch: it.no_batch,
      expired_batch: it.expired_batch,
      jumlah_dus: Number(it.jumlah_dus),
      harga_beli_dus: it.harga_beli_dus || undefined,
      harga_jual: it.harga_jual || undefined,
      // 0 adalah nilai valid (bukan "kosong") — jangan pakai `||` karena 0 ikut falsy
      biaya_simpan_pct: it.biaya_simpan_pct === undefined || isNaN(it.biaya_simpan_pct) ? undefined : it.biaya_simpan_pct,
    }))

    try {
      await bulkMutation.mutateAsync({
        tanggal: values.tanggal,
        supplier_id: parseInt(values.supplier_id_str),
        no_faktur: values.no_faktur,
        ppn_pct: values.ppn_pct || undefined,
        jatuh_tempo: values.jatuh_tempo || undefined,
        catatan: values.catatan || undefined,
        items,
      })
      onSuccess()
    } catch (err) {
      // Toast dari hook hilang sendiri; pesan server juga ditulis tetap di atas tombol Simpan.
      const galat = err as { response?: { data?: { message?: string } } }
      setError('root.server', { message: galat?.response?.data?.message ?? 'Stok masuk belum bisa disimpan. Periksa koneksi, lalu coba lagi.' })
    }
  }

  // Fokus dan gulir ke kolom pertama yang salah, urut seperti di layar.
  function fokusGalat(galat: FieldErrors<FormValues>) {
    let id: string | null = null
    if (galat.supplier_id_str) id = 'supplier'
    else if (galat.no_faktur) id = 'no_faktur'
    else if (galat.tanggal) id = 'tanggal'
    else if (galat.jatuh_tempo) id = 'jatuh_tempo'
    else if (galat.ppn_pct) id = 'ppn_pct'
    else {
      const baris = galat.items
      if (Array.isArray(baris)) {
        for (let i = 0; i < baris.length && !id; i++) {
          const kolom = KOLOM_ITEM.find((k) => baris[i]?.[k])
          if (kolom) id = `item-${i}-${ID_ITEM[kolom]}`
        }
      }
    }
    const el = id ? document.getElementById(id) : null
    el?.focus()
    el?.scrollIntoView({ block: 'center' })
  }

  return (
    // noValidate: galat ditulis inline oleh form ini, bukan balon bawaan peramban.
    <form onSubmit={handleSubmit(onSubmit, fokusGalat)} noValidate className="space-y-6">

      <p className="text-sm text-muted-foreground">
        <span className="text-destructive" aria-hidden="true">*</span> Wajib diisi
      </p>

      {/* ── Faktur: berlaku untuk semua obat di bawahnya ─────────────────── */}
      <FormSection title="Faktur" description="Berlaku untuk semua obat dalam faktur ini.">
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-6">
          <Field className="md:col-span-3" data-invalid={!!errors.supplier_id_str}>
            <FieldLabel htmlFor="supplier">Supplier <Wajib /></FieldLabel>
            <Controller
              name="supplier_id_str"
              control={control}
              rules={{ required: 'Pilih supplier' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="supplier"
                    aria-required="true"
                    aria-invalid={!!errors.supplier_id_str}
                    aria-describedby={errors.supplier_id_str ? 'supplier-error' : undefined}
                    className="h-10 w-full rounded-xl data-[size=default]:h-10"
                  >
                    <SelectValue placeholder="Pilih supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {(supplierList ?? []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="supplier-error">{errors.supplier_id_str?.message}</FieldError>
          </Field>

          <Field className="md:col-span-3" data-invalid={!!errors.no_faktur}>
            <FieldLabel htmlFor="no_faktur">No. faktur <Wajib /></FieldLabel>
            <Input
              id="no_faktur"
              placeholder="Contoh: 112/PBF/2026"
              aria-required="true"
              aria-invalid={!!errors.no_faktur}
              aria-describedby={errors.no_faktur ? 'no_faktur-error' : undefined}
              className="h-10 rounded-xl"
              {...register('no_faktur', { required: 'No. faktur wajib diisi' })}
            />
            <FieldError id="no_faktur-error">{errors.no_faktur?.message}</FieldError>
          </Field>

          <Field className="md:col-span-2" data-invalid={!!errors.tanggal}>
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

          <Field className="md:col-span-2" data-invalid={!!errors.jatuh_tempo}>
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
              <FieldDescription id="jatuh_tempo-hint">Tanggal bayar ke PBF.</FieldDescription>
            )}
          </Field>

          <Field className="md:col-span-2" data-invalid={!!errors.ppn_pct}>
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
              <FieldDescription id="ppn_pct-hint">Isi bila harga belum termasuk PPN.</FieldDescription>
            )}
          </Field>
        </div>
      </FormSection>

      {/* ── Daftar obat: satu blok per obat. Dropdown pencarian tidak dibungkus overflow sendiri
          (supaya tidak terpotong); dialog pembungkus yang menggulir bila obat banyak. ───────── */}
      <FormSection title={`Daftar obat (${fields.length})`}>
        <div className="space-y-4">
          {fields.map((row, index) => {
            const item = watchedItems?.[index] ?? EMPTY_ITEM
            const selectedObat = obatList.find((o) => String(o.id) === item.obat_id_str)
            const itemErrors = errors.items?.[index]
            const p = `item-${index}`
            // Obat yang sama bisa muncul dua kali dalam satu faktur: stok sebelum baris ini ikut menghitung baris di atasnya.
            const tambahanDariAtas = selectedObat
              ? (watchedItems ?? []).slice(0, index)
                  .filter((x) => x.obat_id_str === item.obat_id_str)
                  .reduce((sum, x) => sum + konversiDus(Number(x.jumlah_dus) || 0, selectedObat.satuan_per_dus || 1), 0)
              : 0

            return (
              <div key={row.id} role="group" aria-label={`Obat ${index + 1}`} className="rounded-xl bg-muted/50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Obat {index + 1}</p>
                  <IconAction
                    type="button"
                    label={`Hapus obat ${index + 1}`}
                    className="-mr-2 -mt-2 text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 />
                  </IconAction>
                </div>

                <FieldGroup className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                  <Field className="md:col-span-2" data-invalid={!!itemErrors?.obat_id_str}>
                    <FieldLabel htmlFor={`${p}-obat`}>Obat <Wajib /></FieldLabel>
                    <Controller
                      name={`items.${index}.obat_id_str`}
                      control={control}
                      rules={{ required: 'Pilih obat' }}
                      render={({ field }) => (
                        <ObatCombobox
                          id={`${p}-obat`}
                          obatList={obatList}
                          value={field.value}
                          onChange={field.onChange}
                          error={!!itemErrors?.obat_id_str}
                          aria-describedby={itemErrors?.obat_id_str ? `${p}-obat-error` : `${p}-obat-hint`}
                        />
                      )}
                    />
                    {itemErrors?.obat_id_str ? (
                      <FieldError id={`${p}-obat-error`}>{itemErrors.obat_id_str.message}</FieldError>
                    ) : (
                      selectedObat && (
                        <FieldDescription id={`${p}-obat-hint`}>
                          Stok sekarang {formatAngka(selectedObat.stok, 0)} {selectedObat.satuan}. 1 dus berisi {formatAngka(selectedObat.satuan_per_dus, 0)} {selectedObat.satuan}.
                        </FieldDescription>
                      )
                    )}
                  </Field>

                  <Field data-invalid={!!itemErrors?.no_batch}>
                    <FieldLabel htmlFor={`${p}-batch`}>No. batch <Wajib /></FieldLabel>
                    <Input
                      id={`${p}-batch`}
                      placeholder="Contoh: B501J26"
                      aria-required="true"
                      aria-invalid={!!itemErrors?.no_batch}
                      aria-describedby={itemErrors?.no_batch ? `${p}-batch-error` : undefined}
                      className="h-10 rounded-xl"
                      {...register(`items.${index}.no_batch`, { required: 'No. batch wajib diisi' })}
                    />
                    <FieldError id={`${p}-batch-error`}>{itemErrors?.no_batch?.message}</FieldError>
                  </Field>

                  <Field data-invalid={!!itemErrors?.expired_batch}>
                    <FieldLabel htmlFor={`${p}-expired`}>Tanggal expired <Wajib /></FieldLabel>
                    <Input
                      id={`${p}-expired`}
                      type="date"
                      aria-required="true"
                      aria-invalid={!!itemErrors?.expired_batch}
                      aria-describedby={itemErrors?.expired_batch ? `${p}-expired-error` : cekExpired(item.expired_batch, sekarangMs) ? `${p}-expired-peringatan` : undefined}
                      className="h-10 rounded-xl"
                      {...register(`items.${index}.expired_batch`, { required: 'Tanggal expired wajib diisi' })}
                    />
                    <FieldError id={`${p}-expired-error`}>{itemErrors?.expired_batch?.message}</FieldError>
                    {!itemErrors?.expired_batch && <PeringatanExpired id={`${p}-expired-peringatan`} tanggal={item.expired_batch} />}
                  </Field>

                  <Field data-invalid={!!itemErrors?.jumlah_dus}>
                    <FieldLabel htmlFor={`${p}-dus`}>Jumlah (dus) <Wajib /></FieldLabel>
                    <InputSatuan
                      id={`${p}-dus`}
                      type="number"
                      step="any"
                      min="0.01"
                      inputMode="decimal"
                      placeholder="Contoh: 2,5"
                      aria-required="true"
                      aria-invalid={!!itemErrors?.jumlah_dus}
                      aria-describedby={itemErrors?.jumlah_dus ? `${p}-dus-error` : `${p}-dus-hint`}
                      {...register(`items.${index}.jumlah_dus`, {
                        valueAsNumber: true,
                        required: 'Jumlah wajib diisi',
                        min: { value: 0.01, message: 'Jumlah harus lebih dari 0' },
                      })}
                    />
                    {itemErrors?.jumlah_dus ? (
                      <FieldError id={`${p}-dus-error`}>{itemErrors.jumlah_dus.message}</FieldError>
                    ) : (
                      <HintJumlahDus
                        id={`${p}-dus-hint`}
                        dus={Number(item.jumlah_dus)}
                        satuanPerDus={selectedObat?.satuan_per_dus || undefined}
                        satuan={selectedObat?.satuan}
                        stokSebelum={selectedObat ? Number(selectedObat.stok) + tambahanDariAtas : undefined}
                      />
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`${p}-beli`}>Harga beli per dus <Opsional /></FieldLabel>
                    <InputSatuan
                      id={`${p}-beli`}
                      type="number"
                      min="0"
                      step="100"
                      inputMode="numeric"
                      awalan="Rp"
                      placeholder="0"
                      {...register(`items.${index}.harga_beli_dus`, { valueAsNumber: true, min: 0 })}
                      aria-describedby={`${p}-beli-hint`}
                    />
                    <FieldDescription id={`${p}-beli-hint`}>Kosong = belum diisi. Harga obat tidak berubah.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`${p}-jual`}>Harga jual per {selectedObat?.satuan ?? 'satuan'} <Opsional /></FieldLabel>
                    <InputSatuan
                      id={`${p}-jual`}
                      type="number"
                      min="0"
                      step="100"
                      inputMode="numeric"
                      awalan="Rp"
                      placeholder="0"
                      {...register(`items.${index}.harga_jual`, { valueAsNumber: true, min: 0 })}
                      aria-describedby={`${p}-jual-hint`}
                    />
                    <FieldDescription id={`${p}-jual-hint`}>
                      {selectedObat && Number(selectedObat.harga_jual) > 0
                        ? `Kosong = tetap ${formatRupiah(Number(selectedObat.harga_jual))} (harga sekarang).`
                        : 'Kosong = belum diisi.'}
                    </FieldDescription>
                  </Field>
                  <Field data-invalid={!!itemErrors?.biaya_simpan_pct}>
                    <FieldLabel htmlFor={`${p}-simpan`}>Biaya simpan (H) <Opsional /></FieldLabel>
                    <InputSatuan
                      id={`${p}-simpan`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      inputMode="decimal"
                      akhiran="%"
                      aria-invalid={!!itemErrors?.biaya_simpan_pct}
                      aria-describedby={itemErrors?.biaya_simpan_pct ? `${p}-simpan-error` : `${p}-simpan-hint`}
                      {...register(`items.${index}.biaya_simpan_pct`, {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Biaya simpan harus antara 0 sampai 100' },
                        max: { value: 100, message: 'Biaya simpan harus antara 0 sampai 100' },
                      })}
                    />
                    {itemErrors?.biaya_simpan_pct ? (
                      <FieldError id={`${p}-simpan-error`}>{itemErrors.biaya_simpan_pct.message}</FieldError>
                    ) : (
                      <FieldDescription id={`${p}-simpan-hint`}>Dipakai untuk menghitung EOQ dan ROP.</FieldDescription>
                    )}
                  </Field>

                </FieldGroup>

                <div className="mt-4 empty:hidden">
                  <HargaRingkas obat={selectedObat} item={item} ppnPct={watchedPpn} />
                </div>
              </div>
            )
          })}

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-xl"
            onClick={() => append({ ...EMPTY_ITEM })}
          >
            <Plus data-icon="inline-start" />
            Tambah obat lain
          </Button>
        </div>
      </FormSection>

      <Field>
        <FieldLabel htmlFor="catatan">Catatan <Opsional /></FieldLabel>
        <Input id="catatan" placeholder="Catatan tambahan untuk faktur ini" className="h-10 rounded-xl" {...register('catatan')} />
      </Field>

      {/* Gagal menyimpan: pesan server tetap tampil sampai dicoba lagi (toast hilang sendiri) */}
      {errors.root?.server?.message && (
        <FieldError id="galat-server" className="rounded-xl bg-destructive/10 px-4 py-3">{errors.root.server.message}</FieldError>
      )}

      <FormActions className="sticky -bottom-5 z-10 -mx-5 -mb-5 bg-popover px-5 pb-5">
        <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={onBatal}>
          Batal
        </Button>
        <Button type="submit" className="h-10 min-w-40 rounded-xl px-4" disabled={bulkMutation.isPending}>
          {bulkMutation.isPending ? 'Menyimpan...' : 'Simpan stok masuk'}
        </Button>
      </FormActions>

    </form>
  )
}
