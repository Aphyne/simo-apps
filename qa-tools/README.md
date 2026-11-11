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

## Uji browser (Playwright)

Playwright (`@playwright/test`) memakai **Chrome yang sudah terpasang** (`channel: 'chrome'`), jadi tidak ada browser yang diunduh. Konfigurasi: `playwright.config.js` (dua ukuran layar: `desktop-1366` dan `hp-390`, satu worker, tangkapan layar tanpa toleransi piksel). Uji ditaruh di `e2e/`.

Cara menjalankan (satu perintah, dari folder `qa-tools`):

```
npm install
node jalankan-e2e.js --build                 # build frontend (alamat API uji tertanam) + stack + semua uji
node jalankan-e2e.js                         # pakai build yang sudah ada (simo/simo/.next)
node jalankan-e2e.js -- --update-snapshots   # perbarui tangkapan acuan (hanya bila perubahan tampilan DISENGAJA)
node jalankan-e2e.js -- --project=hp-390     # argumen setelah "--" diteruskan ke playwright test
```

`jalankan-e2e.js` menyalakan Postgres lokal sementara (port 54329, dibuat bersih tiap run), akun uji (admin, staf1, peneliti; password `password`, hanya di DB lokal), backend uji (8032) dan `next start` (3010, mode produksi), menjalankan uji, lalu mematikan semuanya. Tidak menyentuh Neon/production. Jangan menjalankan `npx playwright test` langsung kecuali stack sudah menyala (alamat lain lewat `SIMO_FE_URL` dan `SIMO_BE_URL`).

Uji di `e2e/` (62 uji = 31 uji x 2 ukuran layar):
- `00-cek-playwright.spec.js`: Playwright + Chrome berjalan (tanpa aplikasi).
- `01-login.spec.js`: pesan error login tidak hilang dan tanpa reload, atribut cookie (Lax, tanpa Secure di http, sekitar 7 hari), halaman diproteksi.
- `02-hak-akses.spec.js`: staf dialihkan dari halaman khusus admin dan tidak melihat tombol Tambah/Edit; admin boleh.
- `03-design-akses.spec.js`: `/design` di produksi hanya untuk superadmin (peneliti).
- `04-tampilan.spec.js`: 10 halaman utama tanpa scroll horizontal dan tangkapan layar sama dengan acuan (waktu browser dibekukan agar stabil), plus halaman 404.

Tangkapan acuan ada di `e2e/__tangkapan__/` (di-commit, sekitar 2 MB); hasil uji sementara di `hasil/` dan `test-results/` (diabaikan git). Bila uji tampilan gagal setelah perubahan UI, lihat selisihnya di `hasil/playwright/`; bila perubahan memang disengaja, perbarui acuan dengan `--update-snapshots` lalu commit.
