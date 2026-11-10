'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Plus, Phone, MessageCircle, Package, Clock, MapPin, Search } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useSupplierList, useDeleteSupplier } from '@/hooks/useSupplier'

export default function SupplierTable() {
  const { data: suppliers = [], isLoading } = useSupplierList()
  const deleteMutation = useDeleteSupplier()
  const [search, setSearch] = useState('')

  const filtered = suppliers.filter((s) =>
    s.nama.toLowerCase().includes(search.toLowerCase()) ||
    (s.jenis_obat ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (s.alamat ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle pointer-events-none" />
          <input
            type="text"
            placeholder="Cari supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-line-strong rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div className="ml-auto">
          <Link
            href="/supplier/tambah"
            className="bg-brand-600 hover:bg-brand-700 text-fg-inverse font-medium rounded-lg px-4 py-2 text-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Supplier
          </Link>
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-3">
              <div className="h-5 animate-pulse bg-surface-muted rounded-lg w-2/3" />
              <div className="h-4 animate-pulse bg-surface-muted rounded-lg w-full" />
              <div className="h-4 animate-pulse bg-surface-muted rounded-lg w-3/4" />
              <div className="h-4 animate-pulse bg-surface-muted rounded-lg w-1/2" />
              <div className="h-8 animate-pulse bg-surface-muted rounded-lg w-full mt-2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-10 text-fg-muted text-sm">
          {search ? `Tidak ada supplier dengan kata kunci "${search}"` : 'Belum ada data supplier'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-xl border border-line bg-surface p-5 shadow-sm flex flex-col gap-3">
              {/* Header */}
              <div>
                <p className="font-semibold text-fg text-sm">{s.nama}</p>
                {s.alamat && (
                  <div className="flex items-start gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-fg-muted leading-relaxed">{s.alamat}</p>
                  </div>
                )}
              </div>

              {/* Info rows */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" />
                  <span className="text-xs text-fg-tertiary">{s.telepon ?? 'Tidak ada telepon'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" />
                  <span className="text-xs text-fg-tertiary truncate">{s.jenis_obat ?? 'Jenis obat belum diisi'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" />
                  <span className="text-xs text-fg-tertiary">Lead time {s.lead_time_avg} hari</span>
                </div>
              </div>

              {/* WA Button */}
              {s.whatsapp ? (
                <a
                  href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-success-500 hover:bg-success-600 text-fg-inverse rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat WhatsApp
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 bg-surface-subtle text-fg-muted border border-line rounded-lg px-3 py-2 text-xs">
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp belum tersedia
                </div>
              )}

              {/* Footer actions */}
              <div className="flex gap-2 pt-1 border-t border-line-subtle">
                <Link
                  href={`/supplier/${s.id}/edit`}
                  className="flex items-center gap-1.5 text-fg-muted hover:text-fg-secondary hover:bg-surface-muted rounded-lg px-3 py-1.5 text-xs transition-colors flex-1 justify-center"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <ConfirmDialog
                  trigger={
                    <button className="flex items-center gap-1.5 text-fg-muted hover:text-danger-600 hover:bg-danger-50 rounded-lg px-3 py-1.5 text-xs transition-colors flex-1 justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  }
                  title={`Hapus ${s.nama}?`}
                  description="Supplier yang masih digunakan oleh obat tidak bisa dihapus."
                  onConfirm={() => deleteMutation.mutate(s.id)}
                  loading={deleteMutation.isPending}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
