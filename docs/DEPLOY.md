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

## G. Yang sengaja belum dikerjakan

Paginasi laporan, tampilan mobile, modal aksesibel (pembaca layar), `bcrypt` native, upgrade dependensi, dan pembersihan riwayat git lama (rahasia lamanya sudah dirotasi; butuh force-push dan izin pemilik).
Seed `database-migrations/008_seed_users.sql` hanya untuk database baru; segera ganti password setelah dipakai.
