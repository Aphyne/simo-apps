# Development Roadmap — SIMO

Panduan urutan pengembangan yang disarankan agar setiap fase menghasilkan sesuatu yang bisa diuji.

---

## Development Workflow (Cara Kerja Kita)

Ini adalah aturan kolaborasi yang harus diikuti di setiap fase pengembangan.

### Alur per Fase

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CLAUDE CODING                                               │
│     Claude mengerjakan semua item dalam satu fase               │
│     (backend + frontend sesuai urutan di roadmap)               │
└────────────────────────────┬────────────────────────────────────┘
                             │ selesai coding
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. CLAUDE REPORT                                               │
│     Claude memberikan laporan di chat:                          │
│     - Apa saja yang sudah dibuat                                │
│     - Step-by-step cara testing (DETAIL)                        │
│     - Hal yang perlu diperhatikan / known issues                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. USER TESTING (kamu yang jalankan server & test)             │
│     - Jalankan server sendiri (backend + frontend)              │
│     - Ikuti langkah testing yang Claude berikan                 │
│     - Catat jika ada yang tidak sesuai                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
        ADA BUG / REVISI               ACC ✅
        Claude fix dulu            Claude update checklist
        → kembali ke step 2        di roadmap ini (✅ per item)
                                   → lanjut ke fase berikutnya
```

### Aturan Penting

| Aturan | Detail |
|---|---|
| **Server dijalankan oleh kamu** | Claude tidak menjalankan `php artisan serve` atau `npm run dev` |
| **Claude report dulu sebelum update checklist** | Checklist hanya di-update setelah kamu ACC |
| **Testing step diberikan di chat** | Bukan di file — agar mudah diikuti langsung |
| **Satu fase selesai sepenuhnya sebelum lanjut** | Tidak skip fase |
| **Bug ditemukan saat testing → Claude fix dulu** | Baru ACC dan update checklist |

### Template Laporan Claude (setiap selesai fase)

```
✅ FASE X SELESAI — [nama fase]

Yang sudah dibuat:
- ...
- ...

Cara menjalankan server:
  Backend : cd backend && npm run dev
  Frontend: cd simo && npm run dev

LANGKAH TESTING:
1. Buka browser ke http://localhost:3000/...
2. ...
3. Expected result: ...

Yang perlu diperhatikan:
- ...
```

---

## Status Fase

| Fase | Nama | Status |
|---|---|---|
| 0 | Persiapan & Setup | ✅ ACC |
| 1 | Auth & Layout | ✅ ACC |
| 2 | Data Master Obat | ✅ ACC |
| 3 | Kalkulasi EOQ/ROP | ✅ ACC |
| 4 | Transaksi Barang Masuk & Keluar | ⬜ Belum |
| 5 | Dashboard | ⬜ Belum |
| 6 | Monitoring & Analisis | ⬜ Belum |
| 7 | Simulasi Skenario | ⬜ Belum |
| 8 | Laporan & Export | ⬜ Belum |
| 9 | Manajemen User & Pengaturan | ⬜ Belum |
| 10 | Polish & Testing | ⬜ Belum |

> Legend: ⬜ Belum &nbsp;|&nbsp; 🔄 Sedang dikerjakan &nbsp;|&nbsp; 🧪 Menunggu ACC &nbsp;|&nbsp; ✅ ACC

---

## Fase 0 — Persiapan & Setup ✅ ACC

**Target:** Semua environment siap, tidak ada coding fitur

**Backend (`/backend`):**
- [x] Struktur folder Express disiapkan (`src/controllers`, `src/routes`, `src/middleware`, `src/db`)
- [x] `package.json` dengan semua dependencies (express, jwt, bcryptjs, pg, dll)
- [x] `.env.example` dengan format `DATABASE_URL`

**Database (`/database-migrations`):**
- [x] Buat file SQL migrations (001 s.d. 010)
- [x] Makefile + migrate.js untuk CLI migration via `DATABASE_URL`
- [x] Jalankan ke Neon via `make migrate` + `make seed`
- [x] Seed data awal: admin, staf, pengaturan default, 10 obat + 3 supplier

**Frontend (`/simo`):**
- [x] Install semua dependencies (shadcn, react-query, zustand, axios, recharts, dll)
- [x] shadcn/ui di-init dengan Tailwind v4
- [x] Font Inter di `app/layout.tsx`
- [x] `app/providers.tsx` — QueryClientProvider
- [x] `app/globals.css` — CSS variables tema biru
- [x] `app/page.tsx` — redirect ke `/login`
- [x] `lib/api.ts` — axios instance + interceptor token
- [x] `lib/utils.ts` — cn, formatRupiah, formatTanggal, dll
- [x] `lib/constants.ts` — konstanta kategori, satuan, status
- [x] `types/` — TypeScript interfaces (obat, user, api)
- [x] `store/auth.store.ts` — Zustand auth store
- [x] `middleware.ts` — proteksi route Next.js

---

## Fase 1 — Fondasi Auth & Layout (~3 hari)

**Target:** Bisa login, muncul sidebar, route protection berjalan

**Backend:**
- [x] `src/db/pool.js` — koneksi ke Neon via `DATABASE_URL`
- [x] `src/app.js` — Express setup, CORS, health check, mount routes
- [x] `src/middleware/authMiddleware.js` — verify JWT
- [x] `src/middleware/roleMiddleware.js` — cek role
- [x] `src/controllers/authController.js` — login, logout, me
- [x] `src/routes/auth.js` — `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- [x] Seed 2 user: admin & staf sudah ada di database dari fase 0

