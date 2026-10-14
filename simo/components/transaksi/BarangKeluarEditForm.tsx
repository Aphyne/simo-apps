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
import { useUpdateBarangKeluar } from '@/hooks/useBarangKeluar'
import type { BarangKeluar, BarangKeluarUpdateFormData } from '@/types/obat'

const KETERANGAN_OPTIONS = ['Penjualan', 'Retur', 'Rusak', 'Kedaluarsa', 'Lainnya'] as const

interface Props {
  item: BarangKeluar
  onSuccess: () => void
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-gray-700 mb-1 block">
      {children}
      {required && <span className="text-red-600 ml-0.5">*</span>}
    </label>
  )
}

export default function BarangKeluarEditForm({ item, onSuccess }: Props) {
  const updateMutation = useUpdateBarangKeluar(item.id)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BarangKeluarUpdateFormData>({
    defaultValues: {
      tanggal: item.tanggal.slice(0, 10),
      jumlah: item.jumlah,
      keterangan: item.keterangan,
      catatan: item.catatan ?? '',
    },
  })

  async function onSubmit(values: BarangKeluarUpdateFormData) {
    await updateMutation.mutateAsync({
      tanggal: values.tanggal,
      jumlah: Number(values.jumlah),
      keterangan: values.keterangan,
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
          <FieldLabel required>Tanggal</FieldLabel>
          <Input type="date" {...register('tanggal', { required: true })} />
          {errors.tanggal && <p className="text-xs text-red-600 mt-1">Wajib diisi</p>}
        </div>
        <div>
          <FieldLabel required>Jumlah ({item.satuan})</FieldLabel>
          <Input
            type="number" min="1"
            {...register('jumlah', { required: true, min: 1, valueAsNumber: true })}
          />
          {errors.jumlah && <p className="text-xs text-red-600 mt-1">Harus lebih dari 0</p>}
        </div>
      </div>

      <div>
        <FieldLabel required>Keterangan</FieldLabel>
        <Controller
          name="keterangan"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Pilih keterangan..." />
              </SelectTrigger>
              <SelectContent>
                {KETERANGAN_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.keterangan && <p className="text-xs text-red-600 mt-1">Wajib dipilih</p>}
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
