'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { toast } from 'sonner'

export interface HasilSimulasi {
  obat: { id: number; nama: string; kode: string; satuan: string }
  parameter_input: {
    demand_perubahan_pct: number
    lead_time_baru: number
    biaya_pesan_baru: number
    biaya_simpan_baru: number
  }
  aktual: {
    demand_tahunan: number
    demand_harian: number
    biaya_pesan: number
    biaya_simpan: number
    lead_time: number
    eoq: number | null
    safety_stock: number
    rop: number
    total_biaya: number | null
  }
  simulasi: {
    demand_tahunan: number
    demand_harian: number
    biaya_pesan: number
    biaya_simpan: number
    lead_time: number
    eoq: number | null
    safety_stock: number
    rop: number
    total_biaya: number | null
  }
  selisih: {
    eoq: number | null
    safety_stock: number
    rop: number
    total_biaya: number | null
  }
}

export interface SimulasiTersimpan {
  id: number
  nama_skenario: string
  nama_obat: string
  kode_obat: string
  satuan: string
  nama_user: string | null
  created_at: string
  parameter_input: Record<string, number>
  hasil_simulasi: {
    aktual: HasilSimulasi['aktual']
    simulasi: HasilSimulasi['simulasi']
    selisih: HasilSimulasi['selisih']
  }
}

export function useSimulasiList() {
  return useQuery({
    queryKey: ['simulasi-list'],
    queryFn: async () => {
      const res = await api.get('/simulasi')
      return res.data.data as SimulasiTersimpan[]
    },
  })
}

export function useJalankanSimulasi() {
  return useMutation({
    mutationFn: async (payload: {
      obat_id: number
      demand_perubahan_pct: number
      lead_time_baru: number
      biaya_pesan_baru: number
      biaya_simpan_baru: number
    }) => {
      const res = await api.post('/simulasi/jalankan', payload)
      return res.data.data as HasilSimulasi
    },
    onError: () => toast.error('Gagal menjalankan simulasi'),
  })
}

export function useSimpanSimulasi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      obat_id: number
      nama_skenario: string
      parameter_input: Record<string, number>
      aktual: HasilSimulasi['aktual']
      simulasi: HasilSimulasi['simulasi']
      selisih: HasilSimulasi['selisih']
    }) => {
      const res = await api.post('/simulasi/simpan', payload)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['simulasi-list'] })
      toast.success('Simulasi berhasil disimpan')
    },
    onError: () => toast.error('Gagal menyimpan simulasi'),
  })
}

export function useDeleteSimulasi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/simulasi/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['simulasi-list'] })
      toast.success('Simulasi dihapus')
    },
    onError: () => toast.error('Gagal menghapus simulasi'),
  })
}
