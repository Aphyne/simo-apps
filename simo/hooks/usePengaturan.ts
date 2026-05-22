'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { toast } from 'sonner'

export interface PengaturanData {
  [key: string]: { value: string; deskripsi: string }
}

export function usePengaturan() {
  return useQuery({
    queryKey: ['pengaturan'],
    queryFn: async () => {
      const res = await api.get('/pengaturan')
      return res.data.data as PengaturanData
    },
  })
}

export function useUpdatePengaturan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      await api.put('/pengaturan', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pengaturan'] })
      toast.success('Pengaturan berhasil disimpan')
    },
    onError: () => toast.error('Gagal menyimpan pengaturan'),
  })
}
