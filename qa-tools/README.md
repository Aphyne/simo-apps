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

### Semua uji sekaligus, satu laporan (disarankan)

```
node jalankan-semua.js --arsip > hasil/semua.log 2>&1
npx playwright show-report hasil/laporan-gabungan
```

Menjalankan uji per peran (44) lalu suite e2e dengan build (151), kemudian menggabungkan keduanya jadi satu laporan web `hasil/laporan-gabungan/` (project `peran`, `desktop-1366`, `hp-390`, `desktop-1366 alur`, `hp-390 alur`). Port 3000 harus kosong (matikan `npm run dev` dulu); `simo/.next` hasil build uji dihapus di akhir, jadi setelahnya jalankan lagi `npm run dev`. Pantau: `Get-Content hasil\semua.log -Wait -Tail 30`. Total sekitar 10-12 menit; ringkasan (jumlah lulus/gagal/dilewati) ada di akhir log.

- `--arsip`: salinan bertanggal di `hasil/arsip/laporan-YYYY-MM-DD/` (pakai di titik penting: sebelum merge/deploy, bahan bimbingan). Buka dengan `npx playwright show-report hasil/arsip/laporan-YYYY-MM-DD`.
- `--gabung-saja`: tidak menjalankan uji, hanya menggabungkan hasil mentah (`hasil/blob-peran`, `hasil/blob-e2e`) dari `jalankan-uji-peran.js` dan `jalankan-e2e.js` yang dijalankan terpisah.
- Fitur baru: tambahkan skenarionya ke `e2e/` atau `uji-peran/`, bukan membuat laporan terpisah.
- Jangan menjalankan `playwright test --list` dengan config uji: perintah itu menimpa laporan web dengan daftar uji yang tampak "dilewati".

Hasil 19 Nov 2026 (setelah Monitoring, Simulasi, Perhitungan ditutup): 200 skenario, 199 lulus, 1 dilewati sengaja (uji sidebar di HP), 0 gagal.

### Membuka laporan hasil uji (web)

Tiap run menulis laporan web ke `hasil/laporan-html/` (diabaikan git; ditimpa tiap run). Isinya per berkas uji: tes lulus/gagal/dilewati, label project, durasi, dan untuk tes gagal ada langkah, galat, serta tangkapan layar. Cara membukanya, dari folder `qa-tools`:

```
npx playwright show-report hasil/laporan-html
```

Browser terbuka sendiri; tekan Ctrl+C di terminal untuk menutup. Memantau progres saat uji masih berjalan: `Get-Content hasil\e2e.log -Wait -Tail 20` di PowerShell (bila run dialihkan ke `hasil/e2e.log`: `node jalankan-e2e.js --build > hasil/e2e.log 2>&1`). Tanda di log: `ok` lulus, `x` gagal, `-` dilewati.

**Laporan uji per peran (Login, Staf, Peneliti).** Uji di `uji-peran/` menulis laporan webnya sendiri ke `hasil/laporan-peran-html/` (terpisah dari laporan e2e di atas, juga diabaikan git dan ditimpa tiap run). Cara membukanya, dari folder `qa-tools`:

```
npx playwright show-report hasil/laporan-peran-html
```

Browser terbuka sendiri; Ctrl+C di terminal untuk menutup. Tes yang gagal memuat tangkapan layar dan rekaman langkah (trace); rekaman bisa dibuka dari laporan, atau langsung dengan `npx playwright show-trace hasil/peran-playwright/<nama-tes>/trace.zip`. Log teks run terakhir (bila dialihkan seperti contoh di bawah): `hasil/uji-peran.log`.

### Uji per peran: Login, Staf, Peneliti (`uji-peran/`)

Satu perintah, dari folder `qa-tools`:

```
node jalankan-uji-peran.js                        # semua uji (Login, Staf, Peneliti)
node jalankan-uji-peran.js > hasil/uji-peran.log 2>&1   # sama, log teks disimpan
node jalankan-uji-peran.js -- -g "Staf"           # argumen setelah "--" diteruskan ke playwright test
```

