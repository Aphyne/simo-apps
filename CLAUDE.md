# SIMO — panduan untuk Claude (dibaca otomatis tiap sesi)

SIMO = Sistem Informasi Manajemen Persediaan Obat (skripsi Boss). Backend Node/Express + Postgres (Neon), frontend Next.js 16 / React 19 / Tailwind 4 di folder `simo/`. Bahasa kerja: Indonesia. Pengguna = "Boss", pemilik semua keputusan.

## Posisi proyek (diperbarui 10 Nov 2026)
Audit QA dan perbaikan sudah selesai dan ada di `main` (lihat `docs/DEPLOY.md`, `docs/pm/PLAN.md`, laporan di `D:\skripsi new\LAPORAN-QA-SIMO*.md`). Lima hal yang HANYA Boss yang bisa kerjakan sebelum hosting: ganti 3 password (`node backend/scripts/ganti-password.js`), `JWT_SECRET` produksi, cek stok awal vs stok fisik, cek ambang MENDEKATI_ROP 1,5 vs 1,2 terhadap skripsi, pilih hosting + domain HTTPS + uji login Google.

## Tim agent (di `C:\Users\ASUS\.claude\agents\`)
Empat divisi, masing-masing satu kepala (boleh memanggil stafnya lewat tool `Agent`, maks 3 lapis):
- **niki** (PM): rencana, prioritas, gerbang kualitas. Staf: pm-planner, pm-tracker, pm-risk.
- **sylpha** (SA): spesifikasi dengan acceptance criteria (AC). Staf: sa-requirement, sa-modeler, sa-database.
- **kiri** (Dev): implementasi + review. Staf: dev-backend, dev-frontend, dev-ops.
- **tessa** (QA): uji; memilih cakupan sendiri (jangan mengulang yang sudah teruji).

### Pilih jalur dulu (hemat token): jangan panggil semua divisi tiap tugas
- **Kecil** (bug/penyesuaian satu area): langsung staf dev yang tepat, lalu Tessa terarah. Tanpa Niki/Sylpha.
- **Sedang:** niki → kiri (→ staf dev) → tessa. Sylpha tidak dipanggil.
- **Besar** (fitur baru, menyentuh data/hak akses/kontrak API): sylpha → niki (gerbang) → kiri → tessa.
Panggilan memakai SURAT TUGAS (Dari, Untuk, Tugas, Input berupa path, Output, Kriteria selesai, Batasan). Hasil balik berupa ringkasan + path berkas, bukan isi.

## Aturan keras (berlaku untuk semua agent dan sesi utama)
1. Butuh persetujuan eksplisit Boss: push ke GitHub, merge ke `main`, force-push/tulis ulang riwayat git, menulis ke database production/Neon, ubah password akun, terapkan migrasi, hapus data, deploy.
2. JANGAN `migrate up` (tracker tidak sinkron, migrasi 018 destruktif); migrasi baru diterapkan manual setelah Boss setuju.
3. Uji tulis hanya di Postgres lokal sementara (`qa-tools/`, port 54329); ke Neon hanya baca dan hanya bila perlu.
4. Jangan cetak/baca nilai rahasia (`backend/.env`, JWT_SECRET, DATABASE_URL, password).
5. Commit memakai Conventional Commits, TANPA trailer Co-Authored-By/"Claude" (Boss tidak mau Claude tampil sebagai contributor). Jangan commit/push kecuali diminta.
6. Sebelum menyentuh UI baca panduan desain (`docs/DESIGN.md` bila sudah ada, jika belum `docs/FE-AGENT.md`). Dilarang memakai skill desain eksternal tanpa izin Boss.
7. Pertanyaan opini = diskusi dulu, jangan langsung ngoding. Laporkan apa adanya (gagal ditulis gagal, tidak diuji ditulis tidak diuji).

## Rujukan cepat
- Uji: `qa-tools/README.md` (suite 46/46, smoke-prod 18/18). Deploy: `docs/DEPLOY.md`. Rencana: `docs/pm/PLAN.md`.
- Hemat token: satu topik besar = satu sesi; baca berkas yang perlu saja; laporan chat ringkas.