**Frontend:**
- [x] `components/layout/Sidebar.tsx` — menu berbasis role (admin/staf)
- [x] `components/layout/Header.tsx` — nama user, badge role, tombol keluar
- [x] `app/(dashboard)/layout.tsx` — sidebar + header + main
- [x] `app/(auth)/login/page.tsx` — form login dengan validasi
- [x] `store/auth.store.ts` — Zustand auth store (sudah ada dari fase 0)
- [x] `hooks/useAuth.ts` — login, logout, hydrate
- [x] `middleware.ts` — proteksi route (sudah ada dari fase 0)
- [x] `lib/utils.ts` — ditambahkan formatRupiah, formatTanggal, dll
- [x] `app/layout.tsx` — Toaster sonner ditambahkan
- [x] Test: login sebagai admin → muncul sidebar lengkap, login sebagai staf → menu terbatas

---

## Fase 2 — Data Master Obat (~4 hari)

**Target:** Bisa tambah, edit, lihat, hapus data obat

**Backend:**
- [x] `src/controllers/supplierController.js`: CRUD lengkap
- [x] `src/controllers/obatController.js`: CRUD + auto-generate kode + placeholder kalkulasi
- [x] `src/routes/supplier.js` + `src/routes/obat.js`
- [x] Route: semua CRUD supplier & obat (data sudah ada dari seed fase 0)

**Frontend:**
- [x] `ObatTable.tsx` — tabel dengan pagination, search, filter status, 11 kolom informatif
- [x] `/obat/page.tsx`
- [x] `ObatForm.tsx` — form tambah/edit dengan validasi + UX improvement (bantu hitung, toggle biaya simpan, tooltip, auto-link demand)
- [x] `/obat/tambah/page.tsx` + `/obat/[id]/edit/page.tsx`
- [x] `StatusBadge.tsx`
- [x] `ConfirmDialog.tsx` untuk hapus
- [x] `SupplierTable.tsx` + `SupplierForm.tsx` + halaman CRUD supplier lengkap
- [x] `types/supplier.ts`, `hooks/useObat.ts`, `hooks/useSupplier.ts`
- [x] Test: CRUD obat, status badge muncul sesuai stok vs ROP

---

## Fase 3 — Kalkulasi EOQ/ROP (Inti) ✅ ACC

**Target:** Sistem menghitung EOQ, SS, ROP, TC otomatis dan akurat

