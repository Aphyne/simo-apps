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
import { useCreateBarangKeluar } from '@/hooks/useBarangKeluar'
import { useObatList } from '@/hooks/useObat'
import type { BarangKeluarFormData } from '@/types/obat'

const KETERANGAN_OPTIONS = ['Penjualan', 'Retur', 'Rusak', 'Kedaluarsa', 'Lainnya'] as const

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

export default function BarangKeluarForm({ onSuccess }: Props) {
  const { data: obatData } = useObatList({ limit: 999 })
  const createMutation = useCreateBarangKeluar()

  const obatList = obatData?.data ?? []

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BarangKeluarFormData & { obat_id_str: string; keterangan_str: string }>({
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      obat_id_str: '',
      jumlah: 0,
      keterangan_str: '',
      catatan: '',
    },
  })

  const watchedObatIdStr = watch('obat_id_str')
  const watchedJumlah   = watch('jumlah')
  const selectedObat    = obatList.find((o) => String(o.id) === watchedObatIdStr)
  const stokSetelah     =
    selectedObat && watchedJumlah > 0
      ? selectedObat.stok - Number(watchedJumlah)
      : null

  async function onSubmit(values: BarangKeluarFormData & { obat_id_str: string; keterangan_str: string }) {
    if (!values.obat_id_str || !values.keterangan_str) return
    const payload: BarangKeluarFormData = {
      tanggal:    values.tanggal,
      obat_id:    parseInt(values.obat_id_str),
      jumlah:     parseInt(String(values.jumlah)),
      keterangan: values.keterangan_str,
      catatan:    values.catatan || undefined,
    }
    await createMutation.mutateAsync(payload)
    reset()
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

      {/* Tanggal + Jumlah */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Tanggal</FieldLabel>
          <Input type="date" {...register('tanggal', { required: true })} />
          {errors.tanggal && <p className="text-xs text-red-500 mt-1">Wajib diisi</p>}
        </div>
        <div>
          <FieldLabel required>Jumlah ({selectedObat?.satuan ?? 'satuan'})</FieldLabel>
          <Input
            type="number"
            min="1"
            placeholder="cth. 10"
            {...register('jumlah', { required: true, min: 1, valueAsNumber: true })}
          />
          {errors.jumlah && <p className="text-xs text-red-500 mt-1">Harus lebih dari 0</p>}
          {stokSetelah !== null && (
            <p className={`text-xs font-medium mt-1 ${
              stokSetelah < 0
                ? 'text-red-600'
                : stokSetelah <= (selectedObat?.rop ?? 0)
                ? 'text-orange-600'
                : 'text-gray-500'
            }`}>
              Stok setelah: {stokSetelah} {selectedObat?.satuan}
              {stokSetelah < 0 && ' — tidak cukup!'}
              {stokSetelah >= 0 && stokSetelah <= (selectedObat?.rop ?? 0) && ' — akan di bawah ROP ⚠️'}
            </p>
          )}
        </div>
      </div>

      {/* Obat */}
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
            <span className={`font-medium ${selectedObat.stok <= 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {selectedObat.stok} {selectedObat.satuan}
            </span>
            {selectedObat.rop !== null && (
              <span className="ml-2">· ROP: {selectedObat.rop} {selectedObat.satuan}</span>
            )}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 pt-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Detail Tambahan</p>
      </div>

      {/* Keterangan */}
      <div>
        <FieldLabel required>Keterangan</FieldLabel>
        <Controller
          name="keterangan_str"
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
        {errors.keterangan_str && <p className="text-xs text-red-500 mt-1">Keterangan wajib dipilih</p>}
      </div>

      {/* Catatan */}
      <div>
        <FieldLabel>Catatan</FieldLabel>
        <Input placeholder="Catatan tambahan (opsional)" {...register('catatan')} />
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
          className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 text-sm"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>

    </form>
  )
}
