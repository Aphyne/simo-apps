'use client'

import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateBarangMasuk } from '@/hooks/useBarangMasuk'
import { useObatList } from '@/hooks/useObat'
import { useSupplierList } from '@/hooks/useSupplier'
import type { BarangMasukFormData } from '@/types/obat'

interface Props {
  onSuccess: () => void
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Tanggal */}
      <div className="space-y-1">
        <Label>Tanggal <span className="text-red-500">*</span></Label>
        <Input type="date" {...register('tanggal', { required: true })} />
        {errors.tanggal && <p className="text-xs text-red-500">Tanggal wajib diisi</p>}
      </div>

      {/* Obat */}
      <div className="space-y-1">
        <Label>Obat <span className="text-red-500">*</span></Label>
        <Controller
          name="obat_id_str"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih obat..." />
              </SelectTrigger>
              <SelectContent>
                {obatList.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.nama} <span className="text-gray-400">({o.kode})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.obat_id_str && <p className="text-xs text-red-500">Obat wajib dipilih</p>}
        {selectedObat && (
          <p className="text-xs text-gray-500">
            Stok saat ini: <span className="font-medium">{selectedObat.stok} {selectedObat.satuan}</span>
            {' · '}1 dus = {selectedObat.satuan_per_dus} {selectedObat.satuan}
          </p>
        )}
      </div>

      {/* Jumlah Dus */}
      <div className="space-y-1">
        <Label>Jumlah Dus <span className="text-red-500">*</span></Label>
        <Input
          type="number"
          step="any"
          min="0.01"
          placeholder="Contoh: 2.5"
          {...register('jumlah_dus', { required: true, min: 0.01, valueAsNumber: true })}
        />
        {errors.jumlah_dus && <p className="text-xs text-red-500">Jumlah harus lebih dari 0</p>}
        {jumlahSatuanPreview !== null && (
          <p className="text-xs text-blue-600 font-medium">
            = {jumlahSatuanPreview} {selectedObat?.satuan} yang akan ditambahkan ke stok
          </p>
        )}
      </div>

      {/* Supplier */}
      <div className="space-y-1">
        <Label>Supplier</Label>
        <Controller
          name="supplier_id_str"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih supplier (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Tidak ada —</SelectItem>
                {(supplierList ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* No. Faktur & Expired Batch */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>No. Faktur</Label>
          <Input placeholder="Opsional" {...register('no_faktur')} />
        </div>
        <div className="space-y-1">
          <Label>Expired Batch</Label>
          <Input type="date" {...register('expired_batch')} />
        </div>
      </div>

      {/* Catatan */}
      <div className="space-y-1">
        <Label>Catatan</Label>
        <Input placeholder="Opsional" {...register('catatan')} />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={() => { reset(); onSuccess() }}>
          Batal
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
