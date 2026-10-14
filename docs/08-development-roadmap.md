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
| 4 | Transaksi Barang Masuk & Keluar | ✅ ACC |
| 5 | Dashboard | ✅ ACC |
| 6 | Monitoring & Analisis | ✅ ACC |
| 7 | Simulasi Skenario | ✅ ACC |
| 8 | Laporan & Export | ✅ ACC |
| 9 | Manajemen User & Pengaturan | ✅ ACC |
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

## Fase 4 — Transaksi Barang Masuk & Keluar ✅ ACC

**Target:** Stok berubah setelah transaksi, alert reorder berfungsi

**Backend:**
- [x] `src/controllers/barangMasukController.js`: POST (konversi dus→satuan + update stok) + GET list dengan JOIN users
- [x] `src/controllers/barangKeluarController.js`: POST (update stok + cek ROP + trigger kalkulasi ulang + update demand) + GET list dengan JOIN users
- [x] `src/services/demandService.js`: hitung demand harian & std dev dari 30 hari riwayat penjualan
- [x] Logic: POST barang-keluar → `hitungUlangObat()` → return `reorder_alert`
- [x] GET list barang masuk & keluar (dengan filter + kolom dicatat oleh)
- [x] `src/routes/barangMasuk.js` + `src/routes/barangKeluar.js`
- [x] `GET /api/obat/reorder-alert` — query obat dengan stok ≤ ROP dari database

**Frontend:**
- [x] `BarangMasukForm.tsx` — form dengan preview konversi dus→satuan
- [x] `BarangKeluarForm.tsx` — form dengan preview stok sesudah + warning ROP
- [x] `/barang-masuk/page.tsx` + `/barang-keluar/page.tsx`
- [x] `BarangMasukTable.tsx`, `BarangKeluarTable.tsx` — riwayat + kolom "Dicatat oleh" (nama + badge Admin/Staf)
- [x] `AlertNotification.tsx` — bell icon di header, data dari API (bukan event), persist dismiss per browser
- [x] `notification.store.ts` — Zustand persist untuk dismissed IDs
- [x] `useReorderAlerts` — query dari DB, auto-refresh 60 detik, invalidate saat barang masuk/keluar
- [x] Test: stok ≤ ROP → bell muncul otomatis tanpa perlu transaksi dulu ✓
- [x] Test: restock → bell hilang otomatis tanpa refresh ✓

---

## Fase 5 — Dashboard ✅ ACC

**Target:** Dashboard menampilkan ringkasan real-time

**Backend:**
- [x] `src/controllers/dashboardController.js`:
  - `GET /api/dashboard/summary` — 5 card + tabel 5 obat mendesak
  - `GET /api/dashboard/tren-permintaan` — data grafik 6 bulan
  - `GET /api/dashboard/perbandingan-biaya`
- [x] `src/routes/dashboard.js`

**Frontend:**
- [x] `StatCard.tsx` — 5 card: Total Obat, Perlu Reorder, Penjualan Hari Ini, Transaksi Hari Ini, Akan Expired
- [x] `ReorderTable.tsx` — 5 obat paling kritis, klikable ke halaman detail
- [x] `TrenPermintaanChart.tsx` (Recharts LineChart) — penjualan 6 bulan terakhir
- [x] `PerbandinganBiayaChart.tsx` (Recharts BarChart) — biaya EOQ vs tradisional
- [x] `/dashboard/page.tsx` — assembly semua komponen + loading skeleton
- [x] Test: angka dashboard konsisten dengan data tabel obat ✓

---

## Fase 6 — Monitoring & Analisis ✅ ACC

**Target:** Monitoring real-time dan analisis komparatif

**Backend:**
- [x] `src/controllers/analisisController.js`:
  - [x] `GET /api/analisis/perbandingan` — TC EOQ vs tradisional (Q=satuan_per_dus), ringkasan + detail + biaya_pesan & biaya_simpan
  - [x] `GET /api/analisis/kondisi-sesudah`
- [x] `src/routes/analisis.js` — mount di app.js `/api/analisis`

**Frontend:**
- [x] `hooks/useAnalisis.ts` — query + TypeScript types
- [x] `/analisis/page.tsx` — info box penjelasan, 4 summary card, bar chart, tabel detail + modal breakdown step-by-step
- [x] `Sidebar.tsx` — "Monitoring Stok" dihapus dari navigasi (duplikasi dengan Data Obat)

**Keputusan desain:**
- [x] Monitoring dihapus dari sidebar — fungsinya sudah di-cover Data Obat + Dashboard
- [x] ~~Q tradisional = satuan_per_dus (asumsi akademis, valid untuk skripsi)~~ — **direvisi**, lihat "Revisi Q Tradisional" di bawah
- [x] Label "qty" diganti "jumlah pesan", "Q Tradisional" diganti "Isi per Dus" — **label ini juga direvisi**, lihat di bawah
- [x] Modal detail menampilkan breakdown rumus per baris agar user paham asal angka

### Revisi Q Tradisional — dari `satuan_per_dus` (selalu 1 dus) ke asumsi tetap yang bisa diubah (default 2 dus) ✅ Selesai

**Latar belakang (masukan dosen pembimbing, 2026-09-28):**
Perhitungan biaya sebelum EOQ (skenario tradisional) di halaman Analisis Komparatif dan chart "Perbandingan Biaya" Dashboard awalnya selalu mengasumsikan jumlah pemesanan = 1 dus (`Q_trad = satuan_per_dus`). Dosen menilai ini tidak adil — realitanya apotek bisa saja biasa pesan lebih dari 1 dus sekali jalan. Dosen memberi contoh: asumsikan 2 dus per pemesanan, supaya perbandingan biaya sebelum vs sesudah EOQ lebih adil dan konsisten.

**Opsi yang dipertimbangkan dan kenapa ditolak:**

| Opsi | Kenapa tidak dipakai |
|---|---|
| Hitung rata-rata `jumlah_dus` dari riwayat `barang_masuk` per obat (data asli) | Saat keputusan ini diambil, **belum ada data `barang_masuk` sama sekali** (masih tahap awal/dummy) dan belum semua obat punya riwayat transaksi. Apotek Rezky Medika berskala UMKM kecil — pencatatan ke depannya juga tidak dijamin lengkap/konsisten, jadi rata-rata dari sedikit transaksi berisiko tidak representatif (misal cuma 1 transaksi uji coba). |
| Kombinasi: pakai asumsi tetap kalau belum ada data, otomatis pindah ke rata-rata asli begitu data cukup | **Masalah kontaminasi:** begitu SIMO mulai dipakai, staf akan melihat rekomendasi ROP/EOQ dan transaksi `barang_masuk` baru yang tercatat otomatis mulai mengikuti pola EOQ (bukan lagi "cara lama" murni). Karena TIDAK PERNAH ADA periode data `barang_masuk` yang murni "sebelum sistem ada" untuk apotek ini (data baru mulai terkumpul justru SETELAH sistem aktif), rata-rata yang dihitung otomatis dari data yang terus berjalan akan pelan-pelan bergeser mendekati `Q_eoq` itu sendiri. Akibatnya selisih biaya "sebelum vs sesudah EOQ" akan mengecil secara semu — seolah EOQ makin lama makin tidak berguna, padahal itu cuma karena baseline "sebelum"-nya diam-diam ikut tercemar data "sesudah". |

**Keputusan final:** Q tradisional = **asumsi tetap** yang bisa diubah admin lewat halaman Pengaturan (key `asumsi_dus_tradisional`, default **2 dus**), dikalikan `satuan_per_dus` per obat. Bukan dihitung otomatis dari data historis. Berlaku untuk semua obat termasuk yang belum punya riwayat transaksi sama sekali (beda dari rencana awal yang sempat mengecualikan obat tanpa riwayat).

