'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { toast } from 'sonner'

export interface UserItem {
  id: number
  username: string
  nama: string
  role: 'admin' | 'staf'
  is_active: boolean
  created_at: string
  jumlah_transaksi: number
}

export function useUserList() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users')
      return res.data.data as UserItem[]
    },
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { username: string; password: string; nama: string; role: string }) => {
      const res = await api.post('/users', payload)
      return res.data.data as UserItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User berhasil ditambahkan')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Gagal menambahkan user')
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; nama: string; role: string; is_active: boolean }) => {
      const res = await api.put(`/users/${id}`, payload)
      return res.data.data as UserItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User berhasil diperbarui')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Gagal memperbarui user')
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, password_baru }: { id: number; password_baru: string }) => {
      await api.post(`/users/${id}/reset-password`, { password_baru })
    },
    onSuccess: () => toast.success('Password berhasil direset'),
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Gagal mereset password')
    },
  })
}

export function useToggleAktif() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/users/${id}/toggle-aktif`)
      return res.data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(data.message)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Gagal mengubah status user')
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/users/${id}`)
      return res.data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(data.message)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Gagal menghapus user')
    },
  })
}
