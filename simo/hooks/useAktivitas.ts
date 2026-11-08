'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface RingkasanUser {
  id: number
  username: string
  nama: string
  role: 'admin' | 'staf'
  is_active: boolean
  last_seen_at: string | null
  online: boolean
  login_terakhir: string | null
  jumlah_login: number
  jumlah_aksi: number
  aksi_hari_ini: number
  halaman_dibuka: number
}

export interface RingkasanAktivitas {
  users: RingkasanUser[]
  hari_ini: {
    login_hari_ini: number
    aksi_hari_ini: number
    login_gagal_hari_ini: number
    user_online: number
  }
}

export type JenisAktivitas = 'login' | 'login_gagal' | 'logout' | 'halaman' | 'aksi'

export interface LogAktivitas {
  id: number
  user_id: number | null
  username: string | null
  nama: string | null
  role: string | null
  jenis: JenisAktivitas
  deskripsi: string | null
  path: string | null
  metode: string | null
  status_http: number | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

export interface LogFilter {
  user_id?: string
  jenis?: string
  dari?: string
  sampai?: string
  page?: number
  limit?: number
}

export interface LogResponse {
  data: LogAktivitas[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useRingkasanAktivitas() {
  return useQuery({
    queryKey: ['aktivitas', 'ringkasan'],
    queryFn: async () => {
      const res = await api.get('/aktivitas/ringkasan')
      return res.data.data as RingkasanAktivitas
    },
    refetchInterval: 30_000, // status "online" tetap segar tanpa reload manual
  })
}

export function useLogAktivitas(filter: LogFilter) {
  return useQuery({
    queryKey: ['aktivitas', 'log', filter],
    queryFn: async () => {
      const res = await api.get('/aktivitas', { params: filter })
      return { data: res.data.data, meta: res.data.meta } as LogResponse
    },
    refetchInterval: 30_000,
  })
}
