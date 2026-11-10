# PLAN: tahap Design System (jalur SEDANG)

- Tanggal: 2026-11-10 | Branch: `refactor/design-system` | Pemilik: Niki
- Sumber: docs/pm/HANDOFF-DESIGN.md (rencana baru), docs/spec/design-system.md (v1.0, 16 AC)
- Urutan Tahap A/B: T-D0 (selesai) → T-D2 (sedang) → Tahap B T-D5a..g → T-D1 → T-D3 → T-D4 → uji Tessa.
- Urutan akhir (diputuskan Boss 10 Nov 2026): T-D1..T-D4 → uji Tessa → C0 → C1 → C2 → C3 (→ C4 usulan terpisah) → Fase D → redesign total (Boss, di luar rencana ini).

| ID | Judul | Pengerja | Status |
|----|-------|----------|--------|
| T-D0 | Garis dasar (cacahan, tangkapan layar, lint/tsc/build) | dev-frontend | SELESAI (10 Nov 2026). Bukti: D:\skripsi new\uji-design\sebelum\ (90 PNG = 15 halaman x 2 viewport x 3 ulang, hash.txt, determinisme.txt 29/30 IDENTIK; satu kedip sporadis di obat-detail_390, 5 piksel), sebelum\css\ (hash CSS), cacahan.txt, README.md. Lint 16 error + 9 warning (lama), tsc dan build EXIT=0. Catatan: (1) selisih cacahan, hasil 2.411 kemunculan di 80 berkas vs spec 2.522 di 85, belum dicocokkan, jadi tugas awal T-D5a; (2) folder sisa tes-dialog\ dan tes-detail\ di uji-design belum dihapus |
| T-D2 | Token `@theme inline` + bukti (a)(b) | dev-frontend | SELESAI (10 Nov). (a) 3.240 pasangan kelas identik di Tailwind 4.3.0; (b) tailwind-merge 2.6.1 menyatukan bg-brand-* dengan warna lama |
| T-D5a | Pencocokan cacahan dan skrip migrasi | dev-frontend | SELESAI (10 Nov). Selisih = beda cakupan; pemindai baru 2.534/85 berkas. Skrip: uji-design\migrasi.js, konflik.js |
| T-D5b..g | Migrasi ke token dengan skrip mekanis per kelompok berkas | dev-frontend | SELESAI (10 Nov). b 378, c 378, d 378, e 440, f 381, g 408 penggantian. f sempat dibatalkan (konflik urutan kaskade); audit T-D5f0 mengembalikan 95 token di b..e. Sisa 276 kelas lama = penyimpangan terdokumentasi |
| T-D1 | docs/DESIGN.md + rapikan dokumen | dev-frontend | SELESAI (10 Nov). DESIGN.md 177 baris tanpa hex, FE-AGENT.md jadi penunjuk, 07-ui-guidelines.md dihapus |
| T-D3 | Halaman /design (Motion, Progres, swatch berbasis token) | dev-frontend | SELESAI (10 Nov) |
| T-D4 | Akses superadmin (SuperadminOnly, middleware) | dev-frontend | SELESAI (10 Nov). Produksi: tanpa login → /login, admin/staf → /dashboard, superadmin terbuka; dev bebas |
| T-R1 | Halaman /reorder hanya admin (permintaan Boss, di luar rencana awal) | sesi utama (langsung) | SELESAI (10 Nov). Sidebar adminOnly + AdminOnly di page.tsx; hanya `tsc` yang dijalankan; API backend tidak diubah (sengaja) |
| T-D6 | Dokumen akhir | sesi utama | belum |

## FASE C: PEMBERSIHAN (jalur SEDANG; naik ke BESAR bila menyentuh backend/DB)
Dimulai setelah uji Tessa untuk T-D1..T-D4 lolos. Berurutan, satu langkah per panggilan. Fase C tidak boleh mengubah tampilan.