**Kenapa demand (D) tidak ikut dibekukan, cuma Q tradisional saja:** Demand (barang keluar/penjualan) ditentukan pembeli, bukan oleh cara apotek memesan stok — jadi tidak berisiko tercemar rekomendasi EOQ dan aman tetap dihitung live/real-time dari data 30 hari terakhir seperti biasa. Yang berisiko tercemar hanya kebiasaan **jumlah pesan** (Q), karena itu satu-satunya angka yang bisa langsung dipengaruhi rekomendasi sistem.

**Catatan soal angka penghematan yang berubah-ubah:** Karena D tetap live, nilai Rupiah/persentase penghematan EOQ vs tradisional akan wajar naik-turun seiring waktu (ikut demand) — ini bukan cacat, karena kedua sisi (biaya tradisional & biaya EOQ) selalu dihitung dari D yang sama di titik waktu yang sama, sehingga perbandingannya tetap adil di setiap saat. Untuk kebutuhan laporan skripsi, ambil snapshot (screenshot) di satu titik waktu dan sertakan tanggal pengambilan datanya, bukan mengandalkan satu angka final yang tidak pernah berubah.

**Jalan lain yang lebih aman kalau suatu saat ingin pakai data asli (opsional, belum dikerjakan):**
Kalau di masa depan Anda punya catatan riwayat pemesanan dari **sebelum SIMO dipakai** (misalnya dari nota/arsip kertas lama apotek), itu bisa dimasukkan **manual sebagai referensi satu kali** — bukan dihitung otomatis terus-menerus dari transaksi yang sedang berjalan. Ini beda cerita karena datanya murni dari masa sebelum sistem ada, jadi tidak berisiko tercemar rekomendasi EOQ. Ini mirip dengan ide `POST /api/analisis/simpan-kondisi-sebelum` yang sempat didokumentasikan di [04-api-endpoints.md](04-api-endpoints.md) tapi belum pernah dibangun — kalau dikerjakan nanti, ini jalan yang tepat untuk itu, bukan fitur wajib sekarang.

**Yang diimplementasikan:**

| No | File | Aksi |
|---|---|---|
| 1 | [x] `database-migrations/016_seed_asumsi_dus_tradisional.sql` *(baru)* | Insert key `asumsi_dus_tradisional` = `2` ke tabel `pengaturan` |
| 2 | [x] `backend/src/controllers/analisisController.js` | `Q_trad` dihitung dari nilai `pengaturan.asumsi_dus_tradisional` × `satuan_per_dus`, bukan lagi `satuan_per_dus` saja. Obat tanpa riwayat `barang_masuk` tidak lagi dikecualikan |
| 3 | [x] `backend/src/controllers/dashboardController.js` | `getPerbandinganBiaya` — perbaikan sama, supaya angka di Dashboard konsisten dengan Analisis Komparatif |
| 4 | [x] `simo/components/pengaturan/PengaturanForm.tsx` | Field baru "Asumsi Jumlah Dus per Pemesanan (Tradisional)" di seksi Default Kalkulasi EOQ |
| 5 | [x] `simo/components/analisis/AnalisisDetailModal.tsx` | Label penjelasan rumus diperbarui, tidak lagi bilang "(isi/dus)" karena maknanya sudah berubah |

**Status:** ✅ Sudah diimplementasi.

---

## Fase 7 — Simulasi Skenario (Novelty) ✅ ACC

**Target:** Fitur simulasi berjalan penuh tanpa mengubah data aktual

**Backend:**
- [x] `src/controllers/simulasiController.js`:
  - [x] `POST /api/simulasi/jalankan` — kalkulasi skenario (tidak simpan)
  - [x] `POST /api/simulasi/simpan` — simpan hasil ke DB
  - [x] `GET /api/simulasi` — list 20 riwayat terbaru
  - [x] `DELETE /api/simulasi/:id`
- [x] `src/routes/simulasi.js` + mount di app.js `/api/simulasi`

**Frontend:**
- [x] `hooks/useSimulasi.ts` — useSimulasiList, useSimpanSimulasi, useDeleteSimulasi
- [x] `components/simulasi/SimulasiChart.tsx` — bar chart EOQ·SS·ROP
- [x] `/simulasi/page.tsx` — layout 2 kolom: kiri (pilih obat + nilai saat ini kompak + parameter) | kanan (tabel perbandingan live + interpretasi + chart)
- [x] Live update client-side — kalkulasi EOQ/SS/ROP/TC di browser (useMemo), tidak butuh API call jalankan
- [x] Chart Total Biaya dihapus (TC sudah tampil di tabel, chart TC misleading)
- [x] "Aktual" → "Sekarang" di semua label
- [x] Riwayat tersimpan dengan expand detail per skenario
- [x] Test: simulasi +20% demand → EOQ, SS, ROP naik sesuai rumus ✓

**Catatan penting untuk uji coba ke apotek:**
- Seed data historis 30 hari dari catatan kertas apotek sebelum mulai uji
  → masukkan sebagai Barang Keluar (Penjualan) dengan tanggal mundur
  → EOQ/ROP langsung akurat dari hari pertama testing

---

## Fase 8 — Laporan & Export ✅ ACC

**Target:** Semua laporan bisa ditampilkan dan diekspor ke PDF/Excel

**Backend:**
- [x] `src/controllers/laporanController.js` — 5 fungsi: getLaporanStok, getLaporanBarangMasuk (filter tanggal), getLaporanBarangKeluar (filter tanggal + keterangan), getLaporanKedaluarsa (filter hari), getLaporanEoqRop
- [x] `src/routes/laporan.js` — semua route dengan verifyToken
- [x] `src/app.js` — mount `/api/laporan`

**Frontend:**
- [x] `lib/export.ts` — exportPDF (jsPDF, landscape A4, header apotek + judul + tanggal cetak) + exportExcel (xlsx, auto column width)
- [x] `hooks/useLaporan.ts` — 5 hooks + TypeScript interfaces (LaporanStokItem, LaporanBarangMasukItem, LaporanBarangKeluarItem, LaporanKedaluarsaItem, LaporanEoqRopItem)
- [x] `/laporan/page.tsx` — satu halaman dengan 6 tab: Laporan Stok | Barang Masuk | Barang Keluar | Kedaluarsa | EOQ & ROP | Skenario Simulasi
- [x] Filter per tab: Barang Masuk/Keluar (dari–sampai tanggal), Barang Keluar (+ filter keterangan), Kedaluarsa (toggle 30/60/90/180 hari)
- [x] Setiap tab: Export PDF + Export Excel dengan data sesuai filter aktif
- [x] Test: export PDF → cek header, tabel, format angka Rupiah benar

---

## Fase 9 — Manajemen User & Pengaturan ✅ ACC

**Target:** Admin bisa kelola user dan pengaturan sistem

**Backend:**
- [x] `src/controllers/userController.js` — getUsers, createUser, updateUser, resetPassword, deleteUser (soft delete)
- [x] `src/controllers/pengaturanController.js` — getPengaturan, updatePengaturan (key-value)
- [x] `src/routes/users.js` + `src/routes/pengaturan.js` — semua route admin-only kecuali GET pengaturan
- [x] `src/app.js` — mount `/api/users` + `/api/pengaturan`

**Frontend:**
- [x] `hooks/useUsers.ts` — useUserList, useCreateUser, useUpdateUser, useResetPassword, useDeleteUser
- [x] `hooks/usePengaturan.ts` — usePengaturan, useUpdatePengaturan
- [x] `/users/page.tsx` — tabel user + summary card (total/aktif/non-aktif) + form tambah/edit modal + reset password modal + nonaktifkan user
- [x] `/pengaturan/page.tsx` — form 3 seksi: Informasi Apotek, Default Kalkulasi EOQ, Peringatan & Notifikasi
- [x] Test: tambah user staf → login sebagai staf → cek menu terbatas

