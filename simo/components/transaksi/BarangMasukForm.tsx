'use client'

import { useForm, Controller } from 'react-hook-form'
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
import { useCreateBarangMasuk } from '@/hooks/useBarangMasuk'
import { useObatList } from '@/hooks/useObat'
import { useSupplierList } from '@/hooks/useSupplier'
import type { BarangMasukFormData } from '@/types/obat'

interface Props {
  onSuccess: () => void
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-gray-700 mb-1 block">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export default function BarangMasukForm({ onSuccess }: Props) {
  const { data: obatData } = useObatList({ limit: 999 })
  const { data: supplierList } = useSupplierList()
  const createMutation = useCreateBarangMasuk()

  const obatList = obatData?.data ?? []

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BarangMasukFormData & { obat_id_str: string; supplier_id_str: string }>({
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      obat_id_str: '',
      jumlah_dus: 0,
      supplier_id_str: '',
      no_faktur: '',
      no_batch: '',
      expired_batch: '',
      harga_beli_dus: 0,
      harga_jual: 0,
      biaya_simpan_pct: 20,
      catatan: '',
    },
  })

  const watchedObatIdStr = watch('obat_id_str')
  const watchedJumlahDus = watch('jumlah_dus')
  const selectedObat = obatList.find((o) => String(o.id) === watchedObatIdStr)
  const jumlahSatuanPreview =
    selectedObat && watchedJumlahDus > 0
      ? Math.round(Number(watchedJumlahDus) * selectedObat.satuan_per_dus)
      : null

  async function onSubmit(values: BarangMasukFormData & { obat_id_str: string; supplier_id_str: string }) {
    if (!values.obat_id_str) return
    const payload: BarangMasukFormData = {
      tanggal: values.tanggal,
      obat_id: parseInt(values.obat_id_str),
      jumlah_dus: Number(values.jumlah_dus),
      supplier_id: values.supplier_id_str ? parseInt(values.supplier_id_str) : undefined,
      no_faktur: values.no_faktur || undefined,
      no_batch: values.no_batch || undefined,
      expired_batch: values.expired_batch || undefined,
      harga_beli_dus: values.harga_beli_dus || undefined,
      harga_jual: values.harga_jual || undefined,
      biaya_simpan_pct: values.harga_beli_dus ? (values.biaya_simpan_pct ?? 20) : undefined,
      catatan: values.catatan || undefined,
    }
    await createMutation.mutateAsync(payload)
    reset()
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

      {/* 1. Supplier */}
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
        {errors.supplier_id_str && <p className="text-xs text-red-500 mt-1">Wajib dipilih</p>}
      </div>

      {/* 2. No. Faktur + Tanggal */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>No. Faktur</FieldLabel>
          <Input
            placeholder="cth. 112/PBF/2026"
            {...register('no_faktur', { required: true })}
          />
          {errors.no_faktur && <p className="text-xs text-red-500 mt-1">Wajib diisi</p>}
        </div>
        <div>
          <FieldLabel required>Tanggal</FieldLabel>
          <Input type="date" {...register('tanggal', { required: true })} />
          {errors.tanggal && <p className="text-xs text-red-500 mt-1">Wajib diisi</p>}
        </div>
      </div>

      {/* 3. Obat */}
      <div>
        <FieldLabel required>Obat</FieldLabel>
        <Controller
          name="obat_id_str"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <ObatCombobox
              obatList={obatList}
              value={field.value}
              onChange={field.onChange}
              error={!!errors.obat_id_str}
            />
          )}
        />
        {errors.obat_id_str && <p className="text-xs text-red-500 mt-1">Obat wajib dipilih</p>}
        {selectedObat && (
          <p className="text-xs text-gray-400 mt-1">
            Stok:{' '}
            <span className="font-medium text-gray-600">{selectedObat.stok} {selectedObat.satuan}</span>
            {' · '}1 dus = {selectedObat.satuan_per_dus} {selectedObat.satuan}
          </p>
        )}
      </div>

      {/* 4. Jumlah Dus */}
      <div>
        <FieldLabel required>Jumlah Dus</FieldLabel>
        <Input
          type="number"
          step="any"
          min="0.01"
          placeholder="cth. 2.5"
          {...register('jumlah_dus', { required: true, min: 0.01, valueAsNumber: true })}
        />
        {errors.jumlah_dus && <p className="text-xs text-red-500 mt-1">Harus lebih dari 0</p>}
        {jumlahSatuanPreview !== null && (
          <p className="text-xs text-blue-600 font-medium mt-1">
            = {jumlahSatuanPreview} {selectedObat?.satuan} akan ditambahkan ke stok
          </p>
        )}
      </div>

      {/* 5. No. Batch + Expired Batch */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>No. Batch</FieldLabel>
          <Input
            placeholder="cth. B501J26"
            {...register('no_batch', { required: true })}
          />
          {errors.no_batch && <p className="text-xs text-red-500 mt-1">Wajib diisi</p>}
        </div>
        <div>
          <FieldLabel required>Expired Batch</FieldLabel>
          <Input type="date" {...register('expired_batch', { required: true })} />
          {errors.expired_batch && <p className="text-xs text-red-500 mt-1">Wajib diisi</p>}
        </div>
      </div>

      {/* Harga */}
      <div className="border-t border-gray-100 pt-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Harga</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <FieldLabel>Harga Beli / Dus</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">Rp</span>
            <Input
              type="number"
              min="0"
              step="100"
              placeholder="0"
              className="pl-8"
              {...register('harga_beli_dus', { valueAsNumber: true, min: 0 })}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Harga Jual / {selectedObat?.satuan ?? 'Satuan'}</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">Rp</span>
            <Input
              type="number"
              min="0"
              step="100"
              placeholder="0"
              className="pl-8"
              {...register('harga_jual', { valueAsNumber: true, min: 0 })}
            />
          </div>
        </div>
        <div>
          <FieldLabel>% Biaya Simpan</FieldLabel>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              className="pr-8"
              {...register('biaya_simpan_pct', { valueAsNumber: true, min: 0, max: 100 })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
          </div>
        </div>
      </div>
      {selectedObat && (watch('harga_beli_dus') ?? 0) > 0 && (() => {
        const beliPerSatuan = (watch('harga_beli_dus') ?? 0) / (selectedObat.satuan_per_dus || 1)
        const pct = watch('biaya_simpan_pct') ?? 20
        const biayaSimpanRp = beliPerSatuan * (pct / 100)
        const hargaJual = watch('harga_jual') ?? 0
        const margin = hargaJual > 0 ? (((hargaJual - beliPerSatuan) / beliPerSatuan) * 100).toFixed(1) : null
        return (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs -mt-1">
            <span className="text-gray-400">= Rp {beliPerSatuan.toLocaleString('id-ID', { maximumFractionDigits: 0 })} / {selectedObat.satuan}</span>
            {margin !== null && (
              <span className={`font-medium ${parseFloat(margin) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                Margin: {margin}%
              </span>
            )}
            <span className="text-emerald-700 font-medium">
              H = Rp {biayaSimpanRp.toLocaleString('id-ID', { maximumFractionDigits: 0 })} / {selectedObat.satuan}/thn
            </span>
          </div>
        )
      })()}
      <p className="text-xs text-gray-400 -mt-1">
        Opsional. Jika harga beli diisi, harga &amp; EOQ/ROP di data obat otomatis diperbarui.
      </p>

      {/* Catatan */}
      <div>
        <FieldLabel>Catatan</FieldLabel>
        <Input
          placeholder="Catatan tambahan (opsional)"
          {...register('catatan')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm"
          onClick={() => { reset(); onSuccess() }}
        >
          Batal
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>

    </form>
  )
}
