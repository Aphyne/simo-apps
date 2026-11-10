'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { useUpdatePengaturan } from '@/hooks/usePengaturan'
import { SERVICE_LEVEL_OPTIONS } from '@/lib/constants'

interface PengaturanData {
  nama_apotek?: { value: string }
  alamat_apotek?: { value: string }
  nama_apj?: { value: string }
  nomor_sia?: { value: string }
  nomor_sipa_apj?: { value: string }
  kota_apotek?: { value: string }
  default_service_level?: { value: string }
  default_lead_time?: { value: string }
  default_biaya_pesan?: { value: string }
  biaya_pesan_per_faktur?: { value: string }
  threshold_expired_hari?: { value: string }
  asumsi_dus_tradisional?: { value: string }
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
    nomor_sia: '',
    nomor_sipa_apj: '',
    kota_apotek: '',
    default_service_level: '95',
    default_lead_time: '1',
    default_biaya_pesan: '0',
    biaya_pesan_per_faktur: '5000',
    threshold_expired_hari: '90',
    asumsi_dus_tradisional: '2',
  })

  useEffect(() => {
    setForm({
      nama_apotek:            data.nama_apotek?.value            ?? '',
      alamat_apotek:          data.alamat_apotek?.value          ?? '',
      nama_apj:               data.nama_apj?.value               ?? '',
      nomor_sia:              data.nomor_sia?.value              ?? '',
      nomor_sipa_apj:         data.nomor_sipa_apj?.value         ?? '',
      kota_apotek:            data.kota_apotek?.value            ?? '',
      default_service_level:  data.default_service_level?.value  ?? '95',
      default_lead_time:      data.default_lead_time?.value      ?? '1',
      default_biaya_pesan:    data.default_biaya_pesan?.value    ?? '0',
      biaya_pesan_per_faktur: data.biaya_pesan_per_faktur?.value  ?? '5000',
      threshold_expired_hari: data.threshold_expired_hari?.value ?? '90',
      asumsi_dus_tradisional: data.asumsi_dus_tradisional?.value ?? '2',
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
      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-fg-secondary mb-4">Informasi Apotek</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-secondary">Nama Apotek</label>
            <input value={form.nama_apotek} onChange={e => set('nama_apotek', e.target.value)}
              placeholder="Apotek Rezky Medika"
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            <p className="mt-1 text-xs text-fg-muted">Tampil di header semua laporan yang dicetak</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-secondary">Alamat Apotek</label>
            <textarea value={form.alamat_apotek} onChange={e => set('alamat_apotek', e.target.value)}
              rows={2} placeholder="Jalan ..."
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-secondary">Nama Apoteker Penanggung Jawab (APJ)</label>
            <input value={form.nama_apj} onChange={e => set('nama_apj', e.target.value)}
              placeholder="apt. Nama Lengkap, S.Farm."
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-secondary">Nomor SIA</label>
              <input value={form.nomor_sia} onChange={e => set('nomor_sia', e.target.value)}
                className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-secondary">Nomor SIPA APJ</label>
              <input value={form.nomor_sipa_apj} onChange={e => set('nomor_sipa_apj', e.target.value)}
                className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-secondary">Kota (untuk tanggal surat)</label>
              <input value={form.kota_apotek} onChange={e => set('kota_apotek', e.target.value)}
                placeholder="Manokwari"
                className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            </div>
          </div>
          <p className="text-xs text-fg-muted">SIA, SIPA, nama APJ, dan kota dipakai di kop &amp; tanda tangan Surat Pesanan saat reorder via WhatsApp.</p>
        </div>
      </div>

      {/* Default Kalkulasi EOQ */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-fg-secondary mb-1">Default Kalkulasi EOQ</h2>
        <p className="text-xs text-fg-muted mb-4">Nilai ini dipakai saat obat baru ditambahkan dan belum diisi manual. Bisa diubah per obat di halaman Edit Obat.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-secondary">Service Level Default</label>
            <select value={form.default_service_level} onChange={e => set('default_service_level', e.target.value)}
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              {SERVICE_LEVEL_OPTIONS.map(o => (
                <option key={o.value} value={String(o.value)}>{o.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-fg-muted">Dipakai untuk hitung Safety Stock</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-secondary">Lead Time Default (hari)</label>
            <input type="number" min="1" value={form.default_lead_time} onChange={e => set('default_lead_time', e.target.value)}
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            <p className="mt-1 text-xs text-fg-muted">Berapa hari barang datang setelah dipesan</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-secondary">Biaya Pesan Default (Rp)</label>
            <input type="number" min="0" value={form.default_biaya_pesan} onChange={e => set('default_biaya_pesan', e.target.value)}
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            <p className="mt-1 text-xs text-fg-muted">Nilai awal saat obat baru ditambahkan manual lewat Tambah Obat</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-secondary">Biaya Pesan per Faktur (Rp)</label>
            <input type="number" min="0" value={form.biaya_pesan_per_faktur} onChange={e => set('biaya_pesan_per_faktur', e.target.value)}
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            <p className="mt-1 text-xs text-fg-muted">
              Ongkos kirim/admin per sekali pesan (1 faktur) — dibagi rata ke tiap obat berbeda dalam faktur yang sama saat Stok Masuk dicatat, supaya biaya pesan tidak dihitung dobel per obat.
            </p>
          </div>
        </div>
      </div>

      {/* Analisis Komparatif */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-fg-secondary mb-1">Analisis Komparatif</h2>
        <p className="text-xs text-fg-muted mb-4">
          Dipakai untuk menghitung biaya skenario &quot;sebelum EOQ&quot; (tradisional) di halaman Analisis Komparatif dan chart Perbandingan Biaya Dashboard.
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-fg-secondary">Asumsi Jumlah Dus per Pemesanan (Tradisional)</label>
          <input type="number" min="0.1" step="0.1" value={form.asumsi_dus_tradisional} onChange={e => set('asumsi_dus_tradisional', e.target.value)}
            className="w-32 rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
          <p className="mt-1 text-xs text-fg-muted">
            Angka asumsi tetap, bukan dihitung dari riwayat transaksi supaya tidak tercemar kebiasaan pesan yang sudah ikut rekomendasi EOQ dari sistem ini. Default 2 dus.
          </p>
        </div>
      </div>

      {/* Peringatan */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-fg-secondary mb-4">Peringatan & Notifikasi</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-fg-secondary">Batas Peringatan Kedaluarsa (hari)</label>
          <div className="flex items-center gap-3">
            <input type="number" min="1" value={form.threshold_expired_hari} onChange={e => set('threshold_expired_hari', e.target.value)}
              className="w-32 rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            <span className="text-sm text-fg-muted">hari sebelum expired</span>
          </div>
          <p className="mt-1 text-xs text-fg-muted">Obat dengan expired dalam rentang ini tampil di peringatan dashboard dan laporan kedaluarsa</p>
        </div>
      </div>

      {/* Simpan */}
      <div className="flex justify-end">
        <button type="submit" disabled={update.isPending}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-fg-inverse font-medium rounded-lg px-6 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          <Save className="h-4 w-4" />
          {update.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </form>
  )
}
