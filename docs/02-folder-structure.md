# Struktur Folder Lengkap SIMO

## Gambaran Root

```
d:\skripsi new\simo\          ← root workspace
├── docs/                     ← brief & dokumentasi arsitektur (ini)
├── simo/                     ← frontend Next.js (sudah di-setup)
├── backend/                  ← Node.js Express backend
└── database-migrations/      ← raw SQL migration files untuk Neon
```

---

## `/docs` — Dokumentasi & Brief

```
docs/
├── README.md                 ← ringkasan proyek
├── 01-architecture.md        ← arsitektur & tech stack
├── 02-folder-structure.md    ← ini
├── 03-database-schema.md     ← skema tabel PostgreSQL
├── 04-api-endpoints.md       ← spesifikasi REST API
├── 05-frontend-routes.md     ← routing & komponen Next.js
├── 06-business-logic.md      ← rumus EOQ, ROP, SS, TC
├── 08-development-roadmap.md ← fase pengembangan
├── DESIGN.md                 ← design system (sumber tunggal)
├── FE-AGENT.md               ← penunjuk ke DESIGN.md untuk agent
└── design-reference/         ← gambar acuan redesign (Akuris)
```

---

## `/simo` — Frontend Next.js

```
simo/
├── app/
│   ├── (auth)/                       ← route group: halaman tanpa sidebar
│   │   └── login/
│   │       └── page.tsx              ← Halaman 1: Login
│   │
│   ├── (dashboard)/                  ← route group: halaman dengan sidebar
│   │   ├── layout.tsx                ← layout utama (sidebar + header)
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx              ← Halaman 2: Dashboard
│   │   │
│   │   ├── obat/
│   │   │   ├── page.tsx              ← Halaman 3: Data Master Obat (tabel)
│   │   │   ├── tambah/
│   │   │   │   └── page.tsx          ← Halaman 4: Tambah Obat
│   │   │   └── [id]/
│   │   │       ├── edit/
│   │   │       │   └── page.tsx      ← Halaman 4: Edit Obat
│   │   │       └── detail/
│   │   │           └── page.tsx      ← Detail perhitungan per obat
│   │   │
│   │   ├── barang-masuk/
│   │   │   └── page.tsx              ← Halaman 5: Barang Masuk
│   │   │
│   │   ├── barang-keluar/
│   │   │   └── page.tsx              ← Halaman 6: Barang Keluar
│   │   │
│   │   ├── perhitungan/
│   │   │   └── page.tsx              ← Halaman 7: Perhitungan EOQ & ROP
│   │   │
│   │   ├── simulasi/
│   │   │   └── page.tsx              ← Halaman 8: Simulasi Skenario
│   │   │
│   │   ├── monitoring/
│   │   │   └── page.tsx              ← Halaman 9: Monitoring Stok
│   │   │
│   │   ├── analisis/
│   │   │   └── page.tsx              ← Halaman 10: Analisis Komparatif
│   │   │
│   │   ├── laporan/
│   │   │   ├── stok-harian/
│   │   │   │   └── page.tsx          ← Laporan A: Stok Harian
│   │   │   ├── barang-masuk/
│   │   │   │   └── page.tsx          ← Laporan B: Barang Masuk
│   │   │   ├── barang-keluar/
│   │   │   │   └── page.tsx          ← Laporan C: Barang Keluar
│   │   │   ├── kedaluarsa/
│   │   │   │   └── page.tsx          ← Laporan D: Hampir Kedaluarsa
│   │   │   ├── eoq-rop/
│   │   │   │   └── page.tsx          ← Laporan E: EOQ & ROP
│   │   │   └── simulasi/
│   │   │       └── page.tsx          ← Laporan F: Simulasi Skenario
│   │   │
│   │   ├── supplier/
│   │   │   └── page.tsx              ← Halaman 12: Manajemen Supplier
│   │   │
│   │   ├── users/
│   │   │   └── page.tsx              ← Halaman 13: Manajemen User (Admin)
│   │   │
│   │   └── pengaturan/
│   │       └── page.tsx              ← Halaman 14: Pengaturan Sistem (Admin)
│   │
│   ├── globals.css
│   ├── layout.tsx                    ← root layout (font, provider wrapping)
│   └── page.tsx                      ← redirect ke /login atau /dashboard
│
├── components/
│   ├── ui/                           ← shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   │
│   ├── layout/                       ← komponen layout global
│   │   ├── Sidebar.tsx               ← navigasi kiri dengan role-based menu
│   │   ├── Header.tsx                ← header atas (nama user, logout, notif)
│   │   └── Breadcrumb.tsx            ← breadcrumb navigasi
│   │
│   ├── charts/                       ← komponen grafik
│   │   ├── TrenPermintaanChart.tsx   ← line chart 6 bulan
│   │   ├── PerbandinganBiayaChart.tsx ← bar chart sebelum vs sesudah EOQ
│   │   └── SimulasiChart.tsx         ← bar chart simulasi vs aktual
│   │
│   ├── tables/                       ← komponen tabel reusable
│   │   ├── DataTable.tsx             ← tabel generik dengan pagination
│   │   ├── ObatTable.tsx             ← tabel data master obat
│   │   ├── BarangMasukTable.tsx
│   │   ├── BarangKeluarTable.tsx
│   │   └── MonitoringTable.tsx
│   │
│   ├── forms/                        ← komponen form
│   │   ├── ObatForm.tsx              ← form tambah/edit obat
│   │   ├── BarangMasukForm.tsx
│   │   ├── BarangKeluarForm.tsx
│   │   └── SimulasiForm.tsx
│   │
│   ├── dashboard/                    ← komponen khusus dashboard
│   │   ├── StatCard.tsx              ← card ringkasan (total obat, dll)
│   │   ├── ReorderTable.tsx          ← tabel 5 obat paling mendesak
│   │   └── AlertNotification.tsx     ← alert popup ROP
│   │
│   └── shared/                       ← komponen lintas fitur
│       ├── StatusBadge.tsx           ← badge AMAN/MENDEKATI ROP/HARUS REORDER
│       ├── LoadingSpinner.tsx
│       ├── ExportButton.tsx          ← tombol export PDF/Excel
│       ├── ConfirmDialog.tsx         ← dialog konfirmasi hapus
│       └── RumusDisplay.tsx          ← tampilan langkah perhitungan
│
├── hooks/                            ← custom React hooks
│   ├── useAuth.ts                    ← auth state & login/logout
│   ├── useObat.ts                    ← CRUD obat via React Query
│   ├── useBarangMasuk.ts
│   ├── useBarangKeluar.ts
│   ├── useSimulasi.ts
│   └── useDashboard.ts
│
├── lib/                              ← utilitas & konfigurasi
│   ├── api.ts                        ← axios instance + interceptors
│   ├── auth.ts                       ← token helpers
│   ├── utils.ts                      ← helper functions (formatRupiah, dll)
│   └── constants.ts                  ← konstanta (status stok, kategori, dll)
│
├── store/                            ← Zustand stores
│   ├── auth.store.ts                 ← user session state
│   └── notification.store.ts         ← alert/notification state
│
├── types/                            ← TypeScript interfaces
│   ├── obat.ts
│   ├── barang.ts
│   ├── simulasi.ts
│   ├── user.ts
│   └── api.ts                        ← tipe response API generik
│
├── public/                           ← static assets
│   └── logo-apotek.png
│
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

---

## `/backend` — Node.js Express

```
backend/
├── src/
│   ├── controllers/                  ← handler per resource
│   │   ├── authController.js
│   │   ├── obatController.js
│   │   ├── barangMasukController.js
│   │   ├── barangKeluarController.js
│   │   ├── supplierController.js
│   │   ├── simulasiController.js
│   │   ├── laporanController.js
│   │   ├── dashboardController.js
│   │   ├── userController.js
│   │   └── pengaturanController.js
│   │
│   ├── middleware/                   ← middleware Express
│   │   ├── authMiddleware.js         ← verify JWT token
│   │   └── roleMiddleware.js         ← cek role admin/staf
│   │
│   ├── services/                     ← business logic terpisah dari controller
│   │   ├── eoqService.js             ← kalkulasi EOQ, SS, ROP, TC
│   │   ├── stokService.js            ← update stok, cek status, trigger kalkulasi
│   │   ├── demandService.js          ← hitung demand harian & std dev dari history
│   │   └── laporanService.js         ← query & format data laporan
│   │
│   ├── routes/                       ← definisi route per resource
│   │   ├── auth.js
│   │   ├── obat.js
│   │   ├── barangMasuk.js
│   │   ├── barangKeluar.js
│   │   ├── supplier.js
│   │   ├── simulasi.js
│   │   ├── laporan.js
│   │   ├── dashboard.js
│   │   ├── users.js
│   │   └── pengaturan.js
│   │
│   ├── db/
│   │   └── pool.js                   ← pg.Pool instance (pakai DATABASE_URL)
│   │
│   └── app.js                        ← Express app setup, mount semua route
│
├── .env
├── .env.example
└── package.json
```

**Cara menjalankan:**
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

---

## `/database-migrations` — Raw SQL untuk Neon

```
database-migrations/
├── README.md                         ← cara menjalankan migration ke Neon
├── 001_create_users.sql
├── 002_create_supplier.sql
├── 003_create_obat.sql
├── 004_create_barang_masuk.sql
├── 005_create_barang_keluar.sql
├── 006_create_simulasi_skenario.sql
├── 007_create_pengaturan.sql
├── 008_seed_users.sql                ← data awal: admin default
├── 009_seed_pengaturan.sql           ← data awal: pengaturan default
└── 010_seed_obat_contoh.sql          ← data contoh obat untuk testing
```

> File SQL ini bisa dijalankan langsung via Neon console / psql, independen dari Laravel migration. Berguna untuk reset database atau dokumentasi skripsi.
