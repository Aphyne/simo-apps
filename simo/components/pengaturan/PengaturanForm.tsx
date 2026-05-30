'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { useUpdatePengaturan } from '@/hooks/usePengaturan'
import { SERVICE_LEVEL_OPTIONS } from '@/lib/constants'

interface PengaturanData {
  nama_apotek?: { value: string }
  alamat_apotek?: { value: string }
  nama_apj?: { value: string }
  default_service_level?: { value: string }
  default_lead_time?: { value: string }
  default_biaya_pesan?: { value: string }
  threshold_expired_hari?: { value: string }
}

interface Props {
  data: PengaturanData
}

export default function PengaturanForm({ data }: Props) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Informasi Apotek */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Informasi Apotek</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nama Apotek</label>
            <input value={form.nama_apotek} onChange={e => set('nama_apotek', e.target.value)}
              placeholder="Apotek Rezky Medika"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <p className="mt-1 text-xs text-gray-400">Tampil di header semua laporan yang dicetak</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Alamat Apotek</label>
            <textarea value={form.alamat_apotek} onChange={e => set('alamat_apotek', e.target.value)}
              rows={2} placeholder="Jalan ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nama Apoteker Penanggung Jawab (APJ)</label>
            <input value={form.nama_apj} onChange={e => set('nama_apj', e.target.value)}
              placeholder="apt. Nama Lengkap, S.Farm."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* Default Kalkulasi EOQ */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Default Kalkulasi EOQ</h2>
        <p className="text-xs text-gray-400 mb-4">Nilai ini dipakai saat obat baru ditambahkan dan belum diisi manual. Bisa diubah per obat di halaman Edit Obat.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Service Level Default</label>
            <select value={form.default_service_level} onChange={e => set('default_service_level', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              {SERVICE_LEVEL_OPTIONS.map(o => (
                <option key={o.value} value={String(o.value)}>{o.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Dipakai untuk hitung Safety Stock</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Lead Time Default (hari)</label>
            <input type="number" min="1" value={form.default_lead_time} onChange={e => set('default_lead_time', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <p className="mt-1 text-xs text-gray-400">Berapa hari barang datang setelah dipesan</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Biaya Pesan Default (Rp)</label>
            <input type="number" min="0" value={form.default_biaya_pesan} onChange={e => set('default_biaya_pesan', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <p className="mt-1 text-xs text-gray-400">Apotek Rezky Medika: Rp 0 (tidak ada biaya pengiriman)</p>
          </div>
        </div>
      </div>

      {/* Peringatan */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Peringatan & Notifikasi</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Batas Peringatan Kedaluarsa (hari)</label>
          <div className="flex items-center gap-3">
            <input type="number" min="1" value={form.threshold_expired_hari} onChange={e => set('threshold_expired_hari', e.target.value)}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <span className="text-sm text-gray-500">hari sebelum expired</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Obat dengan expired dalam rentang ini tampil di peringatan dashboard dan laporan kedaluarsa</p>
        </div>
      </div>

      {/* Simpan */}
      <div className="flex justify-end">
        <button type="submit" disabled={update.isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-6 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          <Save className="h-4 w-4" />
          {update.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </form>
  )
}
