'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { BarangMasuk, BarangMasukFormData, BarangMasukUpdateFormData, BarangMasukBulkFormData, BarangMasukBulkResponse } from '@/types/obat'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

interface ListParams {
  page?: number
  limit?: number
  search?: string
  tanggal?: string
  dari?: string
  sampai?: string
}

export function useBarangMasukList(params: ListParams = {}) {
  return useQuery({
    queryKey: ['barang-masuk', params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<BarangMasuk>>('/barang-masuk', { params })
      return res.data
    },
  })
}

export function useCreateBarangMasuk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: BarangMasukFormData) => {
      const res = await api.post<ApiResponse<BarangMasuk>>('/barang-masuk', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barang-masuk'] })
      qc.invalidateQueries({ queryKey: ['obat'] })
      qc.invalidateQueries({ queryKey: ['reorder-alerts'] })
      toast.success('Barang masuk berhasil dicatat')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal mencatat barang masuk')
    },
  })
}

export function useUpdateBarangMasuk(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: BarangMasukUpdateFormData) => {
      const res = await api.put<ApiResponse<BarangMasuk>>(`/barang-masuk/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barang-masuk'] })
      qc.invalidateQueries({ queryKey: ['obat'] })
      qc.invalidateQueries({ queryKey: ['reorder-alerts'] })
      toast.success('Barang masuk berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal memperbarui barang masuk')
    },
  })
}

export function useDeleteBarangMasuk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/barang-masuk/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barang-masuk'] })
      qc.invalidateQueries({ queryKey: ['obat'] })
      qc.invalidateQueries({ queryKey: ['reorder-alerts'] })
      toast.success('Barang masuk berhasil dihapus')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal menghapus barang masuk')
    },
  })
}

export function useCreateBarangMasukBulk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: BarangMasukBulkFormData) => {
      const res = await api.post<BarangMasukBulkResponse>('/barang-masuk/bulk', data)
      return res.data
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['barang-masuk'] })
      qc.invalidateQueries({ queryKey: ['obat'] })
      qc.invalidateQueries({ queryKey: ['reorder-alerts'] })
      toast.success(result.message)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal mencatat barang masuk')
    },
  })
}
