'use client'

import { useForm } from 'react-hook-form'
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
    getValues,
    trigger,
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

  function validateKontak() {
    const { telepon, whatsapp } = getValues()
    return !!(telepon || whatsapp) || 'Isi minimal salah satu nomor kontak'
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nama Supplier */}
      <div>
        <label htmlFor="nama" className="text-sm font-medium text-gray-700 mb-1 block">
          Nama Supplier <span className="text-red-500">*</span>
        </label>
        <input
          id="nama"
          placeholder="cth. PBF Kimia Farma"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...register('nama', { required: 'Nama supplier wajib diisi' })}
        />
        {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama.message}</p>}
      </div>

      {/* Alamat */}
      <div>
        <label htmlFor="alamat" className="text-sm font-medium text-gray-700 mb-1 block">
          Alamat
        </label>
        <input
          id="alamat"
          placeholder="Alamat lengkap supplier"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...register('alamat')}
        />
      </div>

      {/* Telepon + WhatsApp */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Kontak <span className="text-red-500">*</span>
          <span className="text-xs font-normal text-gray-400 ml-1">(isi minimal salah satu)</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="telepon" className="text-xs font-medium text-gray-500 mb-1 block">Telepon</label>
            <input
              id="telepon"
              placeholder="cth. 0986-211234"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('telepon', {
                validate: validateKontak,
                onChange: () => trigger('whatsapp'),
              })}
            />
          </div>
          <div>
            <label htmlFor="whatsapp" className="text-xs font-medium text-gray-500 mb-1 block">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              placeholder="cth. 081234560001"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('whatsapp', {
                validate: validateKontak,
                onChange: () => trigger('telepon'),
              })}
            />
            <p className="text-xs text-gray-400 mt-1">Format angka tanpa tanda hubung</p>
          </div>
        </div>
      </div>

      {/* Jenis Obat */}
      <div>
        <label htmlFor="jenis_obat" className="text-sm font-medium text-gray-700 mb-1 block">
          Jenis Obat yang Disuplai
        </label>
        <input
          id="jenis_obat"
          placeholder="cth. Antibiotik, analgesik, antasida"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...register('jenis_obat')}
        />
        <p className="text-xs text-gray-400 mt-1">Pisahkan dengan koma jika lebih dari satu jenis</p>
      </div>

      {/* Lead Time */}
      <div>
        <label htmlFor="lead_time_avg" className="text-sm font-medium text-gray-700 mb-1 block">
          Rata-rata Lead Time (hari)
        </label>
        <input
          id="lead_time_avg"
          type="number"
          min={1}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...register('lead_time_avg', { valueAsNumber: true, min: 1 })}
        />
        <p className="text-xs text-gray-400 mt-1">Rata-rata hari dari pemesanan hingga barang datang</p>
      </div>

      {/* Submit */}
      <div className="pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Menyimpan...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
