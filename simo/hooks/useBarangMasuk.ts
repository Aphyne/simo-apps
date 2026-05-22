'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { BarangMasuk, BarangMasukFormData } from '@/types/obat'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

interface ListParams {
  page?: number
  limit?: number
  search?: string
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
