'use client'

import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Supplier, SupplierFormData } from '@/types/supplier'

interface Props {
  defaultValues?: Partial<Supplier>
  onSubmit: (data: SupplierFormData) => void
  isLoading?: boolean
  submitLabel?: string
}

export default function SupplierForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Simpan' }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormData>({
    defaultValues: {
      nama: defaultValues?.nama ?? '',
      alamat: defaultValues?.alamat ?? '',
      telepon: defaultValues?.telepon ?? '',
      whatsapp: defaultValues?.whatsapp ?? '',
      jenis_obat: defaultValues?.jenis_obat ?? '',
      lead_time_avg: defaultValues?.lead_time_avg ?? 1,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nama">Nama Supplier <span className="text-red-500">*</span></Label>
        <Input
          id="nama"
          placeholder="cth. PBF Kimia Farma"
          {...register('nama', { required: 'Nama supplier wajib diisi' })}
        />
        {errors.nama && <p className="text-xs text-red-500">{errors.nama.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="alamat">Alamat</Label>
        <Input id="alamat" placeholder="Alamat lengkap" {...register('alamat')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="telepon">Telepon</Label>
          <Input id="telepon" placeholder="cth. 0986-211234" {...register('telepon')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" placeholder="cth. 081234560001" {...register('whatsapp')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jenis_obat">Jenis Obat yang Disuplai</Label>
        <Input id="jenis_obat" placeholder="cth. Antibiotik, analgesik, antasida" {...register('jenis_obat')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead_time_avg">Rata-rata Lead Time (hari)</Label>
        <Input
          id="lead_time_avg"
          type="number"
          min={1}
          {...register('lead_time_avg', { valueAsNumber: true, min: 1 })}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading ? 'Menyimpan...' : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => { window.location.href = '/supplier' }}>
          Batal
        </Button>
      </div>
    </form>
  )
}