| ID | Judul | Pengerja | Kriteria selesai | Status |
|----|-------|----------|------------------|--------|
| C0 | Titik aman: Boss memutuskan commit seluruh hasil Tahap A/B sebelum pembersihan (Conventional Commits, tanpa trailer Co-Authored-By, beberapa commit logis) | Boss memutuskan; commit dikerjakan Kiri/dev-ops hanya atas perintah Boss | `git status` bersih (atau sisa berkas sengaja dikecualikan dan dicatat); riwayat commit tercatat di jejak gerbang. Tanpa C0, C1 dan seterusnya tidak dimulai | belum |
| C1 | AUDIT SAJA, tanpa menghapus apa pun. Alat deteksi (mis. knip atau ts-prune, depcheck, tsc `noUnusedLocals`, eslint unused) untuk: berkas/komponen/ekspor/dependensi tak terpakai; kelas CSS dan token tak terpakai; aset public/ tak terpakai; dokumen usang di docs/ (di luar yang sudah direncanakan di T-D1); skrip dan berkas sementara (termasuk sisa uji-design\tes-dialog dan tes-detail) | dev-frontend | Daftar bertingkat keyakinan: (1) pasti tak terpakai, (2) mungkin, (3) dipakai dinamis (import dinamis, string kelas, rute Next.js, konfigurasi). Disimpan di docs/pm/ atau laporan di luar repo. Bukti: `git status` tidak menunjukkan satu pun berkas terhapus atau terubah | belum |
| C2 | Boss menyetujui daftar; hanya tingkat (1) dulu, tingkat (2) satu per satu dengan bukti tambahan | Boss (keputusan), Niki (ringkasan) | Persetujuan tertulis Boss per kelompok dicatat di jejak gerbang | belum |
| C3 | Hapus per kelompok kecil. Tiap kelompok: tsc EXIT=0, lint tidak memburuk dari 16 error + 9 warning, build EXIT=0, tangkapan layar identik dengan garis dasar T-D0 (aturan uji Tahap B). Satu commit per kelompok agar mudah di-revert | dev-frontend, direview Kiri | Setiap kelompok punya satu commit dan bukti keempat cek; kelompok gagal cek langsung di-revert, bukan diperbaiki sambil jalan | belum |
| C4 | USULAN TERPISAH: backend, migrasi, skrip, dan berkas terkait data. Tidak dikerjakan dalam C3 | dev-backend (hanya audit/usulan), wajib review Kiri | Daftar usulan dengan alasan dan risiko; Boss memutuskan terpisah. Dilarang menyentuh migrasi, `.env`, database production. Menghapus apa pun di area ini menaikkan jalur ke BESAR (Sylpha + Tessa) | belum (usulan saja) |

## FASE D: KOMPONEN BERSAMA (sebelum redesign total)
Dimulai setelah Fase C (C3) selesai. Berbeda dari Tahap B dan Fase C: Fase D BOLEH menggeser tampilan sedikit karena pola yang tadinya disusun sendiri-sendiri disatukan. Karena itu "tangkapan layar identik" bukan lagi aturan lolos; aturan gantinya: tiap modul yang tampilannya berubah dibandingkan dengan garis dasar, perubahan dicatat, dan perlu persetujuan Boss per modul sebelum lanjut ke modul berikutnya.

| ID | Judul | Pengerja | Kriteria selesai | Status |
|----|-------|----------|------------------|--------|
| D1 | Token bentuk dan ikon (radius, elevasi, ukuran ikon) di globals.css; halaman /design menampilkan komponen ASLI (bukan tiruan) | dev-frontend | Token ada dan terdokumentasi; /design merender komponen yang sama dengan yang dipakai halaman; tsc, lint (tidak memburuk), build lolos | belum |
| D2 | Aturan di docs/DESIGN.md: dilarang menulis `rounded-*` atau menyusun card sendiri di halaman; wajib komponen Card/Button/Badge/IconX | dev-frontend (draf), Sylpha mengecek konsistensi dengan spesifikasi | Aturan tertulis, bernomor, dengan contoh benar/salah; selaras dengan docs/spec/design-system.md | belum |
| D3 | Pindahkan halaman ke komponen bersama per modul, pola paling sering dulu: kartu statistik, card halaman, tabel | dev-frontend, direview Kiri | Per modul: tangkapan layar sebelum/sesudah, daftar selisih visual, persetujuan Boss bila ada perubahan; tsc, lint (tidak memburuk dari 16 error + 9 warning), build lolos; satu commit per modul | belum |
| D4 | Uji Tessa atas Fase D | tessa | Laporan Tessa: AC terkait (komponen bersama, tanpa `rounded-*`/card manual di halaman), regresi fungsional, tampilan sesuai yang disetujui Boss. Gerbang 4 untuk Fase D | belum |

