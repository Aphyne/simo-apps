'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
        className="text-fg-subtle hover:text-brand-500 focus:outline-none"
        tabIndex={-1}
        aria-label="Informasi"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <span className="absolute left-5 top-0 z-20 w-72 text-xs bg-gray-800 text-fg-inverse rounded-lg px-3 py-2 shadow-xl leading-relaxed">
          {text}
        </span>
      )}
    </span>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionTitle({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-line-subtle">
      <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {num}
      </span>
      <h3 className="text-sm font-semibold text-fg-secondary">{children}</h3>
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
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ObatFormData>({
    defaultValues: {
      nama: defaultValues?.nama ?? '',
      kategori: defaultValues?.kategori ?? '',
      satuan: defaultValues?.satuan ?? '',
      satuan_per_dus: defaultValues?.satuan_per_dus ?? 1,
    },
  })

  const satuanValue = useWatch({ control, name: 'satuan' })
  const kategoriValue = useWatch({ control, name: 'kategori' })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* ── SEKSI 1: INFORMASI DASAR ─────────────────────────────────────── */}
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <SectionTitle num={1}>Informasi Dasar</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="nama">Nama Obat <span className="text-danger-600">*</span></Label>
            <Input
              id="nama"
              placeholder="cth. Paracetamol 500mg"
              {...register('nama', { required: 'Nama obat wajib diisi' })}
            />
            {errors.nama && <p className="text-xs text-danger-600">{errors.nama.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Kategori <span className="text-danger-600">*</span></Label>
            <Select value={kategoriValue} onValueChange={(v) => setValue('kategori', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {KATEGORI_OBAT.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('kategori', { required: 'Kategori wajib dipilih' })} />
            {errors.kategori && <p className="text-xs text-danger-600">{errors.kategori.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Satuan Terkecil <span className="text-danger-600">*</span>
              <Info_ text="Satuan terkecil yang digunakan untuk menghitung stok. Contoh: tablet, kapsul, botol. Bukan dus atau strip." />
            </Label>
            <Select value={satuanValue} onValueChange={(v) => setValue('satuan', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih satuan" /></SelectTrigger>
              <SelectContent>
                {SATUAN_OBAT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('satuan', { required: 'Satuan wajib dipilih' })} />
            {errors.satuan && <p className="text-xs text-danger-600">{errors.satuan.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="satuan_per_dus">
              Isi per Dus <span className="text-danger-600">*</span>
              <Info_ text={`Berapa ${satuanValue || 'satuan'} dalam 1 dus/box kemasan besar. Contoh: 1 dus Paracetamol = 100 tablet, isi "100".`} />
            </Label>
            <Input id="satuan_per_dus" type="number" min={1}
              {...register('satuan_per_dus', { valueAsNumber: true, min: { value: 1, message: 'Isi per dus minimal 1' }, required: 'Isi per dus wajib diisi' })} />
            {errors.satuan_per_dus && <p className="text-xs text-danger-600">{errors.satuan_per_dus.message}</p>}
          </div>

        </div>
      </div>

      {/* ── TOMBOL AKSI ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
        <Button type="button" variant="outline" onClick={() => { window.location.href = '/obat' }}
          className="border-line-strong text-fg-secondary hover:bg-surface-subtle">
          Batal
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-brand-600 hover:bg-brand-700 text-fg-inverse min-w-[110px]">
          {isLoading ? 'Menyimpan...' : submitLabel}
        </Button>
      </div>

    </form>
  )
}