---

## Fase 10 — Polish & Testing (~3 hari)

**Target:** Sistem siap untuk demo dan dokumentasi skripsi

- [ ] Responsive layout (test di HP)
- [x] Loading skeleton di semua tabel — terverifikasi di kode (Obat, Perhitungan, Supplier, Analisis, Barang Masuk/Keluar, Dashboard, Simulasi, Pengaturan)
- [x] Empty state di semua tabel — terverifikasi di kode (Obat, Perhitungan, Supplier, Analisis, Barang Masuk: "Belum ada riwayat barang masuk", Barang Keluar: "Belum ada riwayat barang keluar")
- [ ] Error handling: koneksi gagal, validasi form *(per-hook `onError` toast sudah ada di banyak hook — belum diverifikasi menyeluruh untuk kasus koneksi gagal total)*
- [ ] Seed data lengkap: 20-30 obat dengan riwayat transaksi 3 bulan
- [ ] Verifikasi semua kalkulasi EOQ/SS/ROP manual vs sistem
- [ ] Cek konsistensi angka dashboard vs tabel detail
- [ ] Screenshot semua halaman untuk lampiran skripsi

**Opsional (jika waktu cukup):**
- [x] **Ubah layout halaman Supplier menjadi card per supplier** — saat ini berbentuk tabel, ingin diubah menjadi tampilan card (satu card per supplier) agar lebih visual dan mudah dibaca

- [x] **Ringkasan/Summary card per halaman**
  - ✅ Data Obat — 4 StatCard: Total Obat, Perlu Reorder, Mendekati ROP, Akan Expired
  - ✅ Barang Masuk — 4 StatCard: Transaksi Hari Ini, Transaksi Bulan Ini, Satuan Masuk Bulan Ini, Terakhir Masuk
  - ✅ Barang Keluar — 4 StatCard: Transaksi Hari Ini, Transaksi Bulan Ini, Satuan Keluar Bulan Ini, Terakhir Keluar

  | Halaman | Ringkasan yang cocok |
  |---|---|
  | **Data Obat** | ✅ Selesai — StatCard (Total Obat, Perlu Reorder, Mendekati ROP, Akan Expired) — beda metrik dari rencana awal tapi fungsinya sama |
  | **Barang Masuk** | ✅ Selesai — StatCard (transaksi hari ini, bulan ini, satuan masuk, terakhir masuk) |
  | **Barang Keluar** | ✅ Selesai — StatCard (transaksi hari ini, bulan ini, satuan keluar, terakhir keluar) |
  | **Dashboard** | ✅ Sudah ada — 5 stat card, tidak perlu tambah |
  | **Analisis** | ✅ Sudah ada — 4 summary card (Obat Dihitung, Biaya Sebelum, Biaya Dengan EOQ, Total Penghematan) |
  | **Simulasi** | Jumlah skenario tersimpan (sudah tampil di riwayat, tidak perlu card khusus) |

- [x] **Filter di halaman Barang Masuk & Barang Keluar:** *(selesai — filter per hari)*
  - ✅ Filter tanggal **per hari** — input tanggal tunggal, Reset button, timezone-safe (`toLocalYMD`)
  - ✅ Filter keterangan (Barang Keluar) — dropdown Penjualan/Retur/Rusak/Kedaluarsa/Lainnya
  - Filter kategori obat dipindahkan ke Fase 13 (lihat bawah) — belum dikerjakan

> Item opsional yang **belum selesai** (Chart Top 5 Obat Paling Laris, Filter kategori obat, Card Rekomendasi Keputusan) dipindahkan ke **Fase 13** di bagian bawah roadmap ini, supaya bagian Opsional di sini isinya konsisten hanya yang sudah beres.

---

## Fase 11 — Fitur Tambahan Post-ACC

### Estimasi Sisa Stok per Batch (FIFO) ✅ Selesai

**Latar belakang:**
Sistem mencatat `expired_batch` di setiap transaksi Barang Masuk. Namun halaman Detail Obat belum menampilkan estimasi sisa stok per batch. Apotek menerapkan FIFO secara fisik, sehingga sistem bisa menghitung estimasi sisa per batch dengan asumsi stok tertua keluar lebih dulu.

**Yang sudah diimplementasi (terverifikasi di kode):**

| No | File | Aksi |
|---|---|---|
| 1 | [x] `backend/src/controllers/obatController.js` | Fungsi `getBatchSummary` — FIFO kalkulasi dari barang_masuk & barang_keluar |
| 2 | [x] `backend/src/routes/obat.js` | Route `GET /api/obat/:id/batch-summary` |
| 3 | [x] `simo/hooks/useObat.ts` | Hook `useObatBatchSummary(id)` |
| 4 | [x] `simo/components/obat/ObatBatchSummary.tsx` | Komponen tabel estimasi sisa per batch + badge warna sisa hari |
| 5 | [x] `simo/app/(dashboard)/obat/[id]/detail/page.tsx` | Terintegrasi (`<ObatBatchSummary id={id} />`) |

**Tampilan di Detail Obat:**
```
Estimasi Sisa per Batch (FIFO)
┌─────────────┬──────────────┬────────────────────┐
│ Expired     │ Est. Sisa    │ Sisa Hari          │
├─────────────┼──────────────┼────────────────────┤
│ 26/07/2026  │ 90 sachet    │ 🔴 55 hari lagi    │
│ 26/08/2026  │ 20 sachet    │ 🟡 86 hari lagi    │
└─────────────┴──────────────┴────────────────────┘
⚠️ Estimasi berdasarkan asumsi FIFO
```

**Keterbatasan (dokumentasikan di skripsi):**
Estimasi akurat hanya jika apotek konsisten menerapkan FIFO secara fisik. Sistem tidak bisa memverifikasi batch mana yang benar-benar diambil saat barang keluar.

**Status:** ✅ Sudah diimplementasi dan terintegrasi di halaman Detail Obat

---

## Fase 12 — Rencana: Kode Obat sebagai SKU (Belum diimplementasi)

**Latar belakang diskusi:**
Sempat dibahas apakah SIMO perlu field SKU terpisah. Setelah riset (foto dokumen asli Apotek Rezky Medika di `docs/data-apotek/` + studi kasus publik Apotek K-24 Bojonggede & konvensi software apotek Indonesia), kesimpulannya:

- Dokumen fisik apotek (kartu stok, buku barang masuk/keluar, surat pesanan) **sama sekali tidak memakai kode/SKU** — hanya **Nama Obat** (termasuk dosis, misal "Amoxicillin 500mg") dan **No. Batch** dari pabrik untuk pelacakan kadaluarsa (FEFO/FIFO).
- Kolom `kode` yang sudah ada di tabel `obat` (`OBT-001`, dst., auto-generate di `obatController.js`) **secara fungsi sudah memenuhi definisi SKU** (kode unik dibuat sendiri oleh sistem untuk identifikasi stok). Tidak perlu tambah kolom/field baru.
- Konvensi software apotek Indonesia yang ditemukan (riset web) memakai format **prefix kategori + nomor urut** (contoh: `OB001` = Obat Bebas, `OK005` = Obat Keras, `SK007` = Suplemen), bukan mnemonic dari nama produk (mnemonic dari nama rapuh untuk varian non-numerik seperti rasa/bentuk kemasan — misal "OBH Combi Saset" vs "OBH Combi Botol Rasa Mint" vs "Rasa Jeruk" tidak bisa diparse otomatis jadi kode singkat tanpa kamus kata kunci yang harus terus dirawat).

