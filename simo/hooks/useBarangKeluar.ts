'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { BarangKeluar, BarangKeluarFormData, BarangKeluarUpdateFormData, BarangKeluarBulkFormData, BarangKeluarBulkResponse } from '@/types/obat'
import type { PaginatedResponse } from '@/types/api'

interface ListParams {
  page?: number
  limit?: number
  search?: string
  keterangan?: string
  tanggal?: string
  dari?: string
  sampai?: string
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

export function useUpdateBarangKeluar(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: BarangKeluarUpdateFormData) => {
      const res = await api.put(`/barang-keluar/${id}`, data)
      return res.data as { success: boolean; data: BarangKeluar; reorder_alert: boolean }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barang-keluar'] })
      qc.invalidateQueries({ queryKey: ['obat'] })
      qc.invalidateQueries({ queryKey: ['reorder-alerts'] })
      toast.success('Barang keluar berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal memperbarui barang keluar')
    },
  })
}

export function useDeleteBarangKeluar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/barang-keluar/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barang-keluar'] })
      qc.invalidateQueries({ queryKey: ['obat'] })
      qc.invalidateQueries({ queryKey: ['reorder-alerts'] })
      toast.success('Barang keluar berhasil dihapus')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal menghapus barang keluar')
    },
  })
}

export function useCreateBarangKeluarBulk() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: BarangKeluarBulkFormData) => {
      const res = await api.post<BarangKeluarBulkResponse>('/barang-keluar/bulk', data)
      return res.data
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['barang-keluar'] })
      qc.invalidateQueries({ queryKey: ['obat'] })
      qc.invalidateQueries({ queryKey: ['reorder-alerts'] })
      toast.success(result.message)

      result.reorder_alerts.forEach((alert) => {
        toast.warning(
          `⚠️ Stok ${alert.nama_obat} sudah di bawah ROP (${alert.stok_sesudah} ≤ ${alert.rop}). Segera lakukan pemesanan!`,
          { duration: 8000 }
        )
      })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal mencatat barang keluar')
    },
  })
}
