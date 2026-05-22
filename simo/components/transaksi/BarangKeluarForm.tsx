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
import { useCreateBarangKeluar } from '@/hooks/useBarangKeluar'
import { useObatList } from '@/hooks/useObat'
import type { BarangKeluarFormData } from '@/types/obat'

const KETERANGAN_OPTIONS = ['Penjualan', 'Retur', 'Rusak', 'Kedaluarsa', 'Lainnya'] as const

interface Props {
  onSuccess: () => void
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
  const watchedJumlah = watch('jumlah')
  const selectedObat = obatList.find((o) => String(o.id) === watchedObatIdStr)
  const stokSetelah =
    selectedObat && watchedJumlah > 0
      ? selectedObat.stok - Number(watchedJumlah)
      : null

  async function onSubmit(values: BarangKeluarFormData & { obat_id_str: string; keterangan_str: string }) {
    if (!values.obat_id_str || !values.keterangan_str) return
    const payload: BarangKeluarFormData = {
      tanggal: values.tanggal,
      obat_id: parseInt(values.obat_id_str),
      jumlah: parseInt(String(values.jumlah)),
      keterangan: values.keterangan_str,
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
            Stok tersedia:{' '}
            <span className={`font-medium ${selectedObat.stok <= 0 ? 'text-red-600' : 'text-gray-700'}`}>
              {selectedObat.stok} {selectedObat.satuan}
            </span>
            {selectedObat.rop !== null && (
              <span className="ml-2 text-gray-400">· ROP: {selectedObat.rop} {selectedObat.satuan}</span>
            )}
          </p>
        )}
      </div>

      {/* Jumlah */}
      <div className="space-y-1">
        <Label>Jumlah <span className="text-red-500">*</span></Label>
        <Input
          type="number"
          min="1"
          placeholder="Contoh: 10"
          {...register('jumlah', { required: true, min: 1, valueAsNumber: true })}
        />
        {errors.jumlah && <p className="text-xs text-red-500">Jumlah harus lebih dari 0</p>}
        {stokSetelah !== null && (
          <p className={`text-xs font-medium ${stokSetelah < 0 ? 'text-red-600' : stokSetelah <= (selectedObat?.rop ?? 0) ? 'text-orange-600' : 'text-gray-500'}`}>
            Stok setelah: {stokSetelah} {selectedObat?.satuan}
            {stokSetelah < 0 && ' — tidak cukup!'}
            {stokSetelah >= 0 && stokSetelah <= (selectedObat?.rop ?? 0) && ' — akan di bawah ROP ⚠️'}
          </p>
        )}
      </div>

      {/* Keterangan */}
      <div className="space-y-1">
        <Label>Keterangan <span className="text-red-500">*</span></Label>
        <Controller
          name="keterangan_str"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
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
        {errors.keterangan_str && <p className="text-xs text-red-500">Keterangan wajib dipilih</p>}
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
          className="bg-red-600 hover:bg-red-700 text-white"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