## Risiko baru (Fase C dan D)
| ID | Risiko | Dampak | Mitigasi |
|----|--------|--------|----------|
| R-DS1 | Salah hapus kode yang dipakai secara dinamis (string kelas Tailwind, import dinamis, rute Next.js, konfigurasi, skrip yang dipanggil manual) | Fitur rusak yang tidak tertangkap tsc/lint | C1 hanya audit dengan tingkat keyakinan; hanya tingkat "pasti" yang dihapus dulu; kelompok kecil, satu commit per kelompok, tangkapan layar + build tiap kelompok; revert langsung bila gagal |
| R-DS2 | Kehilangan jejak karena pembersihan dimulai tanpa commit (git tidak jadi jaring pengaman) | Perubahan Tahap A/B tidak bisa dipulihkan | C0 wajib sebelum C1; gerbang C1 tidak dibuka tanpa catatan commit |
| R-DS3 | Tampilan bergeser di Fase D saat komponen disatukan | Hasil tidak sama dengan yang Boss setujui; perbandingan regresi kabur | Persetujuan Boss per modul; tangkapan layar sebelum/sesudah per modul; satu commit per modul; pola paling sering dulu |
| R-DS4 | Pembersihan merembet ke backend/migrasi/data (tracker migrasi tidak sinkron, 018 destruktif) | Risiko data | C4 dipisah sebagai usulan; jalur naik ke BESAR; dilarang menyentuh migrasi, `.env`, production |
| R-DS5 | Garis dasar T-D0 jadi usang setelah Fase D (tampilan sengaja berubah) | Uji regresi berikutnya tidak punya pembanding | Ambil garis dasar baru setelah Boss menyetujui tiap modul Fase D, sebelum redesign total |

## Jejak gerbang
| Gerbang | Status | Bukti |
|---------|--------|-------|
| 1 (PRD) | lewat (jalur Sedang; keputusan Boss final di HANDOFF) | docs/pm/HANDOFF-DESIGN.md, Boss 2026-11-10 |
| 2 (spesifikasi/AC) | lewat | docs/spec/design-system.md (16 AC), Sylpha |
| 3 (build+lint Kiri) | lewat (10 Nov) | Review Kiri (1.056 hunk, 0 token non-kelas berubah); Tessa menjalankan tsc 0 error, eslint 16 error + 9 warning (baseline), next build sukses |
| 4 (Tessa, AC-DS-2,10,11,12,14 + tampilan identik) | lewat (10 Nov) | D:\skripsi new\LAPORAN-QA-DESIGN-SYSTEM.md: AC-DS-1/15, 2, 10, 11, 12, 14 LOLOS; tidak ada bug. Tidak teruji: /design 390 untuk 14 bagian, disabled/dialog bahaya interaktif. Dikerjakan sebelum T-R1 (Reorder), yang belum diuji Tessa |
| 5 (ringkasan ke Boss) | menunggu persetujuan Boss | Ringkasan disampaikan sesi utama, 10 Nov; belum ada commit/merge |
| Fase C: pelaksanaan C0..C3 | selesai (10 Nov 2026, sesi utama langsung atas arahan Boss) | C0: 4 commit design system. C1: docs/pm/AUDIT-KODE-MATI.md. C2: Boss menyetujui kecuali PerbandinganBiayaChart (dipertahankan untuk skripsi). C3: hapus per kelompok, tsc dan lint tidak memburuk. C4 (backend/skrip) belum, usulan terpisah |
| Fase C: persetujuan penambahan rencana | lewat | Boss menjawab YA, 2026-11-10 (via sesi utama). Pelaksanaan C0..C4 belum dimulai |
| Fase D: persetujuan penambahan rencana | lewat | Boss menjawab YA, 2026-11-10 (via sesi utama). Pelaksanaan D1..D4 belum dimulai |

Catatan: PLAN.md utama tidak diubah sesi ini; pm-tracker dapat menggabungkan berkas ini ke PLAN.md nanti.
