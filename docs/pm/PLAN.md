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

---

# Tahap 3 — layak hosting (jalur SEDANG)

- Tanggal: 2026-11-10 | Branch: `chore/layak-hosting` | Pemilik: Niki
- Tujuan: menutup sisa temuan QA (R1 dan R2) sampai aplikasi layak dipasang di hosting. T-01..T-08 sudah selesai (tahap 2).
- Di luar tugas staf (hanya Boss): ganti password akun, JWT_SECRET produksi, cek stok awal, putuskan ambang 1.5 vs 1.2, pilih hosting/domain HTTPS dan uji login Google asli.
- Batasan umum: tanpa `migrate up`, tanpa menulis ke database production, tanpa menyentuh password/riwayat git, tanpa mencetak rahasia, tanpa commit/push oleh staf.

## Tabel task tahap 3

| ID | Judul | Divisi | Area | Prioritas | Status |
|----|-------|--------|------|-----------|--------|
| T-09 | Skrip uji QA masuk repo (`qa-tools/`) | dev-ops | `qa-tools/` | Sedang | belum |
| T-10 | Endpoint pemantauan `/api/health/db` + panduan UptimeRobot dan rotasi log pm2 | dev-backend | `backend/src`, `docs/DEPLOY.md` | Tinggi | belum |
| T-11 | Skrip backup/restore logis + prosedur Neon | dev-ops | `backend/scripts`, `docs/DEPLOY.md` | Tinggi | belum |
| T-12 | Header keamanan frontend + CSP Report-Only | dev-frontend | `simo/next.config.*` saja | Sedang | belum |
| T-13 | Tampilan responsif HP (360-430px) | dev-frontend | `simo/` (komponen/halaman) | Sedang | belum |
| T-14 | Pembaruan dependensi aman (`npm audit fix` tanpa --force) | dev-ops | `backend/`, `simo/simo` | Sedang | belum (dikerjakan TERAKHIR setelah T-09..T-13) |
| T-15 | Uji browser sungguhan (Chrome terpasang) | Tessa (QA) | folder uji di luar repo | Tinggi | belum (setelah T-14) |

Urutan: T-09, T-10, T-11, T-12, T-13 boleh paralel (beda area; T-12 hanya `next.config`, T-13 tidak boleh menyentuh `next.config`; T-10 dan T-11 sama-sama menyunting `docs/DEPLOY.md` di bagian berbeda, jangan saling timpa) -> T-14 -> T-15.

## Acceptance criteria tahap 3

