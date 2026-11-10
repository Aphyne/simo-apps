# qa-tools: skrip uji QA SIMO

Alat uji di luar aplikasi: Postgres lokal sementara, suite regresi API, smoke test mode produksi, uji beban, ukur latensi Neon. Semua path dihitung dari `__dirname` (tidak ada path pribadi). Tidak pernah menyentuh database production kecuali `latensi-neon.js` (hanya baca).

Prasyarat: Node 18+, `npm install` sudah dijalankan di `backend/` dan `simo/` (skrip memakai kode backend, dan `smoke-prod.js` butuh `simo/.next` hasil `npm run build`). Port yang dipakai: 54329 (Postgres), 8002, 8031, 8032, 3010.

## Urutan pakai (dari folder `qa-tools`)

1. `npm install` (sekali).
2. `node pgenv/up.js` : memulai Postgres lokal (`postgresql://qa:qa@localhost:54329/simo_qa`) dan menerapkan `database-migrations/*.sql` ke DB lokal. Biarkan jalan di terminal/latar; siap bila tercetak `POSTGRES LOKAL SIAP`.
3. `node pgenv/fix.js` : menyiapkan akun uji (password `password` untuk semua user lokal, kolom email).
4. `node pgenv/suite.js` : suite regresi penuh (menyalakan backend uji sendiri di port 8002). Hasil: `RINGKAS: 46 lulus, 0 gagal dari 46`.
5. `node smoke-prod.js` : backend `NODE_ENV=production` + `next start` (butuh build frontend). Hasil: 18 lulus.
6. Opsional: `bash uji-t/run.sh` (uji unit T-01..T-05), `node beban-qa/setup.js` lalu `node beban-qa/load.js|conc.js|dos.js|crash.js|kill.js|outage.js` (beban; mengisi data besar ke DB lokal).
7. Matikan Postgres: buat berkas kosong `pgenv/pg.stop` (up.js berhenti sendiri dalam 1 detik), lalu pastikan port 54329 bebas.

## Pengaman
`pgenv/preload.js` dimuat lewat `node -r` ke backend uji. Ia menolak (exit 99) bila `DATABASE_URL` bukan tepat `postgresql://qa:qa@localhost:54329/simo_qa`, jadi backend tidak bisa terhubung ke Neon/host lain lewat alat ini.
`latensi-neon.js` memakai `backend/.env` (tidak mencetak rahasia) dan hanya `SELECT` serta request `GET`; jalankan hanya dengan izin pemilik, karena ia menyentuh Neon sungguhan.

## Perubahan ekspektasi saat dipindah (suite 44/46 menjadi 46/46)
- **AUTH-02b**: dulu mengharapkan login benar tetap 200 setelah 40 gagal. Rate limiter justru memblokir IP itu (429), yang merupakan perilaku benar; ekspektasi diubah menjadi 429.
- **INJ-08**: dulu menguji kunci pertama (`alamat_apotek`, teks bebas) dengan nilai "NaN", yang sah untuk teks. Kini memakai kunci numerik `default_lead_time`, yang memang ditolak.

Keluaran uji (`*.log`, `*.out`), `node_modules/`, dan data Postgres (`pgenv/data/`) di-gitignore. Memulai dari nol: hentikan Postgres, hapus `pgenv/data/`.
