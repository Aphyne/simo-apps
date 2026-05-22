'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { Supplier, SupplierFormData } from '@/types/supplier'
import type { ApiResponse } from '@/types/api'

export function useSupplierList() {
  return useQuery({
    queryKey: ['supplier'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Supplier[]>>('/supplier')
      return res.data.data
    },
  })
}

export function useSupplierById(id: number | string | undefined) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Supplier>>(`/supplier/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const res = await api.post<ApiResponse<Supplier>>('/supplier', data)
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier'] })
      toast.success('Supplier berhasil ditambahkan')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal menambah supplier')
    },
  })
}

export function useUpdateSupplier(id: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const res = await api.put<ApiResponse<Supplier>>(`/supplier/${id}`, data)
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier'] })
      toast.success('Supplier berhasil diperbarui')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal memperbarui supplier')
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/supplier/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier'] })
      toast.success('Supplier berhasil dihapus')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Gagal menghapus supplier')
    },
  })
}