**Backend:**
- [x] `src/services/eoqService.js` — semua fungsi kalkulasi
- [x] `src/services/demandService.js` — defer ke Fase 4 (butuh data barang keluar)
- [x] `src/services/stokService.js` — trigger kalkulasi ulang
- [x] Integrasi kalkulasi ke `obatController.js` (saat POST/PUT)
- [x] `GET /api/obat/:id/perhitungan` — step-by-step kalkulasi
- [x] `POST /api/obat/:id/hitung-ulang`
- [x] Verifikasi kalkulasi manual: EOQ = √(2DS/H), SS = Z×σ×√LT, ROP = (d×LT)+SS ✓

**Frontend:**
- [x] `RumusDisplay.tsx` — tampilan langkah perhitungan + label hasil (unit per pemesanan, stok pengaman, titik pemesanan ulang)
- [x] `/obat/[id]/detail/page.tsx` — detail per obat
- [x] `/perhitungan/page.tsx` — tabel semua obat + detail kalkulasi inline
- [x] Test: input obat → kalkulasi otomatis → verifikasi manual ✓

---

## Fase 4 — Transaksi Barang Masuk & Keluar (~4 hari)

**Target:** Stok berubah setelah transaksi, alert reorder berfungsi

**Backend:**
- [ ] `src/controllers/barangMasukController.js`: POST (konversi dus→satuan terkecil + update stok)
- [ ] `src/controllers/barangKeluarController.js`: POST (update stok + cek ROP + trigger kalkulasi ulang)
- [ ] Logic: POST barang-keluar → `stokService.hitungUlangObat()` → return `reorder_alert`
- [ ] GET list barang masuk & keluar (dengan filter)
- [ ] `src/routes/barangMasuk.js` + `src/routes/barangKeluar.js`

**Frontend:**
- [ ] `BarangMasukForm.tsx` + `/barang-masuk/page.tsx`
- [ ] `BarangKeluarForm.tsx` + `/barang-keluar/page.tsx`
- [ ] `AlertNotification.tsx` — toast reorder
- [ ] `notification.store.ts` — Zustand untuk state alert
- [ ] `BarangMasukTable.tsx`, `BarangKeluarTable.tsx` — riwayat transaksi
- [ ] Test: input barang keluar → stok berkurang → jika stok ≤ ROP → alert merah muncul

---

## Fase 5 — Dashboard (~3 hari)

**Target:** Dashboard menampilkan ringkasan real-time

**Backend:**
- [ ] `src/controllers/dashboardController.js`:
  - `GET /api/dashboard/summary` — 5 card + tabel 5 obat mendesak
  - `GET /api/dashboard/tren-permintaan` — data grafik 6 bulan
  - `GET /api/dashboard/perbandingan-biaya`
- [ ] `src/routes/dashboard.js`

**Frontend:**
- [ ] `StatCard.tsx` × 5 varian
- [ ] `ReorderTable.tsx`
- [ ] `TrenPermintaanChart.tsx` (Recharts LineChart)
- [ ] `PerbandinganBiayaChart.tsx` (Recharts BarChart)
- [ ] `/dashboard/page.tsx` — assembly semua komponen
- [ ] Test: pastikan angka di dashboard konsisten dengan data di tabel obat

---

## Fase 6 — Monitoring & Analisis (~3 hari)

**Target:** Monitoring real-time dan analisis komparatif

**Backend:**
- [ ] `src/controllers/monitoringController.js` — `GET /api/monitoring` dengan filter
- [ ] `src/controllers/analisisController.js`:
  - `GET /api/analisis/kondisi-sesudah`
  - `POST /api/analisis/simpan-kondisi-sebelum`
  - `GET /api/analisis/perbandingan`

**Frontend:**
- [ ] `MonitoringTable.tsx` dengan progress bar & estimasi habis
- [ ] `/monitoring/page.tsx`
- [ ] `/analisis/page.tsx` — form input kondisi sebelum + tabel perbandingan + grafik

---

## Fase 7 — Simulasi Skenario (Novelty) (~4 hari)

**Target:** Fitur simulasi berjalan penuh tanpa mengubah data aktual

