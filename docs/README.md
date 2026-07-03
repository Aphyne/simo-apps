# SIMO — Sistem Informasi Manajemen Persediaan Obat
## Apotek Rezky Medika, Manokwari, Papua Barat

> **Status:** Blueprint / Brief Arsitektur — belum ada coding
> **Terakhir diperbarui:** 2026-05-14

---

## Deskripsi Singkat

SIMO adalah sistem informasi berbasis web untuk manajemen persediaan obat pada skala UMKM, dikembangkan sebagai studi kasus pada **Apotek Rezky Medika** (Jalan Gunung Salju No. 14, Fanindi Bengkel Tan, Manokwari, Papua Barat).

Sistem ini mengimplementasikan metode:
- **EOQ** (Economic Order Quantity) — menentukan jumlah pemesanan optimal
- **Safety Stock** — menentukan stok pengaman minimum
- **ROP** (Reorder Point) — menentukan titik pemicu pemesanan ulang
- **Total Cost (TC)** — menghitung total biaya persediaan per tahun

**Fokus sistem:** Manajemen persediaan/gudang — **BUKAN sistem kasir atau POS.**

---

## Daftar Dokumen Brief

| File | Isi |
|---|---|
| [01-architecture.md](01-architecture.md) | Arsitektur sistem, tech stack, dan alur data |
| [02-folder-structure.md](02-folder-structure.md) | Struktur folder lengkap semua modul |
| [03-database-schema.md](03-database-schema.md) | Skema database PostgreSQL (Neon) |
| [04-api-endpoints.md](04-api-endpoints.md) | Spesifikasi REST API (Express.js backend) |
| [05-frontend-routes.md](05-frontend-routes.md) | Routing & komponen Next.js |
| [06-business-logic.md](06-business-logic.md) | Rumus EOQ, ROP, SS, TC — logika kalkulasi |
| [07-ui-guidelines.md](07-ui-guidelines.md) | Design system, warna, komponen UI |
| [08-development-roadmap.md](08-development-roadmap.md) | Fase pengembangan bertahap |
| [09-formula-deep-dive.md](09-formula-deep-dive.md) | Penjelasan mendalam rumus EOQ, ROP, SS, TC (mengapa ada angka 2, Z-score, dll.) |

---

## Ringkasan Arsitektur

```
Browser (Next.js 16)  ←→  Express.js Backend (Node.js)  ←→  Neon PostgreSQL
      │                              │
      └── /simo/                     └── /backend/
                                              ↕
                                  /database-migrations/
```

- **Frontend:** `/simo` — Next.js 16.2.6, App Router, TypeScript, Tailwind CSS v4
- **Backend:** `/backend` — Node.js dengan Express.js (`npm start` / `npm run dev`)
- **Database:** Neon PostgreSQL (cloud-hosted), migrations di `/database-migrations`
- **Auth:** JWT token disimpan di localStorage + cookie (untuk Next.js middleware)
- **Komunikasi:** REST API (JSON)

---

## User Role

| Role | Akses |
|---|---|
| **Admin / APJ** | Akses penuh semua fitur |
| **Staf / Karyawan** | Input barang masuk, input barang keluar, lihat stok |

---

## Scope Halaman (14 Halaman)

1. Login
2. Dashboard (ringkasan + grafik)
3. Data Master Obat
4. Tambah/Edit Data Obat
5. Barang Masuk
6. Barang Keluar
7. Perhitungan EOQ & ROP
8. **Simulasi Skenario** ← *novelty utama*
9. Monitoring Stok Real-time
10. Analisis Komparatif Biaya
11. Laporan (6 sub-laporan)
12. Manajemen Supplier
13. Manajemen User (Admin)
14. Pengaturan Sistem (Admin)
