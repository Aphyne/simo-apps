'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { BarangKeluar, BarangKeluarFormData } from '@/types/obat'
import type { PaginatedResponse } from '@/types/api'

interface ListParams {
  page?: number
  limit?: number
  search?: string
  keterangan?: string
}

export function useBarangKeluarList(params: ListParams = {}) {
  return useQuery({
    queryKey: ['barang-keluar', params],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<BarangKeluar>>('/barang-keluar', { params })
      return res.data
    },
  })
}

export function useCreateBarangKeluar() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: BarangKeluarFormData) => {
      const res = await api.post('/barang-keluar', data)
      return res.data as {
        success: boolean
        data: BarangKeluar
        reorder_alert: boolean
        obat_nama: string
        stok_sesudah: number
        rop: number | null
      }
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['barang-keluar'] })
      qc.invalidateQueries({ queryKey: ['obat'] })
      qc.invalidateQueries({ queryKey: ['reorder-alerts'] })
      toast.success('Barang keluar berhasil dicatat')

      if (result.reorder_alert) {
        toast.warning(
          `⚠️ Stok ${result.obat_nama} sudah di bawah ROP (${result.stok_sesudah} ≤ ${result.rop}). Segera lakukan pemesanan!`,
          { duration: 8000 }
        )
      }
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal mencatat barang keluar')
    },
  })
}
