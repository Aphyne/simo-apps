'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { Obat, ObatFormData, DetailPerhitungan } from '@/types/obat'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

interface ObatListParams {
  page?: number
  limit?: number
  search?: string
  kategori?: string
  status?: string
}

export function useObatList(params: ObatListParams = {}) {
  return useQuery({
    queryKey: ['obat', params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Obat>>('/obat', { params })
      return res.data
    },
  })
}

export function useObatById(id: number | string | undefined) {
  return useQuery({
    queryKey: ['obat', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Obat>>(`/obat/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useCreateObat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ObatFormData) => {
      const res = await api.post<ApiResponse<Obat>>('/obat', data)
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obat'] })
      toast.success('Obat berhasil ditambahkan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal menambah obat')
    },
  })
}

export function useUpdateObat(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ObatFormData) => {
      const res = await api.put<ApiResponse<Obat>>(`/obat/${id}`, data)
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obat'] })
      toast.success('Obat berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal memperbarui obat')
    },
  })
}

export function useDeleteObat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/obat/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obat'] })
      toast.success('Obat berhasil dihapus')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal menghapus obat')
    },
  })
}

export function useObatPerhitungan(id: number | string | undefined) {
  return useQuery({
    queryKey: ['obat', id, 'perhitungan'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DetailPerhitungan>>(`/obat/${id}/perhitungan`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useReorderAlerts() {
  return useQuery({
    queryKey: ['reorder-alerts'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: { id: number; kode: string; nama: string; satuan: string; stok: number; rop: number; eoq: number | null; nama_supplier: string | null; supplier_whatsapp: string | null }[] }>('/obat/reorder-alert')
      return res.data.data
    },
    refetchInterval: 60000,
  })
}

export function useObatBatchSummary(id: number | string | undefined) {
  return useQuery({
    queryKey: ['obat', id, 'batch-summary'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{
        expired_batch: string
        total_masuk: number
        estimasi_sisa: number
        satuan: string
      }[]>>(`/obat/${id}/batch-summary`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useHitungUlang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post<ApiResponse<Obat>>(`/obat/${id}/hitung-ulang`)
      return res.data.data
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['obat'] })
      qc.invalidateQueries({ queryKey: ['obat', String(id), 'perhitungan'] })
      toast.success('Kalkulasi berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal menghitung ulang')
    },
  })
}
