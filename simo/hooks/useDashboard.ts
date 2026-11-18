'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary')
      return res.data.data as {
        cards: {
          total_obat: number
          obat_reorder: number
          penjualan_hari_ini: number
          transaksi_hari_ini: number
          obat_expiring: number
          // Tambahan baru; opsional sampai backend dijalankan ulang
          masuk_hari_ini?: number
          keluar_hari_ini?: number
          pendapatan_hari_ini?: number
          penjualan_tanpa_harga?: number
          penjualan_transaksi?: number
          obat_segera_habis?: number
          kedaluwarsa_lewat?: number
        }
        obat_mendesak: {
          id: number
          kode: string
          nama: string
          satuan: string
          stok: number
          rop: number
          eoq: number | null
          selisih: number
        }[]
        daftar_expired: {
          id?: number
          kode?: string
          nama: string
          satuan: string
          no_batch?: string | null
          stok: number
          expired_terdekat: string
        }[]
        total_urgent: number
        stok_menipis: {
          id: number
          kode: string
          nama: string
          satuan: string
          stok: number
          rop: number
          eoq: number | null
          selisih: number
        }[]
        // Sudah lewat tanggal tetapi masih tercatat berstok (perkiraan per batch). Opsional sampai backend dijalankan ulang.
        daftar_lewat?: {
          id: number
          kode: string
          nama: string
          satuan: string
          no_batch: string | null
          stok: number
          expired_terdekat: string
        }[]
        // Hanya admin: staf tidak menerima angka uang, jadi bidang ini kosong atau tidak ada.
        terlaris_30_hari?: {
          id: number
          nama: string
          satuan: string
          jumlah: number
          pendapatan: number
        }[]
        perlu_dilengkapi?: {
          penjualan_tanpa_harga: number
          obat_tanpa_supplier: number
          batch_tanpa_nomor: number
        } | null
      }
    },
    refetchInterval: 60000,
  })
}

export function useTrenPermintaan() {
  return useQuery({
    queryKey: ['dashboard-tren'],
    queryFn: async () => {
      const res = await api.get('/dashboard/tren-permintaan')
      return res.data.data as { bulan: string; total: string }[]
    },
  })
}

export function usePerbandinganBiaya() {
  return useQuery({
    queryKey: ['dashboard-biaya'],
    queryFn: async () => {
      const res = await api.get('/dashboard/perbandingan-biaya')
      return res.data.data as {
        id: number
        nama: string
        nama_lengkap: string
        biaya_eoq: number
        biaya_tanpa_eoq: number
        penghematan: number
      }[]
    },
  })
}

// Pembelian (stok masuk x harga beli) vs penjualan (hanya keterangan Penjualan x harga jual), Rupiah per bulan, 6 bulan.
// Hanya admin (backend menolak peran lain); `aktif` false = tidak menembak API sama sekali.
export function usePembelianPenjualan(aktif: boolean) {
  return useQuery({
    enabled: aktif,
    queryKey: ['dashboard-pembelian-penjualan'],
    queryFn: async () => {
      const res = await api.get('/dashboard/pembelian-penjualan')
      return res.data.data as {
        bulan: string // YYYY-MM-DD, tanggal 1
        pembelian: number
        penjualan: number
        penjualan_tanpa_harga: number // jumlah baris penjualan bulan itu yang belum ber-harga (tidak ikut terhitung)
      }[]
    },
    refetchInterval: 60000,
  })
}
