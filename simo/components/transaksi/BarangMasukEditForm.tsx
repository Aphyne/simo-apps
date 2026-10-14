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
import { useUpdateBarangMasuk } from '@/hooks/useBarangMasuk'
import { useSupplierList } from '@/hooks/useSupplier'
import type { BarangMasuk, BarangMasukUpdateFormData } from '@/types/obat'

interface Props {
  item: BarangMasuk
  onSuccess: () => void
}

interface FormValues extends BarangMasukUpdateFormData {
  supplier_id_str: string
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-gray-700 mb-1 block">
      {children}
      {required && <span className="text-red-600 ml-0.5">*</span>}
    </label>
  )
}

export default function BarangMasukEditForm({ item, onSuccess }: Props) {
  const { data: supplierList } = useSupplierList()
  const updateMutation = useUpdateBarangMasuk(item.id)

  // harga tersimpan per satuan — tampilkan lagi sebagai per-dus di form biar konsisten dengan cara isi
  const spd = item.jumlah_dus > 0 ? item.jumlah_satuan / item.jumlah_dus : 1

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      tanggal: item.tanggal.slice(0, 10),
      supplier_id_str: item.supplier_id ? String(item.supplier_id) : '',
      no_faktur: item.no_faktur ?? '',
      no_batch: item.no_batch ?? '',
      expired_batch: item.expired_batch ? item.expired_batch.slice(0, 10) : '',
      jumlah_dus: item.jumlah_dus,
      harga_beli_dus: item.harga_beli != null ? Math.round(item.harga_beli * spd) : 0,
      harga_jual: item.harga_jual ?? 0,
      biaya_simpan_pct: 20,
      ppn_pct: 0,
      catatan: item.catatan ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    if (!values.supplier_id_str) return
    await updateMutation.mutateAsync({
      tanggal: values.tanggal,
      supplier_id: parseInt(values.supplier_id_str),
      no_faktur: values.no_faktur,
      no_batch: values.no_batch,
      expired_batch: values.expired_batch,
      jumlah_dus: Number(values.jumlah_dus),
      harga_beli_dus: values.harga_beli_dus || undefined,
      harga_jual: values.harga_jual || undefined,
      biaya_simpan_pct: values.biaya_simpan_pct || undefined,
      ppn_pct: values.ppn_pct || undefined,
      catatan: values.catatan || undefined,
    })
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

      {/* Obat — tidak bisa diedit, cuma info */}
      <div className="bg-gray-50 rounded-lg px-3 py-2.5">
        <p className="text-xs text-gray-500">Obat</p>
        <p className="text-sm font-medium text-gray-800">{item.nama_obat} <span className="text-gray-500 font-mono text-xs">({item.kode_obat})</span></p>
        <p className="text-xs text-gray-500 mt-0.5">Obat tidak bisa diganti saat edit — hapus baris ini dan catat ulang kalau obatnya salah.</p>
      </div>

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
          {errors.supplier_id_str && <p className="text-xs text-red-600 mt-1">Wajib dipilih</p>}
        </div>
        <div>
          <FieldLabel required>No. Faktur</FieldLabel>
          <Input {...register('no_faktur', { required: true })} />
          {errors.no_faktur && <p className="text-xs text-red-600 mt-1">Wajib diisi</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Tanggal</FieldLabel>
          <Input type="date" {...register('tanggal', { required: true })} />
          {errors.tanggal && <p className="text-xs text-red-600 mt-1">Wajib diisi</p>}
        </div>
        <div>
          <FieldLabel>PPN % (opsional)</FieldLabel>
          <div className="relative">
            <Input type="number" min="0" max="100" step="0.5" className="pr-8"
              {...register('ppn_pct', { valueAsNumber: true, min: 0, max: 100 })} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>No. Batch</FieldLabel>
          <Input {...register('no_batch', { required: true })} />
          {errors.no_batch && <p className="text-xs text-red-600 mt-1">Wajib diisi</p>}
        </div>
        <div>
          <FieldLabel required>Expired Batch</FieldLabel>
          <Input type="date" {...register('expired_batch', { required: true })} />
          {errors.expired_batch && <p className="text-xs text-red-600 mt-1">Wajib diisi</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Qty Dus</FieldLabel>
          <Input type="number" step="any" min="0.01"
            {...register('jumlah_dus', { required: true, min: 0.01, valueAsNumber: true })} />
          {errors.jumlah_dus && <p className="text-xs text-red-600 mt-1">Harus &gt; 0</p>}
        </div>
        <div>
          <FieldLabel>% Biaya Simpan <span className="text-gray-300 font-normal">(H)</span></FieldLabel>
          <div className="relative">
            <Input type="number" min="0" max="100" step="0.5" className="pr-6"
              {...register('biaya_simpan_pct', { valueAsNumber: true, min: 0, max: 100 })} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Harga Beli/Dus</FieldLabel>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">Rp</span>
            <Input type="number" min="0" step="100" className="pl-7"
              {...register('harga_beli_dus', { valueAsNumber: true, min: 0 })} />
          </div>
        </div>
        <div>
          <FieldLabel>Harga Jual/{item.satuan}</FieldLabel>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">Rp</span>
            <Input type="number" min="0" step="100" className="pl-7"
              {...register('harga_jual', { valueAsNumber: true, min: 0 })} />
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>Catatan</FieldLabel>
        <Input placeholder="Catatan tambahan (opsional)" {...register('catatan')} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm"
          onClick={onSuccess}
        >
          Batal
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

    </form>
  )
}
