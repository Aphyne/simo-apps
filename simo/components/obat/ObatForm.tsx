'use client'

import { useState, useEffect } from 'react'
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
import { KATEGORI_OBAT, SATUAN_OBAT, SERVICE_LEVEL_OPTIONS } from '@/lib/constants'
import { useSupplierList } from '@/hooks/useSupplier'
import type { ObatFormData } from '@/types/obat'
import type { Obat } from '@/types/obat'
import { Info, ChevronDown, ChevronUp, Calculator } from 'lucide-react'

// ─── Helper: hitung standar deviasi sampel ────────────────────────────────────
function hitungDariRiwayat(values: number[]): { mean: number; stdDev: number } {
  const valid = values.filter((v) => !isNaN(v) && v >= 0)
  if (valid.length < 2) return { mean: valid[0] ?? 0, stdDev: 0 }
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length
  const variance = valid.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (valid.length - 1)
  return { mean: parseFloat(mean.toFixed(4)), stdDev: parseFloat(Math.sqrt(variance).toFixed(4)) }
}

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
  const { data: suppliers = [] } = useSupplierList()

  // UI state
  const [biayaSimpanMode, setBiayaSimpanMode] = useState<'rupiah' | 'persen'>('rupiah')
  const [biayaSimpanPct, setBiayaSimpanPct] = useState(20)
  const [showBantuHitung, setShowBantuHitung] = useState(false)
  const [riwayatHarian, setRiwayatHarian] = useState(['', '', '', '', ''])
  const [isDemandFromTahunan, setIsDemandFromTahunan] = useState(false)

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
      harga_beli: defaultValues?.harga_beli ?? 0,
      harga_jual: defaultValues?.harga_jual ?? 0,
      stok: defaultValues?.stok ?? 0,
      demand_harian: defaultValues?.demand_harian ?? 0,
      demand_tahunan: defaultValues?.demand_tahunan ?? 0,
      std_dev_demand: defaultValues?.std_dev_demand ?? 0,
      biaya_pesan: defaultValues?.biaya_pesan ?? 0,
      biaya_simpan: defaultValues?.biaya_simpan ?? 0,
      lead_time: defaultValues?.lead_time ?? 1,
      service_level: defaultValues?.service_level ?? 95,
      expired_terdekat: defaultValues?.expired_terdekat
        ? defaultValues.expired_terdekat.slice(0, 10)
        : undefined,
      supplier_id: defaultValues?.supplier_id ?? undefined,
    },
  })

  const satuanValue = watch('satuan')
  const kategoriValue = watch('kategori')
  const serviceLevelValue = watch('service_level')
  const hargaBeli = watch('harga_beli')
  const demandHarian = watch('demand_harian')
  const demandTahunan = watch('demand_tahunan')

  // Auto-kalkulasi biaya simpan saat mode persen
  useEffect(() => {
    if (biayaSimpanMode === 'persen' && hargaBeli > 0) {
      setValue('biaya_simpan', parseFloat(((biayaSimpanPct / 100) * hargaBeli).toFixed(2)))
    }
  }, [biayaSimpanMode, biayaSimpanPct, hargaBeli, setValue])

  // Auto-link demand harian → tahunan
  // demand_tahunan selalu bilangan bulat, demand_harian maks 2 desimal
  function handleDemandHarianChange(val: number) {
    const harian = parseFloat(val.toFixed(2))
    setValue('demand_harian', harian)
    if (!isDemandFromTahunan) {
      setValue('demand_tahunan', Math.round(harian * 365))
    }
    setIsDemandFromTahunan(false)
  }

  // Auto-link demand tahunan → harian
  function handleDemandTahunanChange(val: number) {
    const tahunan = Math.round(val)
    setValue('demand_tahunan', tahunan)
    setIsDemandFromTahunan(true)
    setValue('demand_harian', parseFloat((tahunan / 365).toFixed(2)))
  }

  // Bantu hitung standar deviasi dari riwayat penjualan harian
  function terapkanBantuHitung() {
    const angka = riwayatHarian.map((v) => parseFloat(v)).filter((v) => !isNaN(v))
    if (angka.length < 2) return
    const { mean, stdDev } = hitungDariRiwayat(angka)
    const harian = parseFloat(mean.toFixed(2))
    setValue('demand_harian', harian)
    setValue('demand_tahunan', Math.round(harian * 365))
    setValue('std_dev_demand', stdDev)
    setShowBantuHitung(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* ── SEKSI 1: INFORMASI DASAR ─────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle num={1}>Informasi Dasar</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="nama">Nama Obat <span className="text-red-500">*</span></Label>
            <Input
              id="nama"
              placeholder="cth. Paracetamol 500mg"
              {...register('nama', { required: 'Nama obat wajib diisi' })}
            />
            {errors.nama && <p className="text-xs text-red-500">{errors.nama.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Kategori <span className="text-red-500">*</span></Label>
            <Select value={kategoriValue} onValueChange={(v) => setValue('kategori', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {KATEGORI_OBAT.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('kategori', { required: 'Kategori wajib dipilih' })} />
            {errors.kategori && <p className="text-xs text-red-500">{errors.kategori.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Satuan Terkecil <span className="text-red-500">*</span>
              <Info_ text="Satuan terkecil yang digunakan untuk menghitung stok. Contoh: tablet, kapsul, botol. Bukan dus atau strip." />
            </Label>
            <Select value={satuanValue} onValueChange={(v) => setValue('satuan', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih satuan" /></SelectTrigger>
              <SelectContent>
                {SATUAN_OBAT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('satuan', { required: 'Satuan wajib dipilih' })} />
            {errors.satuan && <p className="text-xs text-red-500">{errors.satuan.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="satuan_per_dus">
              Isi per Dus <span className="text-red-500">*</span>
              <Info_ text={`Berapa ${satuanValue || 'satuan'} dalam 1 dus/box kemasan besar. Contoh: 1 dus Paracetamol = 100 tablet, isi "100".`} />
            </Label>
            <Input id="satuan_per_dus" type="number" min={1}
              {...register('satuan_per_dus', { valueAsNumber: true, min: { value: 1, message: 'Isi per dus minimal 1' }, required: 'Isi per dus wajib diisi' })} />
            {errors.satuan_per_dus && <p className="text-xs text-red-500">{errors.satuan_per_dus.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stok">
              Stok Awal <span className="text-red-500">*</span>
              <Info_ text={`Jumlah stok saat ini dalam satuan terkecil (${satuanValue || 'satuan'}), bukan dus. Isi 0 jika obat belum tersedia.`} />
            </Label>
            <Input id="stok" type="number" min={0}
              {...register('stok', { valueAsNumber: true, min: { value: 0, message: 'Stok tidak boleh negatif' } })} />
            {errors.stok && <p className="text-xs text-red-500">{errors.stok.message}</p>}
          </div>

          {/* Harga Beli */}
          <div className="space-y-1.5">
            <Label htmlFor="harga_beli">
              Harga Beli per {satuanValue || 'Satuan'} (Rp) <span className="text-red-500">*</span>
              <Info_ text={`Harga beli per ${satuanValue || 'satuan terkecil'}, BUKAN per dus. Contoh: jika 1 dus 100 tablet seharga Rp 50.000, maka harga beli per tablet = Rp 500.`} />
            </Label>
            <Input id="harga_beli" type="number" min={0} step={10}
              {...register('harga_beli', { valueAsNumber: true, min: { value: 1, message: 'Harga beli harus lebih dari 0' }, required: 'Harga beli wajib diisi' })} />
            {errors.harga_beli && <p className="text-xs text-red-500">{errors.harga_beli.message}</p>}
          </div>

          {/* Harga Jual */}
          <div className="space-y-1.5">
            <Label htmlFor="harga_jual">
              Harga Jual per {satuanValue || 'Satuan'} (Rp)
              <Info_ text={`Harga jual ke pelanggan per ${satuanValue || 'satuan terkecil'}. Digunakan untuk laporan margin keuntungan.`} />
            </Label>
            <Input id="harga_jual" type="number" min={0} step={10}
              {...register('harga_jual', { valueAsNumber: true, min: 0 })} />
          </div>

        </div>
      </div>

      {/* ── SEKSI 2: DATA PERMINTAAN ─────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle num={2}>Data Permintaan (Demand)</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Demand Harian */}
          <div className="space-y-1.5">
            <Label htmlFor="demand_harian">
              Permintaan Harian (rata-rata)
              <Info_ text="Rata-rata jumlah obat yang terjual atau keluar per hari. Contoh: Paracetamol terjual sekitar 11 tablet per hari → isi 11. Nilai ini otomatis mengisi permintaan per tahun." />
            </Label>
            <div className="relative">
              <Input
                id="demand_harian"
                type="number"
                min={0}
                step={0.01}
                value={demandHarian ?? 0}
                onChange={(e) => handleDemandHarianChange(parseFloat(e.target.value) || 0)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {satuanValue || 'unit'}/hari
              </span>
            </div>
            <input type="hidden" {...register('demand_harian', { valueAsNumber: true })} />
          </div>

          {/* Demand Tahunan */}
          <div className="space-y-1.5">
            <Label htmlFor="demand_tahunan">
              Permintaan per Tahun (D)
              <Info_ text="Total permintaan dalam 1 tahun. Otomatis dihitung dari permintaan harian × 365. Bisa juga diisi langsung — permintaan harian akan menyesuaikan." />
            </Label>
            <div className="relative">
              <Input
                id="demand_tahunan"
                type="number"
                min={0}
                step={1}
                value={Math.round(demandTahunan ?? 0)}
                onChange={(e) => handleDemandTahunanChange(parseFloat(e.target.value) || 0)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {satuanValue || 'unit'}/tahun
              </span>
            </div>
            <input type="hidden" {...register('demand_tahunan', { valueAsNumber: true })} />
          </div>
        </div>

        {/* Standar Deviasi */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="std_dev_demand">
              Standar Deviasi Permintaan Harian (σ)
              <Info_ text="Ukuran seberapa tidak menentu penjualan harian. Nilai besar = penjualan sangat fluktuatif. Contoh: rata-rata 10 tablet/hari, kadang 5 kadang 15 → std dev sekitar 3–4. Gunakan tombol 'Bantu Hitung' jika tidak tahu nilainya." />
            </Label>
            <button
              type="button"
              onClick={() => setShowBantuHitung(!showBantuHitung)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Calculator className="w-3.5 h-3.5" />
              Bantu Hitung dari Riwayat Penjualan
              {showBantuHitung ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="relative max-w-xs">
            <Input
              id="std_dev_demand"
              type="number"
              min={0}
              step="any"
              {...register('std_dev_demand', { valueAsNumber: true, min: 0 })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {satuanValue || 'unit'}/hari
            </span>
          </div>

          {/* Panel Bantu Hitung */}
          {showBantuHitung && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Masukkan data penjualan harian selama beberapa hari terakhir
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Minimal 2 hari. Semakin banyak data, semakin akurat hasilnya.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {riwayatHarian.map((val, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs text-gray-500 text-center">Hari {i + 1}</p>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={val}
                      onChange={(e) => {
                        const updated = [...riwayatHarian]
                        updated[i] = e.target.value
                        setRiwayatHarian(updated)
                      }}
                      className="w-20 text-center"
                      placeholder="0"
                    />
                  </div>
                ))}
                {/* Tombol tambah hari */}
                {riwayatHarian.length < 30 && (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setRiwayatHarian([...riwayatHarian, ''])}
                      className="h-9 w-9 rounded-md border border-dashed border-blue-300 text-blue-400 hover:border-blue-500 hover:text-blue-600 text-lg flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Preview hasil */}
              {(() => {
                const angka = riwayatHarian.map((v) => parseFloat(v)).filter((v) => !isNaN(v) && v >= 0)
                if (angka.length < 2) return null
                const { mean, stdDev } = hitungDariRiwayat(angka)
                return (
                  <div className="bg-white rounded-md border border-blue-200 px-4 py-3 text-sm">
                    <p className="text-gray-600">
                      Dari <strong>{angka.length} hari</strong> data:
                    </p>
                    <div className="flex gap-6 mt-1">
                      <span>Rata-rata harian: <strong className="text-blue-700">{mean} {satuanValue || 'unit'}/hari</strong></span>
                      <span>Standar deviasi: <strong className="text-blue-700">{stdDev}</strong></span>
                    </div>
                  </div>
                )
              })()}

              <Button
                type="button"
                size="sm"
                onClick={terapkanBantuHitung}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Terapkan ke Form
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── SEKSI 3: PARAMETER EOQ ───────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle num={3}>Parameter Kalkulasi EOQ/ROP</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Biaya Pesan */}
          <div className="space-y-1.5">
            <Label htmlFor="biaya_pesan">
              Biaya Pemesanan per Order (S)
              <Info_ text="Biaya yang dikeluarkan setiap kali melakukan pemesanan ke supplier, misalnya biaya telepon, admin, atau ongkos kirim. Jika tidak ada biaya pemesanan (pemesanan gratis), isi 0." />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
              <Input id="biaya_pesan" type="number" min={0} step={100} className="pl-9"
                {...register('biaya_pesan', { valueAsNumber: true, min: 0 })} />
            </div>
            <p className="text-xs text-gray-400">Isi 0 jika tidak ada biaya pemesanan</p>
          </div>

          {/* Lead Time */}
          <div className="space-y-1.5">
            <Label htmlFor="lead_time">
              Lead Time (hari)
              <Info_ text="Jumlah hari dari saat pemesanan dilakukan sampai barang tiba di apotek. Contoh: pesan ke PBF hari Senin, barang datang hari Kamis → lead time 3 hari." />
            </Label>
            <div className="relative">
              <Input id="lead_time" type="number" min={1}
                {...register('lead_time', { valueAsNumber: true, min: 1 })} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">hari</span>
            </div>
          </div>

          {/* Biaya Simpan */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Biaya Penyimpanan per {satuanValue || 'Unit'}/Tahun (H)
                <Info_ text="Biaya untuk menyimpan 1 satuan obat selama 1 tahun, mencakup biaya gudang, listrik, risiko kedaluarsa. Umumnya 20–25% dari harga beli. Gunakan toggle 'Hitung dari %' jika lebih mudah." />
              </Label>
              <div className="flex rounded-md border overflow-hidden text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setBiayaSimpanMode('rupiah')}
                  className={`px-3 py-1.5 transition-colors ${biayaSimpanMode === 'rupiah' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Rp Langsung
                </button>
                <button
                  type="button"
                  onClick={() => setBiayaSimpanMode('persen')}
                  className={`px-3 py-1.5 transition-colors ${biayaSimpanMode === 'persen' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  % Harga Beli
                </button>
              </div>
            </div>

            {biayaSimpanMode === 'persen' ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex-1 max-w-sm">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={biayaSimpanPct}
                    onChange={(e) => setBiayaSimpanPct(parseFloat(e.target.value) || 0)}
                    className="w-20 text-center border-blue-200"
                  />
                  <span className="text-sm text-blue-700">% × Rp {hargaBeli.toLocaleString('id-ID')} =</span>
                  <span className="font-semibold text-blue-800">
                    Rp {((biayaSimpanPct / 100) * hargaBeli).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Nilai Rp otomatis terisi ke kolom H</p>
              </div>
            ) : (
              <div className="relative max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                <Input type="number" min={0} step={10} className="pl-9"
                  {...register('biaya_simpan', { valueAsNumber: true, min: 0 })} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/tahun</span>
              </div>
            )}
          </div>

          {/* Service Level */}
          <div className="space-y-1.5">
            <Label>
              Service Level (Z)
              <Info_ text="Tingkat kepercayaan bahwa stok tidak akan habis sebelum pemesanan berikutnya tiba. 95% adalah standar umum. Semakin tinggi, semakin besar safety stock yang dibutuhkan." />
            </Label>
            <Select
              value={String(serviceLevelValue)}
              onValueChange={(v) => setValue('service_level', Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih service level" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_LEVEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('service_level', { valueAsNumber: true })} />
          </div>

        </div>
      </div>

      {/* ── SEKSI 4: INFO TAMBAHAN ───────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle num={4}>Informasi Tambahan</SectionTitle>
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
