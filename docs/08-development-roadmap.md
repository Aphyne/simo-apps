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
- [x] Q tradisional = satuan_per_dus (asumsi akademis, valid untuk skripsi)
- [x] Label "qty" diganti "jumlah pesan", "Q Tradisional" diganti "Isi per Dus"
- [x] Modal detail menampilkan breakdown rumus per baris agar user paham asal angka

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
- [ ] Loading skeleton di semua tabel
- [ ] Empty state di semua tabel
- [ ] Error handling: koneksi gagal, validasi form
- [ ] Seed data lengkap: 20-30 obat dengan riwayat transaksi 3 bulan
- [ ] Verifikasi semua kalkulasi EOQ/SS/ROP manual vs sistem
- [ ] Cek konsistensi angka dashboard vs tabel detail
- [ ] Screenshot semua halaman untuk lampiran skripsi

**Opsional (jika waktu cukup):**
- [ ] **Ubah layout halaman Supplier menjadi card per supplier** — saat ini berbentuk tabel, ingin diubah menjadi tampilan card (satu card per supplier) agar lebih visual dan mudah dibaca

- [ ] Chart "Top 5 Obat Paling Laris" di bagian bawah halaman Barang Keluar
  - Bar chart horizontal, toggle periode: 1 Minggu / 2 Minggu / 1 Bulan
  - Backend: `GET /api/barang-keluar/top-laris?periode=14` → GROUP BY obat_id, SUM jumlah WHERE keterangan='Penjualan'
  - Berguna untuk user yang pesan barang tiap 2 minggu agar tahu obat prioritas

- [ ] **Ringkasan/Summary card per halaman** — tambah bar ringkasan di atas atau bawah tabel tiap halaman agar user langsung tahu kondisi tanpa harus hitung manual:

  | Halaman | Ringkasan yang cocok |
  |---|---|
  | **Data Obat** | Total obat terdaftar · Sudah dihitung EOQ: X · Belum dihitung: Y · Perlu reorder sekarang: Z |
  | **Barang Masuk** | Total transaksi · Total satuan masuk · Total dus masuk (berguna untuk rekap harian/bulanan) |
  | **Barang Keluar** | Total transaksi · Total satuan keluar · Breakdown: Penjualan X \| Expired Y \| Rusak Z (penting untuk tahu berapa yang terbuang vs terjual) |
  | **Perhitungan EOQ/ROP** | Total obat terhitung · Total biaya persediaan optimal/tahun (sum total_biaya semua obat) |
  | **Supplier** | Total supplier terdaftar |
  | **Dashboard** | ✅ Sudah ada — 5 stat card, tidak perlu tambah |
  | **Analisis** | ✅ Sudah ada — 4 summary card (Obat Dihitung, Biaya Sebelum, Biaya Dengan EOQ, Total Penghematan) |
  | **Simulasi** | Jumlah skenario tersimpan (sudah tampil di riwayat, tidak perlu card khusus) |
  | **Laporan** | ❌ Tidak perlu — halaman ini khusus cetak/export, bukan analisis |

  Catatan implementasi:
  - Ringkasan dihitung client-side dari data yang sudah di-fetch, tidak butuh endpoint baru
  -  Belum diputuskan: default tampilan ringkasan perhari/perminggu/perbulan atau berdasarkan apa — perlu diskusi saat Fase 10. Atau Bisa Periode ringkasan **mengikuti filter tanggal aktif** — bukan hardcode harian/mingguan/bulanan. Jadi kalau user filter "Januari", ringkasan otomatis jadi total Januari. Default tanpa filter = tampil semua
  - ⚠️ Belum diputuskan: format/bentuk tampilan ringkasan per halaman seperti apa — perlu diskusi saat Fase 10

- [ ] **Filter di halaman Barang Masuk & Barang Keluar:**
  - Filter tanggal **per hari** (satu input tanggal, bukan range dari–sampai) agar simpel — user tinggal pilih tanggal berapa, langsung tampil transaksi hari itu
  - Filter kategori obat (dropdown sama seperti di halaman Laporan)
  - Backend sudah support filter tanggal dan kategori, tinggal disambung di frontend

---

## Catatan Pengembangan

1. **Urutan coding:** Database → Backend (service + controller + route) → Frontend (hook + komponen + halaman). Jangan membangun frontend sebelum API-nya siap. Backend Express dijalankan dengan `npm run dev` dari folder `/backend`.

2. **Test kalkulasi lebih dulu:** Fase 3 (kalkulasi EOQ) adalah fase paling kritis. Verifikasi dengan data dummy menggunakan kalkulator manual sebelum lanjut ke fase berikutnya.

3. **Data seed realistis:** Gunakan nama obat yang nyata ada di apotek (Paracetamol, Amoxicillin, Antasida, Vitamin C, dll) dengan harga beli yang masuk akal. Ini memudahkan validasi bersama pihak apotek.

4. **Dokumentasi untuk skripsi:** Simpan screenshot setiap halaman setelah selesai. Endpoint `GET /api/obat/{id}/perhitungan` sangat penting karena outputnya bisa langsung masuk ke bab hasil & pembahasan skripsi.

5. **Biaya pesan S = 0:** Ini kondisi aktual Apotek Rezky Medika. Pastikan sistem menangani kasus ini dengan baik dan menampilkan penjelasan yang informatif (bukan error).