**Rencana perbaikan (opsional, belum dikerjakan):**
Ubah logika auto-generate `kode` di `backend/src/controllers/obatController.js` (fungsi `create`, baris ±114-122) dari prefix generik `OBT-` menjadi **prefix berbasis `kategori`** (field yang sudah ada, dropdown terbatas di `lib/constants.ts` → `KATEGORI_OBAT`), dengan nomor urut per kategori. Contoh:

| Kategori | Prefix kode |
|---|---|
| Analgesik | `ANL-001`, `ANL-002`, ... |
| Antibiotik | `ANT-001`, `ANT-002`, ... |
| Vitamin | `VIT-001`, `VIT-002`, ... |
| Antasida, Antihistamin, Suplemen, Antidiabetik, Antihipertensi, Antijamur, Lainnya | pola sama |

**Yang perlu diubah kalau dikerjakan:**

| No | File | Aksi |
|---|---|---|
| 1 | `backend/src/controllers/obatController.js` | Ubah query auto-generate kode: filter `WHERE kode LIKE '{prefix}-%'` per kategori, bukan global |
| 2 | Tidak perlu migration DB baru | Kolom `kode` sudah ada dan formatnya bebas (VARCHAR) |

**Pembeda varian (dosis/rasa/bentuk) tetap tanggung jawab field `nama`**, bukan `kode` — staf wajib menulis nama lengkap & spesifik saat input obat baru (misal "Amoxicillin 500mg", bukan cuma "Amoxicillin").

**Status:** ⬜ Belum diimplementasi — masih tahap diskusi/keputusan desain

---

## Fase 13 — Item Opsional Fase 10 yang Belum Dikerjakan

Dipindahkan dari bagian "Opsional" Fase 10 supaya tidak tercampur dengan item yang sudah selesai. Semua item di sini murni opsional, bukan syarat ACC Fase 10.

### Chart "Top 5 Obat Paling Laris" ⬜ Belum
- Ditampilkan di bagian bawah halaman Barang Keluar
- Bar chart horizontal, toggle periode: 1 Minggu / 2 Minggu / 1 Bulan
- Backend: `GET /api/barang-keluar/top-laris?periode=14` → GROUP BY obat_id, SUM jumlah WHERE keterangan='Penjualan'
- Berguna untuk user yang pesan barang tiap 2 minggu agar tahu obat prioritas

### Filter Kategori Obat di Barang Masuk & Barang Keluar ⬜ Belum
- Backend sudah support filter kategori (dipakai di endpoint lain), tinggal disambungkan ke frontend `BarangMasukTable.tsx` / `BarangKeluarTable.tsx`
- Dropdown kategori pakai konstanta `KATEGORI_OBAT` yang sudah ada di `lib/constants.ts`

### Card "Rekomendasi Keputusan" di Dashboard ⬜ Belum
- Tujuan: bantu decision making berbasis EOQ/ROP, bukan sekadar monitoring stok
- Tampil di row baru dashboard, full-width atau grid 2–3 kolom
- **Backend perlu diubah:** query `obat_mendesak` di `dashboardController.js` harus:
  1. Tambah kolom `demand_harian` ke SELECT (saat ini belum ada — terverifikasi tidak ada di kode)
  2. Ubah kondisi dari hanya `stok <= rop` menjadi juga include `MENDEKATI_ROP` (stok ≤ ROP × 1.5)
- **Frontend:** komponen baru `RekomendCard.tsx` atau kolom tambahan di `ReorderTable.tsx`
- Format rekomendasi per baris:
  - `HARUS_REORDER` (stok ≤ ROP) → 🔴 **"Pesan sekarang: X unit (1 EOQ)"**
  - `MENDEKATI_ROP` (stok ≤ ROP × 1.5) → 🟡 **"Perkiraan habis dalam ~X hari"** (dihitung dari sisa stok ÷ demand_harian)
- Prioritas: urutkan dari yang paling kritis (stok paling rendah relatif terhadap ROP)

---

## Fase 14 — Input Barang Keluar Multi-Item (Keranjang) ✅ Selesai

**Latar belakang:**
`BarangKeluarForm.tsx` saat ini cuma menerima **1 obat per submit** (1 dropdown Obat + 1 input Jumlah). Kalau ada pembeli ambil 2-3 obat berbeda sekaligus (kasus sangat umum di apotek), staf harus buka-isi-submit-tutup form itu berkali-kali untuk transaksi yang sebenarnya satu kali kejadian. Ini murni masalah UX — secara data, tabel `barang_keluar` memang benar 1 baris per obat (tidak perlu diubah), yang perlu diubah cuma **cara submit-nya** jadi bisa banyak obat sekaligus dalam satu form.

**Kenapa dikerjakan sebelum Fase 17 (Import Excel), bukan sesudahnya:**
Fitur ini butuh fungsi backend **`createBulk(items[])`** — terima array item, proses semua dalam 1 database transaction, skip baris yang gagal tanpa menggagalkan yang lain. Fungsi transaction-safety yang sama persis dibutuhkan Fase 17 untuk commit hasil import Excel. Membangun & mengujinya dulu di sini — kasus yang jauh lebih sederhana karena semua data berasal dari dropdown internal, bukan file eksternal yang rawan format aneh — membuat pondasinya sudah teruji sebelum dipakai lagi di Fase 17 yang risikonya lebih tinggi. Perbandingan cakupan kerja:

| | Fase 14 (ini) | Fase 17 (Import Excel) |
|---|---|---|
| Dependency baru | Tidak ada — `react-hook-form` sudah terpasang | `exceljs` |
| Tabel/migration baru | Tidak ada | `import_log` (dedup) |
| Parsing file eksternal | Tidak ada | Ya — rawan format tanggal/nama beda-beda |
| Fuzzy/exact matching nama obat | Tidak perlu — obat dipilih dari combobox yang sudah tervalidasi | Perlu — data dari luar sistem |
| Preview wajib sebelum commit | Opsional (data sudah pasti valid dari dropdown) | Wajib |
| Jumlah file disentuh | ~4 file | ~11 file |

**Desain UI (form jadi model "keranjang"):**

```
┌─────────────────────────────────────────┐
│ Tanggal: [09/07/2026]  Keterangan: [Penjualan ▾]│
├─────────────────────────────────────────┤
│ Obat 1: [Paracetamol 500mg ▾]  Qty: [10]  [🗑]│
│ Obat 2: [Amoxicillin 500mg ▾]  Qty: [5]   [🗑]│
│ Obat 3: [Vitamin C ▾]          Qty: [3]   [🗑]│
├─────────────────────────────────────────┤
│              [+ Tambah Obat]              │
│                    [Batal]  [Simpan Semua]│
└─────────────────────────────────────────┘
```

- **Tanggal & Keterangan** diisi sekali, berlaku untuk semua baris
- **"+ Tambah Obat"** → tambah baris baru (Obat + Jumlah) pakai `useFieldArray` dari `react-hook-form` (fitur bawaan, tidak perlu library baru)
- **🗑 per baris** → hapus baris kalau salah pilih
- **"Simpan Semua"** → kirim 1 request berisi array `[{obat_id, jumlah}, ...]` + `tanggal` & `keterangan` yang sama untuk semua baris

**Mekanisme keamanan yang tetap berlaku (versi lebih sederhana dari Fase 17):**

| No | Mekanisme | Alasan |
|---|---|---|
| 1 | Bungkus proses commit dengan database transaction (`BEGIN`...`COMMIT`/`ROLLBACK`) | Kalau item ke-2 dari 3 item gagal (misal stok kurang), semua harus rollback, bukan 1 item kepatri sementara sisanya batal |
| 2 | Row-level lock (`SELECT ... FOR UPDATE`) saat baca stok tiap item di dalam transaction | Cegah race condition kalau ada staf lain input manual di obat yang sama bersamaan |
| 3 | Cek stok mencukupi tiap baris sebelum commit, reuse logic dari [barangKeluarController.js:87-92](../backend/src/controllers/barangKeluarController.js) | Sama seperti form single-item sekarang — jangan izinkan stok jadi minus |
| 4 | Response jelas per baris (berhasil/gagal & alasan) | User tahu persis baris mana yang gagal kalau ada, tanpa harus tebak-tebak |

