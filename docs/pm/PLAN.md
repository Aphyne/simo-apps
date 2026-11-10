# PLAN: Perbaikan QA jalur SEDANG (MEDIUM/LOW)

- Pemilik: Niki (PM) | Branch kerja: `fix/qa-medium` | Jalur: SEDANG (tanpa PRD, AC di sini)
- Sumber: `D:\skripsi new\LAPORAN-QA-SIMO.md` bagian 3 (MEDIUM) dan LOW/INFO
- Aturan: tanpa commit, tanpa `migrate up`, tanpa menulis ke database production, jangan sentuh password akun, riwayat git, push.

## Tabel task

| ID | Judul | Divisi | Prioritas | Status |
|----|-------|--------|-----------|--------|
| T-01 | Login Google wajib `email_verified` | dev-backend | Tinggi | belum |
| T-02 | Samakan waktu respons login (anti tebak username) | dev-backend | Sedang | belum |
| T-03 | Pembulatan "estimasi habis (hari)" seragam | dev-backend | Tinggi | belum |
| T-04 | Lead time <= 0 / sigma negatif tidak menghasilkan NaN atau Safety Stock negatif | dev-backend | Tinggi | belum |
| T-05 | Jendela data demand 30 hari konsisten (SQL vs array) | dev-backend | Tinggi | belum |
| T-06 | Halaman admin-only (`/users`, `/pengaturan`) dijaga di klien saat URL langsung | dev-frontend | Sedang | belum |
| T-07 | Cookie token diberi max-age, SameSite, dan Secure bila HTTPS | dev-frontend | Sedang | belum |
| T-08 | Kontras teks gagal: badge "Kritis", `text-gray-300/400`, `text-orange-500`, `text-emerald-500` | dev-frontend | Sedang | belum |

## Status temuan MEDIUM/LOW

Sudah tertangani (hasil cek kode, tidak dikerjakan ulang):
- FE-03 timeout axios (`simo/lib/api.ts`, timeout 20000).
- Validasi angka/tanggal dan input jelek jadi 500 (`backend/src/utils/validasi.js`, `middleware/validasiInput.js`).
- Faktur duplikat (cek no_faktur+obat+batch, 409). Bulk dibatasi 200 item.
- `PUT /users/:id` tidak lagi mengaktifkan ulang akun; tidak bisa nonaktifkan/ubah role diri sendiri.
- helmet terpasang; `/api/health` tidak lagi membocorkan env.
- FE-01/FE-02 (banner error, error.tsx, not-found) dari merge sebelumnya.

Terbuka dan dipilih: T-01 sampai T-08 (di atas).

## Keputusan (ditunda + alasan)

| Temuan | Alasan ditunda |
|--------|----------------|
| NUM-02 ambang status stok (ROP x1.5 di kode vs x1.2 di dokumen) | Keputusan produk, bukan bug teknis. Perlu Boss memilih angka acuan (dan skripsi menyesuaikan). Diubah sepihak bisa mengubah label stok. |
| PERF-05 laporan tanpa paginasi, FE-13 `limit: 9999`, impor statis xlsx/jspdf | Mengubah kontrak API dan banyak tabel; risiko regresi sedang. Aman untuk volume apotek saat ini. Jalur tersendiri sesudah deploy. |
| PERF-08 create tidak transaksional | Barang masuk/keluar sudah memakai transaksi; sisa kasus (DB putus) jarang. Tunggu pengujian beban ulang. |
| FE-07 mobile, FE-08 modal aksesibel, FE-09 label `htmlFor` | Pekerjaan UI luas (banyak komponen). Perlu jalur Besar dan desain mengikuti FE-AGENT.md. |
| FE-05 pemindahan token dari sessionStorage / CSP | Perubahan arsitektur auth; hanya max-age/Secure yang diambil (T-07). |
| Ganti bcryptjs ke bcrypt native | Berisiko build di Windows; manfaat kecil. |
| Upgrade dependensi (Next, jsPDF, axios, dll) | Upgrade major berisiko mematahkan build; mayoritas tidak terjangkau. Jadwal terpisah. |
| Hapus paket tak terpakai (zod, @types/jspdf, express-validator) | Mengubah lockfile tanpa nilai bagi apotek. Nanti. |
| `no_batch` di ObatBatchSummary, 16 error ESLint | Backend sudah mengirim `no_batch`; kemungkinan hanya soal tipe. Tidak berdampak data. Cek saat jalur lint. |
| Middleware Next titik-URL, escape formula Excel, `rejectUnauthorized:false`, IP log | Data tetap terlindungi API / risiko rendah / bergantung konfigurasi Neon. |
| Ganti password akun, riwayat git | Sengaja ditunda Boss. |

