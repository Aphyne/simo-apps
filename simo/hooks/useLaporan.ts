'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface LaporanStokItem {
  id: number; kode: string; nama: string; kategori: string; satuan: string
  stok: number; eoq: number | null; safety_stock: number | null; rop: number | null
  total_biaya: number | null; expired_terdekat: string | null; demand_harian: number | null
}

export interface LaporanBarangMasukItem {
  id: number; tanggal: string; kode: string; nama_obat: string; satuan: string; kategori: string
  jumlah_dus: number; jumlah_satuan: number; nama_supplier: string | null
  no_faktur: string | null; catatan: string | null; nama_user: string | null; role_user: string | null
}

export interface LaporanBarangKeluarItem {
  id: number; tanggal: string; kode: string; nama_obat: string; satuan: string; kategori: string
  jumlah: number; keterangan: string; stok_sebelum: number; stok_sesudah: number
  catatan: string | null; nama_user: string | null; role_user: string | null
}

export interface LaporanKedaluarsaItem {
  id: number; kode: string; nama: string; kategori: string; satuan: string
  stok: number; expired_terdekat: string; sisa_hari: number
}

export interface LaporanEoqRopItem {
  id: number; kode: string; nama: string; satuan: string; kategori: string
  demand_harian: number | null; demand_tahunan: number | null; std_dev_demand: number | null
  biaya_pesan: number; biaya_simpan: number; lead_time: number; service_level: number
  eoq: number | null; safety_stock: number | null; rop: number | null; total_biaya: number | null
}

export function useLaporanStok(kategori?: string) {
  return useQuery({
    queryKey: ['laporan-stok', kategori],
    queryFn: async () => {
      const res = await api.get('/laporan/stok', { params: { kategori } })
      return res.data.data as LaporanStokItem[]
    },
  })
}

export function useLaporanBarangMasuk(dari?: string, sampai?: string, kategori?: string) {
  return useQuery({
    queryKey: ['laporan-barang-masuk', dari, sampai, kategori],
    queryFn: async () => {
      const res = await api.get('/laporan/barang-masuk', { params: { dari, sampai, kategori } })
      return res.data.data as LaporanBarangMasukItem[]
    },
  })
}

export function useLaporanBarangKeluar(dari?: string, sampai?: string, keterangan?: string, kategori?: string) {
  return useQuery({
    queryKey: ['laporan-barang-keluar', dari, sampai, keterangan, kategori],
    queryFn: async () => {
      const res = await api.get('/laporan/barang-keluar', { params: { dari, sampai, keterangan, kategori } })
      return res.data.data as LaporanBarangKeluarItem[]
    },
  })
}

export function useLaporanKedaluarsa(hari: number = 90, kategori?: string) {
  return useQuery({
    queryKey: ['laporan-kedaluarsa', hari, kategori],
    queryFn: async () => {
      const res = await api.get('/laporan/kedaluarsa', { params: { hari, kategori } })
      return res.data.data as LaporanKedaluarsaItem[]
    },
  })
}

export function useLaporanEoqRop(kategori?: string) {
  return useQuery({
    queryKey: ['laporan-eoq-rop', kategori],
    queryFn: async () => {
      const res = await api.get('/laporan/eoq-rop', { params: { kategori } })
      return res.data.data as LaporanEoqRopItem[]
    },
  })
}