**Yang sudah diimplementasi:**

| No | File | Aksi |
|---|---|---|
| 1 | [x] `backend/src/controllers/barangKeluarController.js` | Fungsi `createBulk(req, res)` — array item diproses dalam 1 DB transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) dengan `SELECT ... FOR UPDATE` per obat, reuse logic cek stok & `hitungUlangObat`/`updateExpiredTerdekat`/demand recalculation per item setelah commit |
| 2 | [x] `backend/src/routes/barangKeluar.js` | `POST /api/barang-keluar/bulk` |
| 3 | [x] `simo/types/obat.ts` | `BarangKeluarBulkFormData`, `BarangKeluarBulkItemResult`, `BarangKeluarBulkResponse` |
| 4 | [x] `simo/hooks/useBarangKeluar.ts` | `useCreateBarangKeluarBulk()` — invalidate query obat/barang-keluar/reorder-alerts, toast per reorder alert |
| 5 | [x] `simo/components/transaksi/BarangKeluarForm.tsx` | Ditulis ulang total — Tanggal+Keterangan di luar, Obat+Jumlah jadi `useFieldArray` (tambah/hapus baris dinamis), tiap baris pakai `Controller` per index untuk `ObatCombobox` |
| 6 | [x] `simo/components/transaksi/BarangKeluarTable.tsx` & `simo/app/(dashboard)/dashboard/page.tsx` | Dialog diperlebar (`max-w-lg` → `max-w-xl`) + scroll, supaya muat beberapa baris item |

**Verifikasi:** Diuji langsung ke database (bukan cuma cek sintaks) — skenario sukses (2 item, stok berkurang benar) dan skenario rollback (item ke-2 stok tidak cukup → **kedua** item batal tersimpan, bukan cuma yang gagal) sudah dikonfirmasi jalan sesuai desain. Data uji coba sudah dibersihkan dari database, tidak ada sisa.

**Status:** ✅ Sudah diimplementasi dan diverifikasi ke database sungguhan.

---

## Fase 15 — Input Barang Masuk Multi-Item (Keranjang) + PPN Opsional ✅ Selesai (Diskon ditunda)

**Latar belakang:**
Sama seperti Barang Keluar sebelum Fase 14, `BarangMasukForm.tsx` sekarang cuma menerima 1 obat per submit. Padahal dalam kenyataan, 1 kali pesanan ke PBF hampir selalu berisi beberapa obat sekaligus (lihat contoh faktur di `docs/data-apotek/`). Sekalian dibenahi: faktur asli juga mencantumkan **Diskon** (per baris obat) dan **PPN** (per faktur), yang belum ada di sistem sama sekali.

**Field mana shared (1x isi per faktur), mana per-item:**

| Level | Field | Catatan |
|---|---|---|
| **Faktur** (diisi sekali, berlaku semua item) | Supplier, No. Faktur, Tanggal, **PPN %** | PPN opsional, default 0 — banyak PBF kecil non-PKP tidak kena PPN |
| **Per Obat** (baris berulang) | Obat, No. Batch, Expired Batch, Qty (Dus), Harga Beli/Dus, Harga Jual, % Biaya Simpan | — |

**⚠️ BELUM DIPUTUSKAN — Diskon % masuk level Faktur (shared) atau Per Obat?**
Sempat diusulkan pindah ke level Faktur (shared, sejajar PPN) karena di data historis apotek (`Data Apotik.xlsx`, sheet Pencatatan Obat Masuk) kolom "Disc" kosong di semua baris sample — mengindikasikan mungkin dinegosiasikan per-faktur, bukan per-obat. Tapi ini **belum final**, perlu dipastikan dulu ke pihak apotek: apakah diskon dari PBF itu memang selalu flat untuk 1 faktur, atau bisa beda per obat (kadang PBF kasih diskon promo cuma untuk produk tertentu dalam 1 faktur yang sama). Placeholder dulu di kedua kemungkinan sampai dikonfirmasi — jangan mulai coding bagian Diskon sebelum ini diputuskan.

**Kenapa PPN ditaruh di level faktur padahal dihitung per item (ini sudah pasti, tidak berubah):**
Tarif PPN itu flat (mis. 11%) untuk semua barang dalam 1 faktur — jadi cukup diisi sekali, tapi diterapkan ke tiap item saat hitung harga riil. Hasilnya matematis sama dengan dihitung dari total invoice di faktur asli (`Sub Total → PPN → Total Invoice`), tanpa perlu logic proporsional yang rumit.

**Verifikasi: Harga Jual TIDAK dipakai di EOQ/ROP sama sekali, % Biaya Simpan YA (tapi cuma untuk EOQ, bukan ROP):**
Dicek langsung ke [docs/06-business-logic.md](06-business-logic.md) (dokumen rujukan resmi rumus) baris 8-17 — tabel Parameter Input cuma sebut `D, S, H, LT, Z, σ`, tidak ada `harga_jual`. Diperkuat grep ke `eoqService.js`/`stokService.js`/`demandService.js` — kata "harga_jual" nol kemunculan di file kalkulasi mana pun. `harga_jual` cuma disimpan & ditampilkan (margin, riwayat), tidak pernah masuk rumus. Yang masuk rumus adalah `H` (`biaya_simpan`), dan itu berasal dari **Harga Beli** × %BiayaSimpan — bukan dari Harga Jual. `H` dipakai di EOQ & TC, tapi **tidak** dipakai di ROP (`ROP = d×LT + SS`, tidak ada H). Karena itu di UI, % Biaya Simpan digabung satu grup dengan Qty & Harga Beli (bukan disembunyikan sebagai opsional), sedangkan Harga Jual tetap terpisah sebagai field margin murni.

**Formula harga beli riil per item (yang disimpan sebagai `harga_beli` di `barang_masuk`) — Diskon di sini masih placeholder sampai keputusan di atas final:**
```
Harga Beli/Dus (dari faktur)
   → dikurangi Diskon %      → Harga setelah diskon   (posisi field ini masih belum pasti — lihat catatan di atas)
   → ditambah PPN %          → Harga Beli Riil per Dus
   → dibagi Isi per Dus      → harga_beli per satuan
```
Contoh: Harga Beli 100.000/dus, Diskon 5%, PPN 11% → `100.000 × 0.95 × 1.11 = 105.450` per dus riil.

**Harga Beli & Harga Jual tetap opsional (sudah begitu sejak awal, bukan hal baru) — dengan penyempurnaan "backfill":**