Beda dengan `jalankan-e2e.js`: **tidak membangun frontend dan tidak menyentuh `simo/simo/.next`**. Uji memakai server dev di port 3000 (`npm run dev`). Bila port 3000 kosong, skrip menyalakan `next dev` sendiri lalu mematikannya lagi (bersama proses turunannya) di akhir; bila server dev Anda sedang menyala, server itu dipakai dan tidak dimatikan. Semua panggilan API dari browser (`http://localhost:8000/api`) dialihkan ke backend uji lokal (port 8038) dengan Postgres lokal sementara (54329) berisi data uji (`uji-peran/seed.js`: akun admin, staf1, staf2, peneliti dengan password `password`; enam obat "… Uji …"; catatan stok; riwayat aktivitas 20 hari). Tidak menyentuh Neon/production. Browser: Chrome terpasang (`SIMO_PW_CHANNEL=msedge` untuk Edge).

Isi (44 uji, terakhir 44 lulus pada 19 Nov 2026):
- `01-login.spec.js` (15): tampilan desktop dan HP, fokus otomatis dan atribut autocomplete, galat kolom kosong, pesan password salah tanpa muat ulang, login gagal tercatat, tombol tampilkan password, tempel password tidak diblokir, urutan Tab, pesan bergilir (titik, jeda, berganti sendiri), gerak dikurangi, Enter mengirim form, cookie, tujuan per peran (admin/staf ke Dashboard, peneliti ke Pemantauan), /login saat sudah masuk, keluar, login peneliti tidak dicatat.
- `02-staf.spec.js` (19): menu staf, halaman admin/peneliti dialihkan, Dashboard tanpa uang, lonceng, Data Obat (kolom harga jual, tanpa harga beli), Stok masuk (isi harga tetapi tidak melihatnya, batalkan dalam 10 menit), pembatalan dijaga backend, Stok keluar (total per transaksi, batalkan), "Tidak tercatat", Laporan (urutan tab, tanpa uang), API menolak staf, tampilan HP.
- `03-peneliti.spec.js` (10): menu peneliti, lonceng temuan tanpa memanggil data obat, Pemantauan (ubin = angka database, panel, periode, rincian pengguna, filter log), Analisis Komparatif (jumlah obat = database, rincian rumus), hak akses API, aktivitas peneliti tidak dicatat, tampilan HP.

Project di `playwright.config.js`: `desktop-1366` dan `hp-390` hanya menjalankan uji tampilan (04) dan berjalan PERTAMA selagi database uji masih bersih; `desktop-1366 alur` lalu `hp-390 alur` menjalankan uji alur (05, 06, dst.). Pemisahan ini mencegah tangkapan HP ikut memotret data sisa uji alur desktop. Satu uji (sidebar tetap saat dropdown dibuka, 06) sengaja dilewati di HP karena sidebar di sana berupa drawer.

Uji di `e2e/` (semua uji dijalankan di dua ukuran layar; terakhir 151 lulus, 1 dilewati sengaja):
- `00-cek-playwright.spec.js`: Playwright + Chrome berjalan (tanpa aplikasi).
- `01-login.spec.js`: pesan error login tidak hilang dan tanpa reload, atribut cookie (Lax, tanpa Secure di http, sekitar 7 hari), halaman diproteksi.
- `02-hak-akses.spec.js`: staf dialihkan dari halaman khusus admin dan tidak melihat tombol Tambah/Edit; admin boleh.
- `03-design-akses.spec.js`: `/design` di produksi hanya untuk superadmin (peneliti).
- `04-tampilan.spec.js`: 10 halaman utama tanpa scroll horizontal dan tangkapan layar sama dengan acuan (waktu browser dibekukan agar stabil), plus halaman 404.

Tangkapan acuan ada di `e2e/__tangkapan__/` (di-commit, sekitar 2 MB); hasil uji sementara di `hasil/` dan `test-results/` (diabaikan git). Bila uji tampilan gagal setelah perubahan UI, lihat selisihnya di `hasil/playwright/`; bila perubahan memang disengaja, perbarui acuan dengan `--update-snapshots` lalu commit.
