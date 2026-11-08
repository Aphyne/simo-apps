'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { KATEGORI_OBAT, SATUAN_OBAT } from '@/lib/constants'
import { useSupplierDropdown } from '@/hooks/useSupplier'
import type { ObatFormData } from '@/types/obat'
import type { Obat } from '@/types/obat'
import { Info } from 'lucide-react'

// ─── Tooltip kecil ────────────────────────────────────────────────────────────
function Info_({text}: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-gray-400 hover:text-blue-500 focus:outline-none"
        tabIndex={-1}
        aria-label="Informasi"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <span className="absolute left-5 top-0 z-20 w-72 text-xs bg-gray-800 text-white rounded-lg px-3 py-2 shadow-xl leading-relaxed">
          {text}
        </span>
      )}
    </span>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionTitle({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {num}
      </span>
      <h3 className="text-sm font-semibold text-gray-700">{children}</h3>
    </div>
  )
}

interface Props {
  defaultValues?: Partial<Obat>
  onSubmit: (data: ObatFormData) => void
  isLoading?: boolean
  submitLabel?: string
}

export default function ObatForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Simpan' }: Props) {
  const { data: suppliers = [] } = useSupplierDropdown()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ObatFormData>({
    defaultValues: {
      nama: defaultValues?.nama ?? '',
      kategori: defaultValues?.kategori ?? '',
      satuan: defaultValues?.satuan ?? '',
      satuan_per_dus: defaultValues?.satuan_per_dus ?? 1,
      stok: defaultValues?.stok ?? 0,
      demand_harian: defaultValues?.demand_harian ?? 0,
      demand_tahunan: defaultValues?.demand_tahunan ?? 0,
      std_dev_demand: defaultValues?.std_dev_demand ?? 0,
      biaya_pesan: defaultValues?.biaya_pesan ?? 0,
      service_level: defaultValues?.service_level ?? 95,
      expired_terdekat: defaultValues?.expired_terdekat
        ? defaultValues.expired_terdekat.slice(0, 10)
        : undefined,
      supplier_id: defaultValues?.supplier_id ?? undefined,
    },
  })

  const satuanValue = watch('satuan')
  const kategoriValue = watch('kategori')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* ── SEKSI 1: INFORMASI DASAR ─────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle num={1}>Informasi Dasar</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="nama">Nama Obat <span className="text-red-600">*</span></Label>
            <Input
              id="nama"
              placeholder="cth. Paracetamol 500mg"
              {...register('nama', { required: 'Nama obat wajib diisi' })}
            />
            {errors.nama && <p className="text-xs text-red-600">{errors.nama.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Kategori <span className="text-red-600">*</span></Label>
            <Select value={kategoriValue} onValueChange={(v) => setValue('kategori', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {KATEGORI_OBAT.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('kategori', { required: 'Kategori wajib dipilih' })} />
            {errors.kategori && <p className="text-xs text-red-600">{errors.kategori.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Satuan Terkecil <span className="text-red-600">*</span>
              <Info_ text="Satuan terkecil yang digunakan untuk menghitung stok. Contoh: tablet, kapsul, botol. Bukan dus atau strip." />
            </Label>
            <Select value={satuanValue} onValueChange={(v) => setValue('satuan', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih satuan" /></SelectTrigger>
              <SelectContent>
                {SATUAN_OBAT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('satuan', { required: 'Satuan wajib dipilih' })} />
            {errors.satuan && <p className="text-xs text-red-600">{errors.satuan.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="satuan_per_dus">
              Isi per Dus <span className="text-red-600">*</span>
              <Info_ text={`Berapa ${satuanValue || 'satuan'} dalam 1 dus/box kemasan besar. Contoh: 1 dus Paracetamol = 100 tablet, isi "100".`} />
            </Label>
            <Input id="satuan_per_dus" type="number" min={1}
              {...register('satuan_per_dus', { valueAsNumber: true, min: { value: 1, message: 'Isi per dus minimal 1' }, required: 'Isi per dus wajib diisi' })} />
            {errors.satuan_per_dus && <p className="text-xs text-red-600">{errors.satuan_per_dus.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stok">
              Stok Awal <span className="text-red-600">*</span>
              <Info_ text={`Jumlah stok saat ini dalam satuan terkecil (${satuanValue || 'satuan'}), bukan dus. Isi 0 jika obat belum tersedia.`} />
            </Label>
            <Input id="stok" type="number" min={0}
              {...register('stok', { valueAsNumber: true, min: { value: 0, message: 'Stok tidak boleh negatif' } })} />
            {errors.stok && <p className="text-xs text-red-600">{errors.stok.message}</p>}
          </div>


        </div>
      </div>

      {/* ── SEKSI 2: INFO TAMBAHAN ───────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle num={2}>Informasi Tambahan</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="space-y-1.5">
            <Label htmlFor="expired_terdekat">Tanggal Kedaluarsa Terdekat</Label>
            <Input id="expired_terdekat" type="date" {...register('expired_terdekat')} />
          </div>

          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <Select
              value={watch('supplier_id') ? String(watch('supplier_id')) : '0'}
              onValueChange={(v) => setValue('supplier_id', v && v !== '0' ? Number(v) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih supplier (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">— Tanpa supplier —</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* ── TOMBOL AKSI ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={() => { window.location.href = '/obat' }}
          className="border-gray-300 text-gray-700 hover:bg-gray-50">
          Batal
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[110px]">
          {isLoading ? 'Menyimpan...' : submitLabel}
        </Button>
      </div>

    </form>
  )
}