**Backend:**
- [ ] `src/controllers/simulasiController.js`:
  - `POST /api/simulasi/jalankan` — kalkulasi skenario (tidak simpan)
  - `POST /api/simulasi/simpan` — simpan hasil
  - `GET /api/simulasi` — list tersimpan
  - `DELETE /api/simulasi/:id`
- [ ] `src/routes/simulasi.js` (tabel simulasi_skenario sudah ada dari seed fase 0)

**Frontend:**
- [ ] `SimulasiForm.tsx` — panel input parameter
- [ ] `SimulasiChart.tsx` — bar chart perbandingan
- [ ] `/simulasi/page.tsx` — layout split: panel kiri (aktual) + panel kanan (simulasi)
- [ ] Test: pastikan simulasi +20% demand menghasilkan SS dan ROP yang lebih besar, TC berubah sesuai

---

## Fase 8 — Laporan & Export (~4 hari)

**Target:** Semua laporan bisa ditampilkan dan diekspor ke PDF/Excel

**Backend:**
- [ ] `src/controllers/laporanController.js` + `src/services/laporanService.js`:
  - stok harian, barang masuk, barang keluar, kedaluarsa, eoq-rop, simulasi
- [ ] `src/routes/laporan.js`

**Frontend:**
- [ ] Semua 6 halaman laporan
- [ ] `ExportButton.tsx`:
  - PDF dengan jsPDF (format laporan rapi, ada header apotek)
  - Excel dengan xlsx
- [ ] Laporan EOQ-ROP: tampilkan langkah-langkah perhitungan (menggunakan `RumusDisplay.tsx`)
- [ ] Test: export PDF → cek header, tabel, format angka Rupiah benar

---

## Fase 9 — Manajemen User & Pengaturan (~2 hari)

**Target:** Admin bisa kelola user dan pengaturan sistem

**Backend:**
- [ ] `src/controllers/userController.js`: CRUD + reset password
- [ ] `src/controllers/pengaturanController.js`: GET + PUT
- [ ] `src/routes/users.js` + `src/routes/pengaturan.js`

**Frontend:**
- [ ] `/users/page.tsx` — tabel user + form tambah/edit
- [ ] `/pengaturan/page.tsx` — form pengaturan sistem
- [ ] Test: tambah user staf → login sebagai staf → cek menu terbatas

---

## Fase 10 — Polish & Testing (~3 hari)

**Target:** Sistem siap untuk demo dan dokumentasi skripsi

- [ ] Responsive layout (test di HP)
- [ ] Loading skeleton di semua tabel
- [ ] Empty state di semua tabel
- [ ] Error handling: koneksi gagal, validasi form
- [ ] Seed data lengkap: 20-30 obat dengan riwayat transaksi 3 bulan
- [ ] Verifikasi semua kalkulasi EOQ/SS/ROP manual vs sistem
- [ ] Cek konsistensi angka dashboard vs tabel detail
- [ ] Screenshot semua halaman untuk lampiran skripsi

---

## Catatan Pengembangan

1. **Urutan coding:** Database → Backend (service + controller + route) → Frontend (hook + komponen + halaman). Jangan membangun frontend sebelum API-nya siap. Backend Express dijalankan dengan `npm run dev` dari folder `/backend`.

2. **Test kalkulasi lebih dulu:** Fase 3 (kalkulasi EOQ) adalah fase paling kritis. Verifikasi dengan data dummy menggunakan kalkulator manual sebelum lanjut ke fase berikutnya.

3. **Data seed realistis:** Gunakan nama obat yang nyata ada di apotek (Paracetamol, Amoxicillin, Antasida, Vitamin C, dll) dengan harga beli yang masuk akal. Ini memudahkan validasi bersama pihak apotek.

4. **Dokumentasi untuk skripsi:** Simpan screenshot setiap halaman setelah selesai. Endpoint `GET /api/obat/{id}/perhitungan` sangat penting karena outputnya bisa langsung masuk ke bab hasil & pembahasan skripsi.

5. **Biaya pesan S = 0:** Ini kondisi aktual Apotek Rezky Medika. Pastikan sistem menangani kasus ini dengan baik dan menampilkan penjelasan yang informatif (bukan error).
