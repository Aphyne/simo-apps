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
  // User-agent perangkat login terakhir; dirapikan di tampilan (ringkasPerangkat).
  perangkat_terakhir: string | null
  // Tiga hitungan berikut mengikuti rentang tanggal halaman (bawaan: sepanjang waktu).
  jumlah_login: number
  jumlah_aksi: number
  aksi_hari_ini: number
  halaman_dibuka: number
  // Halaman + aksi per hari selama 7 hari terakhir, terlama dulu.
  tren_7_hari: number[]
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

// Rentang tanggal (YYYY-MM-DD, WIB). Kosong = tanpa batas: dari hari pertama ada catatan sampai hari ini.
export interface Rentang {
  dari?: string
  sampai?: string
}

export interface TitikHarian {
  awal: string // YYYY-MM-DD; tanggal itu sendiri (satuan hari) atau Senin minggu itu (satuan minggu)
  login: number
  halaman: number
  aksi: number
  login_gagal: number
  pengguna_aktif: number
}

export interface ModulPakai {
  kunci: string
  label: string
  halaman: number
  aksi: number
}

export interface AnalitikAktivitas {
  rentang: { dari: string; sampai: string; hari_total: number; satuan: 'hari' | 'minggu' }
  kpi: {
    login: number
    login_gagal: number
    aksi: number
    halaman: number
    hari_aktif: number
    sesi: number
    // Batas bawah (aktivitas terakhir sebelum login berikutnya), satu sesi dibatasi 8 jam.
    rata_sesi_menit: number
  }
  harian: TitikHarian[]
  modul: ModulPakai[]
  // 7 baris (Senin..Minggu) x 24 kolom (jam 0..23, WIB).
  jam: number[][]
  aksi_jenis: { tambah: number; ubah: number; hapus: number; lainnya: number }
  // null bila melihat satu pengguna. Selalu kondisi sekarang, tidak mengikuti rentang.
  perhatian: {
    login_gagal_beruntun: { username: string; jumlah: number; terakhir: string }[]
    akun_lama_diam: { id: number; nama: string; username: string; last_seen_at: string | null }[]
    akun_nonaktif: number
  } | null
}

export function useRingkasanAktivitas(rentang: Rentang = {}) {
  return useQuery({
    queryKey: ['aktivitas', 'ringkasan', rentang.dari ?? '', rentang.sampai ?? ''],
    queryFn: async () => {
      const res = await api.get('/aktivitas/ringkasan', { params: rentang })
      return res.data.data as RingkasanAktivitas
    },
    refetchInterval: 30_000, // status "online" tetap segar tanpa reload manual
  })
}

export function useAnalitikAktivitas(rentang: Rentang = {}, userId?: number | null, aktif = true) {
  return useQuery({
    queryKey: ['aktivitas', 'analitik', rentang.dari ?? '', rentang.sampai ?? '', userId ?? 0],
    enabled: aktif,
    queryFn: async () => {
      const res = await api.get('/aktivitas/analitik', { params: { ...rentang, user_id: userId ?? undefined } })
      return res.data.data as AnalitikAktivitas
    },
    refetchInterval: 30_000,
  })
}

export function useLogAktivitas(filter: LogFilter, aktif = true) {
  return useQuery({
    queryKey: ['aktivitas', 'log', filter],
    enabled: aktif,
    queryFn: async () => {
      const res = await api.get('/aktivitas', { params: filter })
      return { data: res.data.data, meta: res.data.meta } as LogResponse
    },
    refetchInterval: 30_000,
  })
}