### T-09 Skrip uji QA ke `qa-tools/`
Sumber: scratchpad (pgenv/up.js, preload.js, suite.js, fix.js, smoke-prod.js, latensi-neon.js, beban-qa/*).
- AC-T09-1: Semua skrip ada di `qa-tools/` dalam repo; pencarian di `qa-tools/` tidak menemukan `AppData`, `Temp\claude`, `C:\Users`, atau path absolut pribadi lain; semua path relatif/dihitung dari `__dirname`.
- AC-T09-2: `qa-tools/package.json` sendiri (embedded-postgres, pg, bcryptjs, autocannon) dan `qa-tools/README.md` berisi cara pakai berurutan; `node_modules` dan data Postgres uji di-gitignore.
- AC-T09-3: Dari nol (hapus `qa-tools/node_modules`, `npm install`, ikuti README): DB lokal naik, suite regresi dan smoke-prod berjalan dengan hasil sama seperti sebelum dipindah (jumlah lulus/gagal dilaporkan).
- AC-T09-4: Preload pengaman tetap menolak koneksi ke DB selain lokal (dibuktikan dengan DATABASE_URL host non-lokal ditolak); `latensi-neon.js` hanya SELECT (tanpa INSERT/UPDATE/DELETE/DDL).

### T-10 Pemantauan health
- AC-T10-1: `GET /api/health` tetap ringan (tanpa query DB), 200, isi tidak berubah dari kontrak sekarang dan tanpa env/rahasia.
- AC-T10-2: `GET /api/health/db` menjalankan `SELECT 1`; sukses = 200 dengan status dan waktu respons (ms); DB tidak terjangkau = 503 dengan pesan generik. Diuji: DB lokal hidup (200) dan dimatikan/URL salah (503).
- AC-T10-3: Respons dan log tidak memuat DATABASE_URL, host, kredensial, atau env; kegagalan tercatat satu baris jelas (waktu, pesan ringkas) tanpa stack berisi rahasia. Endpoint tanpa login tetapi dibatasi laju agar tidak bisa membebani DB.
- AC-T10-4: `docs/DEPLOY.md` punya bagian "Pemantauan": langkah UptimeRobot (atau sejenis) untuk `/api/health` dan `/api/health/db`, interval, notifikasi, plus rotasi log pm2 (`pm2-logrotate`, ukuran/retensi) dan cara cek log.

### T-11 Backup dan restore
- AC-T11-1: `backend/scripts/backup-db.js` (Node + pg, tanpa pg_dump) mengekspor semua tabel aplikasi ke berkas JSON/SQL berstempel waktu di folder yang masuk `.gitignore`; hanya SELECT, tidak mencetak DATABASE_URL atau isi password hash ke konsol.
- AC-T11-2: Skrip restore hanya memulihkan ke DB lokal uji; menolak host non-lokal dan menolak DB yang tidak kosong tanpa flag eksplisit.
- AC-T11-3: Round-trip di Postgres lokal: jumlah baris tiap tabel sama sebelum backup dan sesudah restore (tabel perbandingan dilaporkan); tipe tanggal/numerik/JSON terjaga pada sampel baris.
- AC-T11-4: `docs/DEPLOY.md` memuat prosedur Neon (point-in-time restore / branch, retensi, verifikasi) dengan tanda jelas "TIDAK DIUJI: butuh konsol Neon" pada bagian yang tidak bisa dicoba; cara menjadwalkan backup dan tempat simpan berkas dijelaskan.

### T-12 Header keamanan frontend
- AC-T12-1: `simo/next.config.*` menambah header semua rute: `X-Frame-Options` dan `frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Strict-Transport-Security`.
- AC-T12-2: `Content-Security-Policy-Report-Only` (BUKAN enforcing) terpasang dan mengizinkan sumber yang dipakai Google OAuth dan Next; tidak ada CSP yang memblokir.
- AC-T12-3: `npm run build` lolos; dengan `next start` semua header terlihat di respons (`curl -I`) untuk halaman dan aset; login dan halaman utama tetap jalan (smoke).
- AC-T12-4: Hanya `next.config.*` yang diubah (tidak ada perubahan komponen).

### T-13 Responsif HP
Wajib baca `docs/FE-AGENT.md` dulu; tanpa skill desain eksternal; desktop tidak berubah.
- AC-T13-1: Pada lebar 390px (juga 360 dan 430) halaman dashboard, obat, monitoring, barang-masuk, barang-keluar, laporan, users memenuhi `document.documentElement.scrollWidth <= clientWidth` (tanpa scroll horizontal halaman).
- AC-T13-2: Sidebar menjadi drawer di layar kecil dengan tombol menu di Header (buka/tutup, tutup saat pindah halaman atau klik latar); di desktop tetap seperti semula.
- AC-T13-3: Tabel dalam kartu bisa di-scroll horizontal di dalam kartu; grid kartu menumpuk; form dan modal muat di layar (tidak terpotong, bisa di-scroll).
- AC-T13-4: Desktop (>= 1024px) tidak berubah (tangkapan layar sebelum/sesudah); `npm run build` dan lint tanpa error baru; `next.config.*` tidak disentuh.

### T-14 Pembaruan dependensi aman (terakhir)
- AC-T14-1: `npm audit fix` TANPA `--force` di `backend/` dan `simo/simo/`, plus update patch/minor Next.js bila ada; tidak ada upgrade major.
- AC-T14-2: Build frontend lolos; suite regresi (qa-tools) dan smoke-prod lolos dengan hasil sama seperti sebelum update.
- AC-T14-3: Laporan `npm audit` sebelum/sesudah (jumlah per tingkat) dan daftar sisa kerentanan beserta keterjangkauannya (terjangkau/tidak, alasan).

### T-15 Uji browser sungguhan (Tessa)
Memakai `C:\Program Files\Google\Chrome\Application\chrome.exe` lewat puppeteer-core/playwright-core di folder uji, bukan di repo.
- AC-T15-1: Atribut cookie token (max-age, SameSite, Secure sesuai skema) dan penjagaan `/users` untuk staf terbukti di browser.
- AC-T15-2: Tidak ada overflow horizontal di 390px pada tujuh halaman utama (tangkapan layar sebagai bukti); drawer sidebar berfungsi.
- AC-T15-3: Unduhan laporan PDF dan Excel berjalan dan berkas valid (tidak kosong); pesan error login tampil; banner error muncul saat backend dimatikan.
- AC-T15-4: Fokus keyboard pada modal (fokus masuk, tidak lepas ke latar, Esc menutup bila didukung); semua temuan dilaporkan apa adanya.

## Keputusan tahap 3 (ditunda + alasan)

| Temuan | Keputusan | Alasan |
|--------|-----------|--------|
| FE-05 token dipindah ke cookie httpOnly | DITUNDA | Desain ulang besar (login, middleware, klien API, CORS/CSRF). Mitigasi sekarang: max-age/SameSite/Secure (T-07) + header keamanan dan CSP Report-Only (T-12). Jalur Besar sesudah deploy. |
| CSP enforcing | DITUNDA | Berisiko merusak Google OAuth/Next; Report-Only dulu, amati, baru perketat. |
| PERF-05 / FE-13 paginasi laporan, `limit: 9999` | DITUNDA | Mengubah kontrak API dan banyak tabel; volume apotek saat ini aman. Jalur tersendiri sesudah deploy. |
| FE-08 modal aksesibel penuh, FE-09 label `htmlFor` | Sebagian | Hanya fokus keyboard modal diuji (T-15) dan dilaporkan; perbaikan menyeluruh menunggu jalur lain. |
| Upgrade major dependensi, ganti bcryptjs | DITUNDA | T-14 hanya patch/minor tanpa --force; major berisiko membuat build rusak. |
| APM/pemantauan berbayar, backup otomatis ke cloud | DITUNDA | Di luar kebutuhan awal; T-10/T-11 cukup untuk apotek. |
| Hal milik Boss (password, JWT_SECRET, stok awal, ambang 1.5 vs 1.2, hosting/domain HTTPS, uji Google asli) | Bukan tugas staf | Hanya Boss yang bisa; prasyarat go-live. |

## Jejak gerbang tahap 3
| Gerbang | Status | Bukti |
|---------|--------|-------|
| 2 (spesifikasi/AC) | lewat (jalur Sedang, AC di dokumen ini) | docs/pm/PLAN.md, 2026-11-10 |
| 3 (build+lint Kiri) | belum | |
| 4 (Tessa) | belum | |