Perilaku sekarang ([barangMasukController.js:126-133](../backend/src/controllers/barangMasukController.js#L126-L133)): kalau field harga dikosongkan, `obat.harga_beli`/`harga_jual` (harga master) tidak diubah — tapi baris transaksi `barang_masuk` itu sendiri tersimpan **NULL**, jadi riwayat batch itu kelihatan kosong padahal sebenarnya harganya tidak berubah dari sebelumnya.

**Perbaikan yang disepakati (final, sudah didiskusikan termasuk edge case obat baru):**
```
Field harga dikosongkan → ambil obat.harga_beli / obat.harga_jual saat ini APA ADANYA
                           (termasuk kalau masih 0 karena obat baru belum pernah ada
                           Barang Masuk sebelumnya — TIDAK perlu pengecualian/warning
                           khusus, 0 di situ memang mencerminkan "belum pernah diisi",
                           bukan data yang salah) → simpan ke baris transaksi
Field harga diisi        → simpan nilai yang diisi → update juga obat.harga_beli/harga_jual
                           (perilaku yang sudah ada, tidak berubah)
```
Sempat dipertimbangkan solusi lebih rumit (bedakan kondisi 0-karena-belum-pernah-diisi vs 0-asli, tambah warning UI) — **dibatalkan** karena tidak perlu; versi seragam di atas sudah benar tanpa pengecualian.

**Perubahan skema database:**
Migration baru — tambah `diskon_pct DECIMAL(5,2) DEFAULT 0` dan `ppn_pct DECIMAL(5,2) DEFAULT 0` ke `barang_masuk`. Disimpan mentah (bukan cuma hasil akhir blended) supaya bisa ditelusuri/dicetak ulang di laporan nanti.

**Desain UI (pola sama seperti keranjang Barang Keluar di Fase 14) — posisi Diskon% masih menunggu keputusan, digambar di kolom PPN untuk sementara:**
```
┌─ Bagian atas (shared, 1x isi) ──────────────────────┐
│ Supplier *              No. Faktur *                 │
│ [PT. Jivaka Medika ▾]   [JLS218030984________]        │
│                                                          │
│ Tanggal *      Diskon % (?)          PPN % (opsional)  │
│ [09/07/2026]   [posisi belum pasti]  [11___] %         │
└──────────────────────────────────────────────────────┘

┌─ Obat 1 (kartu, bisa diulang) ─────────────────[🗑]───┐
│ [🔍 Counterpain CR 5gr ▾__________________________]   │
│ No. Batch *              Expired Batch *               │
│ [7620941_______]         [30/07/2026____]              │
│ Qty Dus *         Harga Beli/Dus       % Biaya Simpan   │
│ [5______]         [Rp 9.648___]        [20___] % ← H   │
│ ─────────────────────────────────────────────────────  │
│ Harga Jual/satuan (opsional, hanya untuk margin — TIDAK │
│ dipakai di EOQ/ROP, terverifikasi)                      │
│ [Rp __________]                                          │
└────────────────────────────────────────────────────────┘

              [+ Tambah Obat]
              [Batal]  [Simpan Semua]
```

**Pelajaran dari bug Fase 14 yang harus dihindari di sini juga:**
Dropdown `ObatCombobox` di tiap baris **jangan** dibungkus container `overflow-y-auto` sendiri — itu yang bikin dropdown di keranjang Barang Keluar kepotong (sudah diperbaiki di Fase 14, terapkan pola yang sudah benar sejak awal di sini).

**Diskon % sengaja TIDAK dikerjakan di fase ini** — sesuai keputusan: ditunda dulu, dicatat sebagai item terpisah yang belum dikerjakan (lihat penutup di bawah), bukan ditebak posisinya. Skema `barang_masuk` juga sengaja belum ditambah kolom `diskon_pct`.

**Yang sudah diimplementasi:**

| No | File | Aksi |
|---|---|---|
| 1 | [x] `database-migrations/015_add_ppn_barang_masuk.sql` *(baru)* | Tambah `ppn_pct DECIMAL(5,2) DEFAULT 0` ke `barang_masuk` (tanpa `diskon_pct`, ditunda). Sekalian menjalankan `014_supplier_biaya_pesan.sql` yang ternyata masih pending dari sebelumnya |
| 2 | [x] `backend/src/controllers/barangMasukController.js` | Fungsi `createBulk(req, res)` — DB transaction + `SELECT ... FOR UPDATE` per item, hitung harga riil = Harga Beli/Dus × (1 + PPN%) ÷ Isi per Dus, backfill harga_beli/harga_jual dari `obat` kalau dikosongkan (apa adanya termasuk 0), update `biaya_simpan` (H) dari harga_beli × %BiayaSimpan |
| 3 | [x] `backend/src/routes/barangMasuk.js` | `POST /api/barang-masuk/bulk` |
| 4 | [x] `simo/types/obat.ts` | `BarangMasukBulkFormData`, `BarangMasukBulkItemResult`, `BarangMasukBulkResponse` (tanpa field diskon) |
| 5 | [x] `simo/hooks/useBarangMasuk.ts` | `useCreateBarangMasukBulk()` |
| 6 | [x] `simo/components/transaksi/BarangMasukForm.tsx` | Ditulis ulang jadi keranjang — Supplier/No.Faktur/Tanggal/PPN% shared di atas, tiap kartu obat: Obat → No.Batch+Expired → Qty Dus+Harga Beli/Dus+%BiayaSimpan (H, digabung karena sama-sama masuk EOQ) → Harga Jual terpisah (murni margin, tidak masuk EOQ/ROP, terverifikasi) + live preview harga riil & margin. Tanpa nested `overflow-y-auto` |
| 7 | [x] `simo/components/transaksi/BarangMasukTable.tsx` & `simo/app/(dashboard)/dashboard/page.tsx` | Dialog diperlebar/dipastikan scroll (`max-w-2xl`/`max-w-lg→max-w-2xl` + `max-h-[90vh] overflow-y-auto`) |

**Verifikasi:** Diuji langsung ke database sungguhan (bukan cuma cek sintaks) — skenario sukses (2 item, 1 item harga diisi + PPN 10% terhitung benar jadi 660/satuan, 1 item harga dikosongkan → backfill persis 1190 apa adanya tanpa kena PPN, biaya_simpan & stok terupdate benar) dan skenario rollback (item ke-2 obat_id tidak ada → **kedua** item batal, termasuk item pertama yang sebenarnya valid) sudah dikonfirmasi jalan sesuai desain. Data uji coba (termasuk harga_beli/biaya_simpan/supplier_id yang sempat ikut berubah) sudah dipulihkan ke nilai semula, tidak ada sisa di database.

**Prasyarat untuk Fase 17 (Import Excel):** `createBulk` yang dibangun di sini jadi dasar `confirmImportObatMasuk(rows)` — sama seperti `createBulk` Barang Keluar dari Fase 14 jadi dasar `confirmImportPenjualan(rows)`.

**Status:** ✅ Sudah diimplementasi dan diverifikasi ke database sungguhan. **Diskon % masih belum dikerjakan** — dicatat sebagai pekerjaan tersisa, bukan bagian dari Fase 15 ini.

---

## Fase 16 — Edit & Hapus Barang Masuk/Barang Keluar (Admin Only) ✅ Selesai

**Latar belakang:**
Sejak awal, `barang_masuk` dan `barang_keluar` cuma bisa dicatat — tidak ada cara mengoreksi salah input lewat aplikasi (beda dengan `obat`/`supplier` yang sudah punya PUT/DELETE sejak awal, terverifikasi lewat cek routes). Kalau staf salah input, satu-satunya jalan sebelumnya adalah edit langsung ke database.

**Kenapa ini tidak sesederhana CRUD biasa:**
`barang_masuk`/`barang_keluar` bukan data master — tiap baris sudah mengubah `obat.stok` saat dicatat. Edit/hapus sembarangan bisa bikin stok tidak sinkron, terutama kalau di antara waktu transaksi itu dicatat dan sekarang, sudah ada transaksi lain yang bergantung pada stok tersebut (misal: barang masuk 100 unit, lalu 80 di antaranya sudah terjual — menghapus barang masuk itu tanpa pengaman akan bikin stok minus).

**Keputusan desain (hasil diskusi):**

| Keputusan | Nilai |
|---|---|
| Siapa boleh edit/hapus | **Admin only** (`requireRole('admin')`, reuse middleware yang sudah ada dari `users.js`) |
| Kapan boleh | Bebas kapan saja, tidak ada batas waktu |
| Pengaman | Ditolak (400) kalau hasil reverse-stok jadi **minus** — indikasi sebagian stok dari transaksi itu sudah terpakai/terjual |
| Obat bisa diganti saat edit? | **Tidak** — obat_id readonly saat edit. Kalau obatnya salah, hapus baris dan catat ulang, bukan pindah stok antar obat di tengah edit (menghindari kompleksitas locking 2 baris obat sekaligus) |
| UI | Kolom Aksi (Pencil edit + Trash2 hapus) di tabel riwayat yang sudah ada — modal, bukan halaman terpisah, konsisten dengan alur "Catat Barang Masuk/Keluar" yang sudah modal |
| Form edit | **Komponen baru terpisah** dari form keranjang create — form keranjang itu untuk transaksi BARU multi-item, sedangkan tiap baris riwayat adalah 1 transaksi tunggal (walau dibuat dari keranjang isi 5 obat, tetap jadi 5 baris terpisah begitu tersimpan) |

**Cara kerja edit (bukan 2 langkah terpisah, tapi 1 transaksi atomik):**
```
1. Kunci baris transaksi lama (SELECT ... FOR UPDATE)
2. Kunci baris obat terkait (SELECT ... FOR UPDATE)
3. Tarik balik efek lama ke stok (reverse)
4. Terapkan efek nilai baru ke stok (apply)
5. Kalau hasil akhir < 0 → ROLLBACK, tolak dengan pesan jelas
6. Kalau aman → COMMIT, lalu hitung ulang EOQ/ROP/demand di luar transaksi
```
Arah reverse beda antara Barang Masuk (hapus/edit = stok berkurang, bisa ditolak) dan Barang Keluar (hapus/edit = stok bertambah lagi, tidak akan pernah minus — makanya `remove()` Barang Keluar tidak perlu pengecekan negatif).

**Yang sudah diimplementasi:**

| No | File | Aksi |
|---|---|---|
| 1 | [x] `backend/src/controllers/barangMasukController.js` | `update(req, res)` & `remove(req, res)` — transaction + row lock + reverse-lalu-apply + pengaman stok minus |
| 2 | [x] `backend/src/controllers/barangKeluarController.js` | `update(req, res)` & `remove(req, res)` — pola sama, arah reverse kebalikan |
| 3 | [x] `backend/src/routes/barangMasuk.js` | `PUT /:id` & `DELETE /:id`, dibungkus `requireRole('admin')` |
| 4 | [x] `backend/src/routes/barangKeluar.js` | `PUT /:id` & `DELETE /:id`, dibungkus `requireRole('admin')` |
| 5 | [x] `simo/types/obat.ts` | `BarangMasukUpdateFormData`, `BarangKeluarUpdateFormData` |
| 6 | [x] `simo/hooks/useBarangMasuk.ts` | `useUpdateBarangMasuk(id)`, `useDeleteBarangMasuk()` |
| 7 | [x] `simo/hooks/useBarangKeluar.ts` | `useUpdateBarangKeluar(id)`, `useDeleteBarangKeluar()` |
| 8 | [x] `simo/components/transaksi/BarangMasukEditForm.tsx` *(baru)* | Form 1-item, pre-filled dari baris yang diklik, obat ditampilkan readonly |
| 9 | [x] `simo/components/transaksi/BarangKeluarEditForm.tsx` *(baru)* | Sama, versi sederhana (Tanggal/Jumlah/Keterangan/Catatan) |
| 10 | [x] `simo/components/transaksi/BarangMasukTable.tsx` | Tombol Pencil+Trash2 ditambahkan ke kolom Aksi yang sudah ada (sebelumnya cuma Eye), admin-only via `useAuthStore((s) => s.isAdmin())` |
| 11 | [x] `simo/components/transaksi/BarangKeluarTable.tsx` | Kolom Aksi baru (sebelumnya tidak ada sama sekali) berisi Pencil+Trash2, admin-only |

**Verifikasi:** Diuji langsung ke database sungguhan dengan baris test yang dibuat sendiri (bukan data user asli) — alur lengkap: buat barang masuk (+100 stok) → buat barang keluar (−5 stok) → edit barang masuk jumlah dus 1→2 (stok naik 100 lagi, sesuai reverse+apply) → edit barang keluar jumlah 5→3 (stok naik 2 lagi) → hapus keduanya. Stok akhir balik tepat ke nilai semula sebelum test dimulai (1200), tanpa perlu cleanup manual karena `remove()` sendiri sudah menangani pemulihan stok dengan benar. Harga/biaya_simpan/supplier obat juga dicek tidak ikut berubah tak terduga.

**Status:** ✅ Sudah diimplementasi dan diverifikasi ke database sungguhan.

---

## Fase 17 — Import Excel untuk Penjualan Harian & Obat Masuk ⬜ Belum

**Latar belakang:**
Apotek terbiasa mencatat transaksi harian di buku/Excel dulu (lihat `docs/data-apotek/`), baru direkap ke sistem saat tutup toko. Sempat dibahas dua pendekatan: (a) parser bebas yang membaca format Excel apotek apa adanya (fleksibel tapi rawan salah baca — nama obat/satuan ditulis bebas, format tanggal tidak konsisten), vs (b) template baku dari SIMO dengan dropdown terkontrol (lebih aman diparse, tapi user harus pakai format baru). **Keputusan akhir: opsi (b)** — bikin 1 template resmi, didownload sekali, dipakai berulang.

**Prasyarat:** Reuse fungsi `createBulk` yang dibangun di Fase 14 (Barang Keluar) & Fase 15 (Barang Masuk) sebagai dasar `confirmImportPenjualan(rows)` / `confirmImportObatMasuk(rows)` di bawah — jangan bangun mekanisme transaction-safety dari nol lagi di sini.

**Prinsip desain yang disepakati:**

1. **Bukan wajib** — form input manual (Barang Masuk/Keluar, sudah ada sejak Fase 4) tetap jalur utama. Import Excel adalah **jalur tambahan opsional**, khusus untuk momen tutup toko/rekap harian.
2. **Template didownload sekali, dipakai berulang** — bukan download-isi-upload-buang tiap hari. User simpan filenya, isi baris baru tiap hari, upload saat tutup toko.
3. **Nama Obat & Supplier wajib pilih dari dropdown**, bukan ketik bebas — dropdown diambil **live dari database** SIMO saat template digenerate, supaya tidak ada masalah nama tidak cocok/typo seperti yang ditemukan di data historis apotek (17 variasi satuan berbeda, nama obat ditulis tidak konsisten).
   - Konsekuensi: kalau ada obat baru ditambahkan ke SIMO **setelah** template didownload, obat itu belum muncul di dropdown sampai template digenerate ulang. Ini didokumentasikan di sheet "Petunjuk" pada template.
4. **Wajib ada tahap Preview sebelum commit ke database** — upload tidak langsung menulis data. Sistem tampilkan dulu hasil parsing per baris (valid / tidak valid / duplikat), user cek dan konfirmasi, baru data benar-benar masuk.
5. **Dedup berdasarkan fingerprint per baris, bukan cuma tanggal** — karena file yang sama dipakai berulang dan datanya menumpuk dari hari-hari sebelumnya, sistem harus tahu baris spesifik mana yang sudah pernah diimpor. Fingerprint = hash dari (tanggal + nama_obat + qty + baris asal), disimpan di tabel log `import_log`. Dedup by-tanggal-saja tidak cukup presisi (lihat detail di bagian "Mekanisme Pencegah Kesalahan" di bawah).
6. **Reuse logic yang sudah ada** — proses commit import harus manggil fungsi yang sama dengan form manual (`hitungUlangObat`, update stok, dsb di `obatController.js`/`barangMasukController.js`/`barangKeluarController.js`), supaya tidak ada logic bisnis bercabang dua jalur berbeda yang bisa saling tidak sinkron.

**Struktur file template (`Template-Import-SIMO.xlsx`):**

| Sheet | Kolom |
|---|---|
| **Penjualan Harian** | Tanggal · Nama Obat (dropdown) · Qty · Keterangan (dropdown: Penjualan/Retur/Rusak/Kedaluarsa/Lainnya, default "Penjualan") |
| **Pencatatan Obat Masuk** | Tanggal · Nama Obat (dropdown) · Supplier (dropdown) · No Faktur · No Batch · Tanggal Expired · Qty (Dus) · Harga Beli/Dus |
| **Petunjuk** | Cara pakai dalam bahasa biasa: download sekali, isi berulang, upload tiap tutup toko, batasan dropdown obat baru |
| **_ReferensiObat** *(hidden)* | Sumber data dropdown (daftar nama obat, satuan, nama supplier) — disembunyikan dari user |

**Mekanisme Pencegah Kesalahan (wajib ada, bukan opsional polish):**

Dicek dulu ke kode yang sudah ada ([barangKeluarController.js:69-141](../backend/src/controllers/barangKeluarController.js)) — pola form manual saat ini **tidak pakai database transaction**, cuma rangkaian query terpisah (baca stok → cek cukup → insert baris → update stok). Untuk 1 transaksi manual risikonya kecil, tapi untuk import ratusan baris sekaligus pola ini berbahaya kalau ditiru mentah-mentah. Delapan mekanisme berikut wajib ada di `importController.js`, bukan sekadar nice-to-have:

| No | Mekanisme | Alasan |
|---|---|---|
| 1 | **Re-validasi nama obat di server**, bukan percaya dropdown Excel | Dropdown Excel bisa dilewati (copy-paste teks langsung ke sel) — server harus tetap cocokkan persis (exact match, case-insensitive) nama obat dari file ke `nama` di tabel `obat` |
| 2 | **Bungkus proses commit dengan database transaction** (`BEGIN`...`COMMIT`/`ROLLBACK`) | Kalau baris ke-30 dari 50 baris gagal di tengah proses, semua harus rollback — bukan 29 baris kepatri sementara sisanya hilang. Ini beda dari pola form manual sekarang yang query-nya lepas-lepas |
| 3 | **Row-level lock** (`SELECT ... FOR UPDATE`) saat baca stok di dalam transaction | Cegah race condition kalau import jalan bersamaan dengan staf lain input manual di obat yang sama (lost update problem) |
| 4 | **Dedup pakai fingerprint per baris** (hash dari tanggal+nama_obat+qty+baris asal), disimpan di tabel `import_log` | Dedup by-tanggal-saja bisa salah skip baris baru yang valid kalau ada revisi file di hari yang sama |
| 5 | **Baris invalid dikeluarkan dari batch commit**, tidak menggagalkan baris lain | Dari 50 baris, kalau 3 invalid → commit cuma proses 47 yang valid, 3 sisanya ditampilkan sebagai perlu ditinjau |
| 6 | **Cek stok mencukupi tetap berlaku**, reuse logic dari [barangKeluarController.js:87-92](../backend/src/controllers/barangKeluarController.js) | Qty penjualan yang diimpor melebihi stok saat ini → ditandai warning di preview, bukan otomatis bikin stok minus diam-diam |
| 7 | **Validasi struktur file sebelum parsing baris** — cek nama sheet & header kolom persis cocok template | File lama/beda struktur ditolak total di awal dengan pesan jelas, bukan coba parse ngawur |
| 8 | **Audit log** — siapa (`user_id`), kapan, nama file, berapa baris berhasil/dilewati/gagal | Bisa ditelusuri kalau nanti ada laporan data aneh |

**Yang perlu diimplementasi:**

| No | File | Aksi |
|---|---|---|
| 1 | `database-migrations/015_create_import_log.sql` *(baru)* | Tabel `import_log`: `id, fingerprint (unique), tipe (penjualan/obat_masuk), sumber_row, user_id, created_at` — dasar mekanisme dedup #4 |
| 2 | `backend/scripts/generate-template-import.js` | Script generator template `.xlsx` pakai `exceljs` — tarik daftar obat & supplier live dari DB, isi dropdown data validation |
| 3 | `backend/package.json` | Tambah dependency `exceljs` (dipakai karena `xlsx`/SheetJS versi gratis tidak bisa menulis dropdown/data-validation) |
| 4 | `backend/src/controllers/importController.js` *(baru)* | `parsePenjualan(file)` & `parseObatMasuk(file)` — validasi struktur file (mekanisme #7), baca isi, re-validasi nama obat ke DB (#1), cek fingerprint ke `import_log` (#4), return hasil per baris (status: valid/invalid/duplikat) tanpa commit |
| 5 | `backend/src/controllers/importController.js` | `confirmImportPenjualan(rows)` & `confirmImportObatMasuk(rows)` — commit baris valid dalam 1 DB transaction (#2) dengan row lock saat baca stok (#3), skip baris invalid (#5), cek stok cukup (#6), tulis ke `import_log` (#8) |
| 6 | `backend/src/routes/import.js` *(baru)* | `GET /api/import/template` (download template on-demand, dropdown selalu fresh) · `POST /api/import/penjualan/preview` · `POST /api/import/penjualan/confirm` · `POST /api/import/obat-masuk/preview` · `POST /api/import/obat-masuk/confirm` |
| 7 | `backend/src/app.js` | Mount `/api/import`, tambah middleware upload file (`multer`) |
| 8 | `simo/hooks/useImport.ts` *(baru)* | Hook untuk trigger download template, upload preview, confirm import |
| 9 | `simo/components/transaksi/ImportModal.tsx` *(baru)* | Modal: pilih file → tampil tabel preview dengan badge status per baris → tombol "Konfirmasi Import" |
| 10 | `simo/app/(dashboard)/barang-keluar/page.tsx` | Tambah tombol "Import Excel" di sebelah tombol "Tambah" |
| 11 | `simo/app/(dashboard)/barang-masuk/page.tsx` | Tambah tombol "Import Excel" di sebelah tombol "Tambah" |

**Yang perlu diperjelas/diputuskan sebelum mulai coding (belum final):**
- Baris dengan Nama Obat kosong di dropdown (obat baru belum sempat masuk ke template) — apakah preview menawarkan opsi "buat obat baru langsung dari sini", atau cukup ditandai untuk diinput manual lewat form biasa?
- Batas ukuran file / jumlah baris per upload untuk mencegah request terlalu besar

**Status:** ⬜ Belum diimplementasi — baru sebatas keputusan desain dan dependency `exceljs` sudah ditambahkan ke `backend/package.json`. Belum ada file kode yang ditulis.

---

## Catatan Pengembangan

1. **Urutan coding:** Database → Backend (service + controller + route) → Frontend (hook + komponen + halaman). Jangan membangun frontend sebelum API-nya siap. Backend Express dijalankan dengan `npm run dev` dari folder `/backend`.

2. **Test kalkulasi lebih dulu:** Fase 3 (kalkulasi EOQ) adalah fase paling kritis. Verifikasi dengan data dummy menggunakan kalkulator manual sebelum lanjut ke fase berikutnya.

3. **Data seed realistis:** Gunakan nama obat yang nyata ada di apotek (Paracetamol, Amoxicillin, Antasida, Vitamin C, dll) dengan harga beli yang masuk akal. Ini memudahkan validasi bersama pihak apotek.

4. **Dokumentasi untuk skripsi:** Simpan screenshot setiap halaman setelah selesai. Endpoint `GET /api/obat/{id}/perhitungan` sangat penting karena outputnya bisa langsung masuk ke bab hasil & pembahasan skripsi.

5. **Biaya pesan S = 0:** Ini kondisi aktual Apotek Rezky Medika. Pastikan sistem menangani kasus ini dengan baik dan menampilkan penjelasan yang informatif (bukan error).
