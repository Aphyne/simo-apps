'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Pencil, Trash2 } from 'lucide-react'
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
import { useCreateBarangKeluarBulk } from '@/hooks/useBarangKeluar'
import { useObatList } from '@/hooks/useObat'
import { formatRupiah } from '@/lib/utils'
import type { Obat } from '@/types/obat'

const KETERANGAN_OPTIONS = ['Penjualan', 'Retur', 'Rusak', 'Kedaluarsa', 'Lainnya'] as const

interface Props {
  onSuccess: () => void
}

interface HeaderValues {
  tanggal: string
  keterangan_str: string
  catatan: string
}

interface KeranjangItem {
  obat_id: number
  nama: string
  kode: string
  satuan: string
  harga_jual: number
  jumlah: number
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-fg-secondary mb-1 block">
      {children}
      {required && <span className="text-danger-600 ml-0.5">*</span>}
    </label>
  )
}

// ─── Info stok obat yang sedang dipilih di form input ────────────────────────
function StokInfo({ obat, jumlah }: { obat?: Obat; jumlah: number }) {
  if (!obat) return null
  const stokSetelah = jumlah > 0 ? obat.stok - jumlah : null
  return (
    <p className="text-xs text-fg-muted">
      Stok:{' '}
      <span className={obat.stok <= 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
        {obat.stok} {obat.satuan}
      </span>
      {stokSetelah !== null && (
        <span className={`ml-2 font-medium ${stokSetelah < 0 ? 'text-red-600' : stokSetelah <= (obat.rop ?? 0) ? 'text-orange-700' : 'text-gray-500'}`}>
          → sisa {stokSetelah} {obat.satuan}
          {stokSetelah < 0 && ' — tidak cukup!'}
          {stokSetelah >= 0 && stokSetelah <= (obat.rop ?? 0) && ' — akan di bawah ROP ⚠️'}
        </span>
      )}
    </p>
  )
}

export default function BarangKeluarForm({ onSuccess }: Props) {
  const { data: obatData } = useObatList({ limit: 999 })
  const bulkMutation = useCreateBarangKeluarBulk()
  const obatList = obatData?.data ?? []

  const {
    register,
    control,
    handleSubmit,
    reset: resetHeader,
    formState: { errors: headerErrors },
  } = useForm<HeaderValues>({
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      keterangan_str: '',
      catatan: '',
    },
  })

  // ─── Form input item (baris aktif, belum masuk keranjang) ─────────────────
  const [obatIdStr, setObatIdStr] = useState('')
  const [jumlah, setJumlah] = useState(0)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [itemError, setItemError] = useState('')

  // ─── Keranjang ──────────────────────────────────────────────────────────────
  const [keranjang, setKeranjang] = useState<KeranjangItem[]>([])

  const selectedObat = obatList.find((o) => String(o.id) === obatIdStr)
  const totalHarga = keranjang.reduce((sum, it) => sum + it.harga_jual * it.jumlah, 0)

  function resetFormInput() {
    setObatIdStr('')
    setJumlah(0)
    setEditingIndex(null)
    setItemError('')
  }

  function handleMasukkanKeranjang() {
    if (!obatIdStr || jumlah <= 0) {
      setItemError('Pilih obat dan isi jumlah lebih dari 0')
      return
    }
    const obat = obatList.find((o) => String(o.id) === obatIdStr)
    if (!obat) {
      setItemError('Obat tidak ditemukan')
      return
    }

    // Jumlah yang sudah dialokasikan ke obat yang sama di baris keranjang lain
    // (supaya validasi tetap benar walau 1 obat ditambahkan di beberapa baris terpisah)
    const sudahDialokasikan = keranjang.reduce(
      (sum, it, i) => (it.obat_id === obat.id && i !== editingIndex ? sum + it.jumlah : sum),
      0
    )
    if (obat.stok - sudahDialokasikan < jumlah) {
      setItemError(
        `Stok ${obat.nama} tidak cukup (tersedia ${obat.stok - sudahDialokasikan} ${obat.satuan})`
      )
      return
    }

    const item: KeranjangItem = {
      obat_id: obat.id,
      nama: obat.nama,
      kode: obat.kode,
      satuan: obat.satuan,
      harga_jual: obat.harga_jual ?? 0,
      jumlah,
    }

    setKeranjang((prev) => {
      if (editingIndex !== null) {
        const next = [...prev]
        next[editingIndex] = item
        return next
      }
      return [...prev, item]
    })
    resetFormInput()
  }

  function handleEditItem(index: number) {
    const item = keranjang[index]
    setObatIdStr(String(item.obat_id))
    setJumlah(item.jumlah)
    setEditingIndex(index)
    setItemError('')
  }

  function handleHapusItem(index: number) {
    setKeranjang((prev) => prev.filter((_, i) => i !== index))
    if (editingIndex === index) resetFormInput()
  }

  async function onSubmit(header: HeaderValues) {
    if (!header.keterangan_str) return
    if (keranjang.length === 0) {
      setItemError('Minimal 1 obat harus ditambahkan ke keranjang')
      return
    }

    // Atomic di backend: kalau 1 item gagal (misal stok berubah oleh transaksi
    // lain tepat sebelum submit), SEMUA item dibatalkan dan keranjang tetap utuh
    // di sini supaya user tinggal perbaiki lalu submit ulang — tidak ada input
    // yang hilang maupun transaksi yang "setengah tersimpan".
    await bulkMutation.mutateAsync({
      tanggal: header.tanggal,
      keterangan: header.keterangan_str,
      catatan: header.catatan || undefined,
      items: keranjang.map((it) => ({ obat_id: it.obat_id, jumlah: it.jumlah })),
    })
    resetHeader()
    setKeranjang([])
    resetFormInput()
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

      {/* Tanggal + Keterangan */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Tanggal</FieldLabel>
          <Input type="date" {...register('tanggal', { required: true })} />
          {headerErrors.tanggal && <p className="text-xs text-danger-600 mt-1">Wajib diisi</p>}
        </div>
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
          {headerErrors.keterangan_str && <p className="text-xs text-danger-600 mt-1">Wajib dipilih</p>}
        </div>
      </div>

      {/* Form input item */}
      <div className="rounded-lg border border-dashed border-line-strong p-3 space-y-2 bg-surface-subtle/50">
        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide">
          {editingIndex !== null ? 'Edit Item' : 'Tambah Item ke Keranjang'}
        </p>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <ObatCombobox obatList={obatList} value={obatIdStr} onChange={(v) => { setObatIdStr(v); setItemError('') }} />
          </div>
          <div className="w-24 flex-shrink-0">
            <Input
              type="number"
              min="1"
              placeholder="Qty"
              value={jumlah || ''}
              onChange={(e) => { setJumlah(parseInt(e.target.value) || 0); setItemError('') }}
            />
          </div>
        </div>
        <StokInfo obat={selectedObat} jumlah={jumlah} />
        {itemError && <p className="text-xs text-danger-600">{itemError}</p>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMasukkanKeranjang}
            className="flex-1 text-sm font-medium text-brand-600 hover:text-brand-700 border border-dashed border-brand-300 hover:border-brand-500 rounded-lg py-2 transition-colors"
          >
            {editingIndex !== null ? 'Simpan Perubahan' : '+ Masukkan ke Keranjang'}
          </button>
          {editingIndex !== null && (
            <button
              type="button"
              onClick={resetFormInput}
              className="text-sm font-medium text-fg-muted hover:text-fg-secondary border border-line-strong rounded-lg px-4 py-2 transition-colors"
            >
              Batal
            </button>
          )}
        </div>
      </div>

      {/* Daftar keranjang */}
      <div className="border-t border-line-subtle pt-1">
        <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide">
          Daftar Keranjang ({keranjang.length})
        </p>
      </div>

      <div className="rounded-lg border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-subtle border-b border-line">
              <th className="px-3 py-2 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">Obat</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-fg-muted uppercase tracking-wide">Qty</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-fg-muted uppercase tracking-wide">Harga Jual</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-fg-muted uppercase tracking-wide">Total</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-fg-muted uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          {keranjang.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-fg-muted">Belum ada obat di keranjang</td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-line-subtle">
              {keranjang.map((item, index) => (
                <tr key={`${item.obat_id}-${index}`} className={index === editingIndex ? 'bg-brand-50' : ''}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-fg">{item.nama}</div>
                    <div className="text-xs text-fg-muted">{item.kode}</div>
                  </td>
                  <td className="px-3 py-2 text-right text-fg-secondary">{item.jumlah} {item.satuan}</td>
                  <td className="px-3 py-2 text-right text-fg-secondary">{formatRupiah(item.harga_jual)}</td>
                  <td className="px-3 py-2 text-right font-medium text-fg">{formatRupiah(item.harga_jual * item.jumlah)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditItem(index)}
                        className="rounded-lg p-1.5 text-fg-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        aria-label="Edit item"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHapusItem(index)}
                        className="rounded-lg p-1.5 text-fg-muted hover:text-danger-600 hover:bg-danger-50 transition-colors"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
          {keranjang.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-line bg-surface">
                <td colSpan={3} className="px-3 py-2.5 text-right text-sm font-semibold text-fg-secondary">Total Harga</td>
                <td className="px-3 py-2.5 text-right text-sm font-bold text-fg">{formatRupiah(totalHarga)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Catatan */}
      <div>
        <FieldLabel>Catatan</FieldLabel>
        <Input placeholder="Catatan tambahan (opsional)" {...register('catatan')} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-line-subtle">
        <Button
          type="button"
          variant="outline"
          className="border-line-strong text-fg-secondary hover:bg-surface-subtle rounded-lg px-4 py-2 text-sm"
          onClick={() => { resetHeader(); setKeranjang([]); resetFormInput(); onSuccess() }}
        >
          Batal
        </Button>
        <Button
          type="submit"
          className="bg-danger-600 hover:bg-danger-700 text-fg-inverse font-medium rounded-lg px-4 py-2 text-sm"
          disabled={bulkMutation.isPending}
        >
          {bulkMutation.isPending ? 'Menyimpan...' : 'Simpan Semua'}
        </Button>
      </div>

    </form>
  )
}
