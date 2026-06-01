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
          nama: string
          satuan: string
          stok: number
          expired_terdekat: string
        }[]
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
