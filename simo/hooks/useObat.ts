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
  // Urutan dan filter expired dikerjakan backend (daftar putih): sort = nama|stok|estimasi|expired, arah = asc|desc, expired = akan|lewat
  sort?: string
  arah?: string
  expired?: string
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

// Seluruh obat untuk ringkasan, donat, dan pilihan filter. Backend memotong `limit` di 100 per permintaan
// (limit lebih besar dipotong diam-diam, bukan ditolak), jadi `limit: 9999` hanya mengembalikan 100 obat
// dan angka ringkasan salah bila obat lebih dari 100. Hook ini mengambil halaman demi halaman sampai habis.
const UKURAN_HALAMAN = 100
const BATAS_HALAMAN_AMAN = 50

export function useObatSemua() {
  return useQuery({
    queryKey: ['obat', 'semua'],
    queryFn: async (): Promise<PaginatedResponse<Obat>> => {
      const semua: Obat[] = []
      let halaman = 1
      let total = 0
      let halamanTerakhir = 1
      do {
        const res = await api.get<PaginatedResponse<Obat>>('/obat', { params: { page: halaman, limit: UKURAN_HALAMAN } })
        semua.push(...res.data.data)
        total = res.data.meta.total
        halamanTerakhir = res.data.meta.last_page
        halaman += 1
      } while (halaman <= halamanTerakhir && halaman <= BATAS_HALAMAN_AMAN)
      return {
        success: true,
        data: semua,
        meta: { current_page: 1, per_page: semua.length, total, last_page: 1 },
      }
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

export function useObatPerhitungan(id: number | string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['obat', id, 'perhitungan'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DetailPerhitungan>>(`/obat/${id}/perhitungan`)
      return res.data.data
    },
    enabled: !!id && enabled,
  })
}

export interface ReorderAlertItem {
  id: number
  kode: string
  nama: string
  satuan: string
  satuan_per_dus: number
  stok: number
  rop: number
  safety_stock: number
  eoq: number | null
  demand_harian: number
  supplier_id: number | null
  nama_supplier: string | null
  supplier_nama: string | null
  supplier_whatsapp: string | null
  supplier_alamat: string | null
  // Saran pesan dari server: jumlah dalam satuan pesan (dus bila isi per dus > 1)
  saran_jumlah: number
  basis_saran: 'EOQ' | 'ROP'
  satuan_pesan: string
}

export function useReorderAlerts() {
  return useQuery({
    queryKey: ['reorder-alerts'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ReorderAlertItem[] }>('/obat/reorder-alert')
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
        no_batch: string | null
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

// Kategori dan satuan yang sudah dipakai obat. Kunci di bawah ['obat'], jadi otomatis segar setelah obat dibuat/diubah.
export function useObatOpsi() {
  return useQuery({
    queryKey: ['obat', 'opsi'],
    queryFn: async () => {
      const res = await api.get('/obat/opsi')
      return res.data.data as { kategori: string[]; satuan: string[] }
    },
    staleTime: 60_000,
  })
}
