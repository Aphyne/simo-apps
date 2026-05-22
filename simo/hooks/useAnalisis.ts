'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface AnalisisDetail {
  id: number
  kode: string
  nama: string
  satuan: string
  demand_tahunan: number
  biaya_pesan: number
  biaya_simpan: number
  q_tradisional: number
  q_eoq: number
  tc_tradisional: number
  tc_eoq: number
  penghematan: number
  persen_hemat: number
}

export interface AnalisisRingkasan {
  total_obat_dihitung: number
  total_tc_tradisional: number
  total_tc_eoq: number
  total_penghematan: number
  persen_hemat_total: number
}

export interface AnalisisData {
  ringkasan: AnalisisRingkasan
  detail: AnalisisDetail[]
}

export function useAnalisisPerbandingan() {
  return useQuery({
    queryKey: ['analisis-perbandingan'],
    queryFn: async () => {
      const res = await api.get('/analisis/perbandingan')
      return res.data.data as AnalisisData
    },
  })
}
