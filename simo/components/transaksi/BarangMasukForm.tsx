'use client'

import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
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

const fieldCls = "h-9 w-full border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

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
      expired_batch: '',
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
      expired_batch: values.expired_batch || undefined,
      catatan: values.catatan || undefined,
    }
    await createMutation.mutateAsync(payload)
    reset()
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

      {/* Tanggal + Jumlah Dus */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Tanggal</FieldLabel>
          <input
            type="date"
            className={fieldCls}
            {...register('tanggal', { required: true })}
          />
          {errors.tanggal && <p className="text-xs text-red-500 mt-1">Wajib diisi</p>}
        </div>
        <div>
          <FieldLabel required>Jumlah Dus</FieldLabel>
          <input
            type="number"
            step="any"
            min="0.01"
            placeholder="Contoh: 2.5"
            className={fieldCls}
            {...register('jumlah_dus', { required: true, min: 0.01, valueAsNumber: true })}
          />
          {errors.jumlah_dus && <p className="text-xs text-red-500 mt-1">Harus lebih dari 0</p>}
        </div>
      </div>

      {jumlahSatuanPreview !== null && (
        <p className="text-xs text-blue-600 font-medium -mt-1">
          = {jumlahSatuanPreview} {selectedObat?.satuan} akan ditambahkan ke stok
        </p>
      )}

      {/* Obat */}
      <div>
        <FieldLabel required>Obat</FieldLabel>
        <Controller
          name="obat_id_str"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <select {...field} className={fieldCls}>
              <option value="">Pilih obat...</option>
              {obatList.map((o) => (
                <option key={o.id} value={String(o.id)}>
                  {o.nama} ({o.kode})
                </option>
              ))}
            </select>
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

      {/* Divider */}
      <div className="border-t border-gray-100 pt-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Detail Tambahan</p>
      </div>

      {/* Supplier */}
      <div>
        <FieldLabel>Supplier</FieldLabel>
        <Controller
          name="supplier_id_str"
          control={control}
          render={({ field }) => (
            <select {...field} className={fieldCls}>
              <option value="">Pilih supplier (opsional)</option>
              <option value="none">— Tidak ada —</option>
              {(supplierList ?? []).map((s) => (
                <option key={s.id} value={String(s.id)}>{s.nama}</option>
              ))}
            </select>
          )}
        />
      </div>

      {/* No. Faktur + Expired Batch */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>No. Faktur</FieldLabel>
          <input
            placeholder="Opsional"
            className={fieldCls}
            {...register('no_faktur')}
          />
        </div>
        <div>
          <FieldLabel>Expired Batch</FieldLabel>
          <input
            type="date"
            className={fieldCls}
            {...register('expired_batch')}
          />
        </div>
      </div>

      {/* Catatan */}
      <div>
        <FieldLabel>Catatan</FieldLabel>
        <input
          placeholder="Catatan tambahan (opsional)"
          className={fieldCls}
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
