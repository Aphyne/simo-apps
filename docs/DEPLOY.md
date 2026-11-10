# Panduan Deploy SIMO

Daftar langkah dari kondisi sekarang (semua tes lolos di lokal) sampai bisa dipakai. Centang satu per satu.
Hasil uji yang mendasari panduan ini: `LAPORAN-QA-SIMO.md` dan `LAPORAN-QA-SIMO-R2.md` (di luar repo).

## A. Yang HANYA bisa dikerjakan pemilik

- [ ] **Ganti password** `admin`, `staf1`, `peneliti` (sekarang masih `password`):
  `cd backend` lalu `node scripts/ganti-password.js` (password diketik tersembunyi, tidak lewat chat).
- [ ] **Buat `JWT_SECRET` baru** khusus produksi (acak, minimal 32 karakter):
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` lalu simpan di `.env` server. Jangan dipakai ulang dari lokal.
- [ ] **Cek data stok awal** terhadap stok fisik: kemungkinan 23 obat terhitung dua kali antara stok awal dan penjualan Oktober. Kalau benar, stok dan rekomendasi pesan ulang bisa salah (masalah data, bukan kode).
- [ ] **Cek ambang "mendekati ROP"**: kode memakai 1,5 × ROP. Samakan dengan skripsi (kalau skripsi menulis 1,2, beri tahu agar kode disesuaikan).
- [ ] **Siapkan hosting & domain HTTPS** (lihat bagian B).
- [ ] **Uji login Google dengan akun asli** setelah domain jadi (daftarkan domain di Google Cloud Console → Authorized JavaScript origins).

## B. Tempat menjalankan (penting untuk kecepatan)

Neon (database) ada di **AS Timur (`us-east-1`)**. Dari Indonesia, tiap query butuh ±260 ms. Hasil ukur nyata:

| Kondisi | Dashboard | 5 pengguna membuka halaman bersamaan |
|---|---|---|
| Backend di PC lokal, pool 3 (bawaan) | 770 ms | ±6 detik |
| Backend di PC lokal, `DB_POOL_MAX=8` | 267 ms | ±4 detik |

Saran: **jalankan backend di server yang dekat database** (region AS Timur). Query backend→database jadi hitungan milidetik, dan pengguna hanya menanggung satu kali jarak per halaman. Alternatif: buat proyek Neon baru di region Singapura (`ap-southeast-1`) lalu pindahkan data (butuh backup & restore).
Atur `DB_POOL_MAX=8` di server. Request pertama setelah lama tidak dipakai bisa 5–6 detik (database Neon bangun dari tidur).

## C. Pengaturan server backend

`.env` di server (contoh di `backend/.env.example`). Server **menolak menyala** di produksi bila `JWT_SECRET` lemah/placeholder atau `FRONTEND_URL` kosong/localhost.

```
NODE_ENV=production
PORT=8000
DATABASE_URL=<dari Neon, pakai host -pooler>
JWT_SECRET=<acak 48 byte hex, bagian A>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://<domain frontend>
GOOGLE_CLIENT_ID=<client id>
TRUST_PROXY=1        # bila ada Nginx/hosting di depan; kosongkan bila tidak ada
DB_POOL_MAX=8
```

Jalankan dengan pm2 (cukup SATU instance, karena pencabutan token, cache akun, dan pembatas login ada di memori proses):

```
npm install -g pm2
cd backend && pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

Tanpa `TRUST_PROXY` di belakang proxy, semua pengguna terlihat satu IP dan pembatas login (10 gagal / 15 menit) mengunci semua orang sekaligus.

## D. Pengaturan frontend

`simo/.env.local` (atau variabel build di hosting), **harus ada sebelum `npm run build`** karena nilainya ikut tertanam:

```
NEXT_PUBLIC_API_URL=https://<domain backend>/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client id>
```

Lalu `cd simo && npm run build && npm run start` (atau deploy ke hosting Next.js). Pakai HTTPS: cookie token baru bertanda `Secure` bila dibuka lewat https.

## E. Database

- Migrasi **023** (kolom `users.email`) sudah diterapkan di Neon. Jangan jalankan `migrate up` (tracker tidak sinkron, migrasi 018 destruktif); migrasi baru diterapkan manual.
- Aktifkan/cek **backup Neon** (point-in-time restore) dan latih satu kali memulihkan ke cabang percobaan.

## F. Cek setelah naik (smoke test)

- [ ] `https://<backend>/api/health` → 200, tanpa informasi env.
- [ ] Login admin dan staf. Login salah password → pesan error tetap tampil di halaman login.
- [ ] Staf **tidak** melihat tombol Tambah/Edit/Hapus obat, dan membuka `/users` diarahkan ke dashboard.
- [ ] Catat satu barang masuk dan satu barang keluar uji, lalu cek stok bertambah/berkurang dan dashboard berubah.
- [ ] Matikan backend sebentar → muncul banner merah "Sebagian data gagal dimuat", bukan angka 0.
- [ ] Unduh satu laporan PDF dan satu Excel dari browser.
- [ ] DevTools → Application → Cookies: `simo_token` bertanda `Secure` dan `SameSite=Lax`.
- [ ] Login Google dengan akun yang terdaftar di tabel users.

## Pemantauan

Dua alamat publik (tanpa login, tanpa info env/rahasia):

| Alamat | Fungsi | Sehat | Gagal |
|---|---|---|---|
| `/api/health` | Server hidup (ringan, tidak menyentuh database) | 200 | tidak ada respons |
| `/api/health/db` | Server bisa menjalankan `SELECT 1` ke database | 200 + `waktu_respons_ms` | 503 "Database tidak dapat dijangkau" |