## Acceptance criteria

### T-01 Login Google email_verified
- AC-T01-1: Token Google dengan `email_verified=false` ditolak (401/403), tidak ada JWT diterbitkan.
- AC-T01-2: Token dengan `email_verified=true` dan email terdaftar tetap bisa login seperti sebelumnya.
- AC-T01-3: Percobaan ditolak tercatat di log aktivitas sebagai login gagal.

### T-02 Waktu respons login
- AC-T02-1: Selisih rata-rata waktu respons username tidak ada vs username ada dengan password salah kurang dari 20 ms (sampel minimal 20 per kasus).
- AC-T02-2: Pesan error kedua kasus identik: "Username atau password salah".
- AC-T02-3: Login valid dan login akun nonaktif tetap berperilaku sama.

### T-03 Pembulatan estimasi habis
- AC-T03-1: Untuk obat yang sama, nilai estimasi habis (hari) identik di semua halaman/endpoint yang menampilkannya.
- AC-T03-2: Satu aturan pembulatan dipakai (dicatat di komentar kode), dan stok 0 menghasilkan 0 hari.
- AC-T03-3: Demand 0 tidak menghasilkan NaN/Infinity (tampil nilai aman, bukan error).

### T-04 Lead time dan sigma
- AC-T04-1: Lead time <= 0 pada perhitungan menghasilkan perilaku terdefinisi yang konsisten (ditolak atau diganti nilai minimum yang dilaporkan), bukan NaN.
- AC-T04-2: Safety Stock selalu >= 0 meskipun sigma/inputan tidak lazim.
- AC-T04-3: Hasil ROP/EOQ untuk data normal (lead time positif) tidak berubah dibanding sebelum perbaikan (bandingkan 5 obat sampel).

### T-05 Jendela data demand
- AC-T05-1: Rentang tanggal di SQL dan panjang array hitung sama (30 hari), penjualan di hari ke-30 dihitung.
- AC-T05-2: Dengan data uji hari ke-30 berisi penjualan, total demand = jumlah semua hari dalam jendela.
- AC-T05-3: Perhitungan tetap memakai zona WIB (hasil tidak bergeser menurut jam).

### T-06 Guard halaman admin
- AC-T06-1: Akun staf membuka `/users` dan `/pengaturan` lewat URL langsung diarahkan keluar (dashboard) atau tampil pesan akses ditolak, tanpa menampilkan data.
- AC-T06-2: Admin tetap dapat mengakses kedua halaman.
- AC-T06-3: Tidak ada kedipan konten admin sebelum pengalihan.

### T-07 Cookie token
- AC-T07-1: Cookie token punya `max-age` (selaras masa berlaku JWT) dan `SameSite=Lax` atau lebih ketat.
- AC-T07-2: `Secure` aktif hanya saat halaman diakses lewat HTTPS; login lewat `http://localhost` tetap berfungsi.
- AC-T07-3: Logout menghapus cookie; middleware Next tetap mengalihkan ke login tanpa cookie.

### T-08 Kontras
- AC-T08-1: Badge "Kritis" memiliki rasio kontras teks/latar >= 4.5:1.
- AC-T08-2: Teks bermakna (bukan dekoratif) yang memakai `text-gray-300/400`, `text-orange-500`, `text-emerald-500` pada latar terang memenuhi >= 4.5:1 (hitung rasio aktual, sertakan tabel).
- AC-T08-3: Tidak ada perubahan tata letak, hanya warna; `npm run build` dan lint lolos tanpa error baru.

## Jejak gerbang
| Gerbang | Status | Bukti |
|---------|--------|-------|
| 2 (spesifikasi/AC) | lewat (AC di dokumen ini, jalur Sedang) | docs/pm/PLAN.md |
| 3 (build+lint Kiri) | belum | |
| 4 (Tessa) | belum | |
