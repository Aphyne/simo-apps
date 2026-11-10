'use client'

import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ObatCombobox from '@/components/ui/ObatCombobox'
import { useCreateBarangMasukBulk } from '@/hooks/useBarangMasuk'
import { useObatList } from '@/hooks/useObat'
import { useSupplierDropdown } from '@/hooks/useSupplier'
import type { Obat } from '@/types/obat'

interface Props {
  onSuccess: () => void
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

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-fg-secondary mb-1 block">
      {children}
      {required && <span className="text-danger-600 ml-0.5">*</span>}
    </label>
  )
}

// ─── Preview harga riil per dus (setelah PPN) + margin ───────────────────────
function HargaPreview({ obat, item, ppnPct }: { obat?: Obat; item: ItemForm; ppnPct: number }) {
  if (!obat || !item.harga_beli_dus) return null
  const spd = obat.satuan_per_dus || 1
  const hargaRiilDus = item.harga_beli_dus * (1 + (ppnPct || 0) / 100)
  const beliPerSatuan = hargaRiilDus / spd
  const margin = item.harga_jual > 0 ? (((item.harga_jual - beliPerSatuan) / beliPerSatuan) * 100).toFixed(1) : null

  return (
    <p className="text-xs text-fg-muted flex flex-wrap gap-x-3">
      <span>
        = Rp {hargaRiilDus.toLocaleString('id-ID', { maximumFractionDigits: 0 })}/dus riil
        {ppnPct > 0 && ' (setelah PPN)'}
        {' · '}Rp {beliPerSatuan.toLocaleString('id-ID', { maximumFractionDigits: 0 })}/{obat.satuan}
      </span>
      {margin !== null && (
        <span className={parseFloat(margin) >= 0 ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'}>
          Margin: {margin}%
        </span>
      )}
    </p>
  )
}

export default function BarangMasukForm({ onSuccess }: Props) {
  const { data: obatData } = useObatList({ limit: 999 })
  const { data: supplierList } = useSupplierDropdown()
  const bulkMutation = useCreateBarangMasukBulk()

  const obatList = obatData?.data ?? []

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      supplier_id_str: '',
      no_faktur: '',
      tanggal: new Date().toISOString().split('T')[0],
      ppn_pct: 0,
      catatan: '',
      items: [{ ...EMPTY_ITEM }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = useWatch({ control, name: 'items' })
  const watchedPpn = useWatch({ control, name: 'ppn_pct' })

  async function onSubmit(values: FormValues) {
    if (!values.supplier_id_str) return

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

    await bulkMutation.mutateAsync({
      tanggal: values.tanggal,
      supplier_id: parseInt(values.supplier_id_str),
      no_faktur: values.no_faktur,
      ppn_pct: values.ppn_pct || undefined,
      catatan: values.catatan || undefined,
      items,
    })
    reset()
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

      {/* ── Bagian atas: shared per faktur ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Supplier</FieldLabel>
          <Controller
            name="supplier_id_str"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Pilih supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {(supplierList ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.supplier_id_str && <p className="text-xs text-danger-600 mt-1">Wajib dipilih</p>}
        </div>
        <div>
          <FieldLabel required>No. Faktur</FieldLabel>
          <Input placeholder="cth. 112/PBF/2026" {...register('no_faktur', { required: true })} />
          {errors.no_faktur && <p className="text-xs text-danger-600 mt-1">Wajib diisi</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Tanggal</FieldLabel>
          <Input type="date" {...register('tanggal', { required: true })} />
          {errors.tanggal && <p className="text-xs text-danger-600 mt-1">Wajib diisi</p>}
        </div>
        <div>
          <FieldLabel>PPN % (opsional)</FieldLabel>
          <div className="relative">
            <Input
              type="number" min="0" max="100" step="0.5" className="pr-8"
              {...register('ppn_pct', { valueAsNumber: true, min: 0, max: 100 })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fg-muted pointer-events-none">%</span>
          </div>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="border-t border-line-subtle pt-1">
        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide">
          Daftar Obat ({fields.length})
        </p>
      </div>

      {/* ── Kartu per item — TIDAK dibungkus overflow-y-auto sendiri,      ─
          biar dropdown ObatCombobox tidak kepotong (pelajaran dari Fase 14).
          Dialog pembungkus form ini yang menangani scroll kalau item banyak. */}
      <div className="space-y-3">
        {fields.map((row, index) => {
          const item = watchedItems?.[index] ?? EMPTY_ITEM
          const selectedObat = obatList.find((o) => String(o.id) === item.obat_id_str)
          const itemErrors = errors.items?.[index]

          return (
            <div key={row.id} className="rounded-lg border border-line p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-fg-muted">Obat {index + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-fg-subtle hover:text-danger-600 hover:bg-danger-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-fg-subtle transition-colors"
                  aria-label="Hapus baris"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <Controller
                name={`items.${index}.obat_id_str`}
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <ObatCombobox obatList={obatList} value={field.value} onChange={field.onChange} error={!!itemErrors?.obat_id_str} />
                )}
              />
              {itemErrors?.obat_id_str && <p className="text-xs text-danger-600">Obat wajib dipilih</p>}
              {selectedObat && (
                <p className="text-xs text-fg-muted">
                  Stok: <span className="font-medium text-fg-tertiary">{selectedObat.stok} {selectedObat.satuan}</span>
                  {' · '}1 dus = {selectedObat.satuan_per_dus} {selectedObat.satuan}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel required>No. Batch</FieldLabel>
                  <Input placeholder="cth. B501J26" {...register(`items.${index}.no_batch`, { required: true })} />
                  {itemErrors?.no_batch && <p className="text-xs text-danger-600 mt-1">Wajib diisi</p>}
                </div>
                <div>
                  <FieldLabel required>Expired Batch</FieldLabel>
                  <Input type="date" {...register(`items.${index}.expired_batch`, { required: true })} />
                  {itemErrors?.expired_batch && <p className="text-xs text-danger-600 mt-1">Wajib diisi</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel required>Qty Dus</FieldLabel>
                  <Input
                    type="number" step="any" min="0.01" placeholder="cth. 2.5"
                    {...register(`items.${index}.jumlah_dus`, { required: true, min: 0.01, valueAsNumber: true })}
                  />
                  {itemErrors?.jumlah_dus && <p className="text-xs text-danger-600 mt-1">Harus &gt; 0</p>}
                </div>
                <div>
                  <FieldLabel>
                    % Biaya Simpan <span className="text-fg-muted font-normal">(H)</span>
                  </FieldLabel>
                  <div className="relative">
                    <Input type="number" min="0" max="100" step="0.5" className="pr-6"
                      {...register(`items.${index}.biaya_simpan_pct`, { valueAsNumber: true, min: 0, max: 100 })} />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-fg-muted pointer-events-none">%</span>
                  </div>
                  {itemErrors?.biaya_simpan_pct && <p className="text-xs text-danger-600 mt-1">Biaya simpan harus antara 0 sampai 100</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Harga Beli/Dus</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-fg-muted pointer-events-none">Rp</span>
                    <Input type="number" min="0" step="100" placeholder="0" className="pl-7"
                      {...register(`items.${index}.harga_beli_dus`, { valueAsNumber: true, min: 0 })} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Harga Jual/{selectedObat?.satuan ?? 'satuan'}</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-fg-muted pointer-events-none">Rp</span>
                    <Input type="number" min="0" step="100" placeholder="0" className="pl-7"
                      {...register(`items.${index}.harga_jual`, { valueAsNumber: true, min: 0 })} />
                  </div>
                </div>
              </div>

              <HargaPreview obat={selectedObat} item={item} ppnPct={watchedPpn} />
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => append({ ...EMPTY_ITEM })}
        className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 border border-dashed border-brand-300 hover:border-brand-500 rounded-lg py-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Tambah Obat
      </button>

      {/* Catatan */}
      <div>
        <FieldLabel>Catatan</FieldLabel>
        <Input placeholder="Catatan tambahan (opsional)" {...register('catatan')} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-line-subtle">
        <Button
          type="button"
          variant="outline"
          className="border-line-strong text-fg-secondary hover:bg-surface-subtle rounded-lg px-4 py-2 text-sm"
          onClick={() => { reset(); onSuccess() }}
        >
          Batal
        </Button>
        <Button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-fg-inverse font-medium rounded-lg px-4 py-2 text-sm"
          disabled={bulkMutation.isPending}
        >
          {bulkMutation.isPending ? 'Menyimpan...' : 'Simpan Semua'}
        </Button>
      </div>

    </form>
  )
}