`/api/health/db` menunggu maksimal 5 detik, hasilnya disimpan 5 detik, dan dibatasi 30 permintaan/menit per IP (lebih dari itu 429). Di belakang proxy pastikan `TRUST_PROXY=1` agar batas dihitung per pengguna, bukan per proxy.

**Mendaftar UptimeRobot (gratis, atau layanan sejenis):**
1. Daftar di uptimerobot.com, lalu **Add New Monitor** dengan tipe **HTTP(s)**.
2. Monitor 1: nama `SIMO API`, URL `https://<domain backend>/api/health`, interval **5 menit**.
3. Monitor 2: nama `SIMO Database`, URL `https://<domain backend>/api/health/db`, interval **5 menit**. Jangan lebih rapat dari 1 menit.
4. Di **Alert Contacts** tambahkan email pemilik (dan WhatsApp/Telegram bila ada), lalu centang kontak itu pada kedua monitor.
5. Uji: matikan backend (`pm2 stop simo-backend`), tunggu notifikasi "Down", lalu nyalakan kembali (`pm2 start simo-backend`). Catatan: database Neon yang baru bangun dari tidur bisa membuat satu cek lambat; itu bukan kerusakan.

**Rotasi log pm2** (agar log tidak memenuhi disk):
```
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```
Artinya berkas log dipotong tiap 10 MB, 14 berkas terakhir disimpan dan dikompres.

**Cek log:** `pm2 logs simo-backend --lines 100` (langsung), `pm2 status` (status dan jumlah restart). Kegagalan database tercatat satu baris berawalan `[health/db]` berisi waktu dan jenis kesalahan ringkas (misal `ECONNREFUSED` atau `timeout`), tanpa host atau kredensial. Nama proses mengikuti `backend/ecosystem.config.js`; sesuaikan bila berbeda.

## Backup dan pemulihan

Dua lapis: (1) backup bawaan Neon (cepat, titik waktu), (2) berkas backup logis buatan sendiri (cadangan di luar Neon).

### 1. Backup logis dengan skrip (sudah diuji lokal)

```
cd backend
node scripts/backup-db.js                # membaca DATABASE_URL dari backend/.env
```
- Hanya `SELECT` dalam transaksi read-only (snapshot tunggal); tidak menulis ke Neon dan tidak mencetak URL/kredensial.
- Hasil: `backend/backups/simo-backup-YYYYMMDD-HHMMSS.json` (jam UTC). Folder ini ada di `.gitignore`. **Berkas berisi data sensitif (hash password, data usaha): jangan di-commit, jangan dikirim lewat chat.**
- Pulihkan ke Postgres **lokal** (untuk uji atau memeriksa isi). Skema harus sudah ada (terapkan migrasi di DB lokal), tabel harus kosong:
  ```
  RESTORE_DATABASE_URL=postgresql://user:pass@localhost:PORT/nama_db node scripts/restore-db.js backups/<berkas>.json
  ```
  Skrip menolak host non-lokal dan menolak target yang tidak kosong kecuali memakai `--timpa` (mengosongkan tabel lebih dulu). Restore ke Neon production **tidak** dilakukan lewat skrip ini; gunakan pemulihan Neon di bawah.
- Bukti uji (Postgres lokal): jumlah baris 7 tabel sama sebelum backup dan sesudah restore, isi tiap tabel identik (cek md5), tipe `date`, `numeric`, `timestamptz` terjaga.
- **Jadwal:** minimal seminggu sekali dan sebelum setiap perubahan data besar (impor, migrasi). Windows: Task Scheduler menjalankan `node scripts/backup-db.js` dengan folder awal `backend`. Linux: `0 2 * * 0 cd /path/simo/backend && node scripts/backup-db.js`. Salin berkas ke tempat di luar server/laptop (mis. Google Drive pribadi atau flashdisk), simpan 8 minggu terakhir, hapus yang lebih lama. Jangan simpan di folder repo yang disinkronkan publik.

### 2. Pemulihan lewat Neon (point-in-time restore / branch)

> **TIDAK DIUJI: butuh konsol Neon.** Langkah di bawah berdasarkan fitur Neon; Boss perlu mencobanya sekali di konsol dan mencatat hasilnya.

1. **Cek retensi:** konsol Neon, pilih project, menu **Settings > Storage / Restore window**. Paket gratis menyimpan riwayat singkat (sekitar 6 jam, bisa berubah); paket berbayar bisa lebih lama. Catat batasnya, karena data di luar jendela itu hanya bisa dipulihkan dari berkas backup logis.
2. **Pulihkan tanpa menimpa production (disarankan):** menu **Branches > Create branch**, pilih induk `main` dan titik waktu (atau "Past data") sebelum kejadian. Hasilnya cabang baru dengan connection string sendiri.
3. **Verifikasi:** arahkan salinan `.env` lokal ke cabang itu, jalankan `node scripts/backup-db.js` (read-only) lalu bandingkan jumlah baris per tabel dengan harapan (obat, barang_masuk, barang_keluar, users).
4. **Ganti production:** bila data di cabang benar, pakai **Restore** pada branch `main` ke titik waktu itu, atau ganti `DATABASE_URL` backend ke cabang baru lalu restart (`pm2 restart simo-backend`). Setelah memulihkan, cek `/api/health/db`.
5. **Latihan:** lakukan langkah 2-3 satu kali sebelum go-live agar prosedur terbiasa.

## G. Yang sengaja belum dikerjakan

Paginasi laporan, tampilan mobile, modal aksesibel (pembaca layar), `bcrypt` native, upgrade dependensi, dan pembersihan riwayat git lama (rahasia lamanya sudah dirotasi; butuh force-push dan izin pemilik).
Seed `database-migrations/008_seed_users.sql` hanya untuk database baru; segera ganti password setelah dipakai.
