'use client'

import { useState, useEffect } from 'react'
import { Settings, Save } from 'lucide-react'
import { usePengaturan, useUpdatePengaturan } from '@/hooks/usePengaturan'
import { SERVICE_LEVEL_OPTIONS } from '@/lib/constants'

export default function PengaturanPage() {
  const { data, isLoading } = usePengaturan()
  const update = useUpdatePengaturan()

  const [form, setForm] = useState({
    nama_apotek: '',
    alamat_apotek: '',
    nama_apj: '',
    default_service_level: '95',
    default_lead_time: '3',
    default_biaya_pesan: '0',
    threshold_expired_hari: '90',
  })

  useEffect(() => {
    if (!data) return
    setForm({
      nama_apotek:            data.nama_apotek?.value            ?? '',
      alamat_apotek:          data.alamat_apotek?.value          ?? '',
      nama_apj:               data.nama_apj?.value               ?? '',
      default_service_level:  data.default_service_level?.value  ?? '95',
      default_lead_time:      data.default_lead_time?.value      ?? '3',
      default_biaya_pesan:    data.default_biaya_pesan?.value    ?? '0',
      threshold_expired_hari: data.threshold_expired_hari?.value ?? '90',
    })
  }, [data])

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-gray-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-2" />
        Memuat pengaturan…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Settings className="h-6 w-6 text-blue-600" />
          Pengaturan Sistem
        </h1>
        <p className="mt-1 text-sm text-gray-500">Konfigurasi umum untuk sistem SIMO Apotek Rezky Medika</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Informasi Apotek */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800">Informasi Apotek</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nama Apotek</label>
              <input value={form.nama_apotek} onChange={e => set('nama_apotek', e.target.value)}
                placeholder="Apotek Rezky Medika"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <p className="mt-1 text-xs text-gray-400">Tampil di header semua laporan yang dicetak</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Alamat Apotek</label>
              <textarea value={form.alamat_apotek} onChange={e => set('alamat_apotek', e.target.value)}
                rows={2} placeholder="Jalan …"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nama Apoteker Penanggung Jawab (APJ)</label>
              <input value={form.nama_apj} onChange={e => set('nama_apj', e.target.value)}
                placeholder="apt. Nama Lengkap, S.Farm."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Default Kalkulasi EOQ */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-base font-semibold text-gray-800">Default Kalkulasi EOQ</h2>
          <p className="mb-4 text-xs text-gray-400">Nilai ini dipakai saat obat baru ditambahkan dan belum diisi manual. Bisa diubah per obat di halaman Edit Obat.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Service Level Default</label>
              <select value={form.default_service_level} onChange={e => set('default_service_level', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {SERVICE_LEVEL_OPTIONS.map(o => (
                  <option key={o.value} value={String(o.value)}>{o.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">Dipakai untuk hitung Safety Stock</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Lead Time Default (hari)</label>
              <input type="number" min="1" value={form.default_lead_time} onChange={e => set('default_lead_time', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <p className="mt-1 text-xs text-gray-400">Berapa hari barang datang setelah dipesan</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Biaya Pesan Default (Rp)</label>
              <input type="number" min="0" value={form.default_biaya_pesan} onChange={e => set('default_biaya_pesan', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <p className="mt-1 text-xs text-gray-400">Apotek Rezky Medika: Rp 0 (tidak ada biaya pengiriman)</p>
            </div>
          </div>
        </div>

        {/* Peringatan */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800">Peringatan & Notifikasi</h2>
          <div className="max-w-xs">
            <label className="mb-1 block text-sm font-medium text-gray-700">Batas Peringatan Kedaluarsa (hari)</label>
            <div className="flex items-center gap-3">
              <input type="number" min="1" value={form.threshold_expired_hari} onChange={e => set('threshold_expired_hari', e.target.value)}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <span className="text-sm text-gray-500">hari sebelum expired</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Obat dengan expired dalam rentang ini tampil di peringatan dashboard dan laporan kedaluarsa</p>
          </div>
        </div>

        {/* Tombol simpan */}
        <div className="flex justify-end">
          <button type="submit" disabled={update.isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {update.isPending ? 'Menyimpan…' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  )
}
