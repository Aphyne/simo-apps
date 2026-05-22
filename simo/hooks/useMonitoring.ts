'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface MonitoringItem {
  id: number
  kode: string
  nama: string
  kategori: string
  satuan: string
  stok: number
  rop: number | null
  demand_harian: number
  estimasi_habis_hari: number
  status_stok: 'Kritis' | 'Perlu Reorder' | 'Aman' | 'Belum Dihitung'
}

export function useMonitoring(search?: string) {
  return useQuery({
    queryKey: ['monitoring', search],
    queryFn: async () => {
      const res = await api.get('/monitoring', { params: search ? { search } : {} })
      return res.data.data as MonitoringItem[]
    },
    refetchInterval: 60000,
  })
}
