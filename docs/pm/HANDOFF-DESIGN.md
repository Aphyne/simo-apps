# Serah terima: tahap Design System (diperbarui 10 Nov 2026, menimpa versi awal)

Dibaca pertama oleh sesi baru. Tujuan: **mengerjakan tahap Design System** dengan tim agent. Rencana di bawah menimpa urutan lama (versi awal berkas ini).

## Posisi
- Branch kerja: `refactor/design-system` (dari `main`, belum di-merge/push). HEAD `0fe317d`.
- Sudah ter-commit di branch: `CLAUDE.md`, `docs/spec/design-system.md` (spesifikasi Sylpha v1.0, 16 AC), berkas ini, `docs/pm/PLAN-design-system.md` (9938725), perbaikan `GlobalErrorBanner` (b0372ec), penghapusan `docs/ui-design-reference/` (0fe317d).
- **Belum ada langkah Tahap A yang tuntas.** Sesi sebelumnya: Kiri tersangkut karena panggilannya ke dev-frontend tertolak/terhenti dan tidak melapor (sekitar 45 menit terbuang).
- Garis dasar T-D0 baru sebagian di `D:\skripsi new\uji-design\` (di luar repo): skrip cacahan/tangkap/bandingkan, log lint/tsc/build, 30 PNG "sebelum" untuk 5 dari 14 halaman. Hasil di b0372ec: tsc dan build lolos, lint 16 error + 9 warning (sudah ada sebelumnya).
- `docs/DESIGN.md` belum ada. Halaman `/design` lama sudah ada di `simo/app/design/`.
- `main` = hasil audit QA + persiapan hosting (`ea43fd8`). Urusan non-desain milik Boss ada di CLAUDE.md.

## Keputusan Boss (final, menimpa yang lama)
1. Tujuan: SATU sumber desain terstruktur seperti "Akuris Design System" milik teman Boss: token di `globals.css` (satu-satunya tempat nilai), `docs/DESIGN.md` (aturan + nama token, tanpa hex kecuali tabel rasio WCAG), halaman `/design` berbasis token (swatch memakai kelas token, bukan hex diketik). `FE-AGENT.md` jadi penunjuk, `07-ui-guidelines.md` dihapus.
2. Boss akan **REDESIGN TOTAL nanti** (skill ui-ux-pro-max dan hallmark diizinkan untuk redesign, wajib memakai token dan membaca DESIGN.md/FE-AGENT). Redesign BUKAN bagian tahap ini kecuali Boss minta. Karena itu `/design` dan `DESIGN.md` dibuat sekarang tapi berbasis token, agar redesign cukup mengubah nilai token.
3. **Tahap B (migrasi token) TAMPILAN TIDAK boleh berubah** (bukti: tangkapan layar 1366px dan 390px identik, CSS hasil build identik). Penyatuan green/emerald, `--primary` shadcn, dan nilai lain = keputusan nilai token saat redesign; penyimpangan lama dicatat di DESIGN.md.
4. `/design` hanya dapat dibuka **superadmin (akun "peneliti") di produksi**; bebas di mode pengembangan (`NODE_ENV !== 'production'`).
5. Folder gambar: `docs/design-reference/` (17 gambar Akuris, Okt 2026) = ACUAN BARU untuk redesign, JANGAN disentuh; DESIGN.md menambah bagian "Referensi" yang menyebutnya (lihat dulu sebelum mendesain). `docs/ui-design-reference/` (referensi lama Mei 2026) SUDAH dihapus; pulihkan bila perlu: `git checkout 9938725 -- docs/ui-design-reference`. Rujukannya sudah dibersihkan di T-D1.
6. P1 green/emerald/gray-800 tidak diseragamkan (dicatat) · P2 tautan DESIGN.md berupa teks jalur · P3 tanpa menu Sidebar untuk /design · P4 hex grafik/PDF usulan terpisah · P5 `prefers-reduced-motion` penuh usulan terpisah · P6 `--primary` shadcn (blue-700) tidak diselaraskan · P7 hapus `docs/07-ui-guidelines.md`.

## Urutan kerja (satu langkah per panggilan)
T-D0 lanjutan → T-D2 → Tahap B (T-D5a..g) → T-D1 → T-D3 → T-D4 → Tessa uji terarah.
1. **T-D0 lanjutan:** lengkapi 9 halaman sisa (barang-masuk, barang-keluar, laporan, supplier, users, pengaturan, monitoring, reorder, /rute-tidak-ada) + dialog AC-DS-15, `hash.txt`, `cacahan.txt`, README skrip, uji determinisme.
2. **T-D2:** blok `@theme inline` di `simo/app/globals.css` tanpa mengganti pemakaian. Bukti wajib: (a) alias ter-resolve identik di Tailwind 4.3.0 (CSS hasil build identik); (b) `tailwind-merge` 2.6.1 mengenali `bg-brand-*` satu grup dengan warna lama lewat `cn()` (AC-DS-14). Jika (a) gagal, pakai cadangan literal oklch/`@theme static` (spec 3.2).
3. **Tahap B:** migrasi nama kelas dengan SKRIP mekanis (bukan diketik agent; 2.522 kemunculan di 85 berkas, 0 kelas dinamis), dibagi per kelompok berkas, tiap kelompok diverifikasi tangkapan layar.
4. **T-D1:** `docs/DESIGN.md`, ringkas FE-AGENT jadi penunjuk (pertahankan aturan wajib spec 5.3), hapus 07-ui-guidelines.md, perbarui rujukan (02-folder-structure.md, README.md, PLAN.md, spec 4.1/5.4), bagian "Referensi".
5. **T-D3:** rapikan `/design` yang sudah ada: tambah Motion dan Progres, perbaiki radius (lg 10px, xl 14px) dan teks usang, swatch berbasis token.
6. **T-D4:** akses superadmin (`SuperadminOnly.tsx`, `middleware.ts`, `app/design/layout.tsx`). T-D3 dan T-D4 BERURUTAN (sama-sama menyentuh `app/design/layout.tsx`).
7. **Tessa** uji terarah: AC-DS-2, 10, 11, 12, 14 + tampilan identik.

## Cara kerja (wajib, belajar dari kegagalan sesi lalu)
- Satu langkah per panggilan; jangan serahkan beberapa tugas sekaligus.
- Panggil **dev-frontend langsung dari sesi utama, foreground**, agar izin yang diperlukan terlihat Boss. Kiri hanya untuk review dan serah terima.
- Bila agent tidak menghasilkan berkas atau laporan dalam sekitar 5 menit, tanyakan statusnya. Jangan menunggu diam; **jangan hentikan agent tanpa izin eksplisit Boss**.
- Setelah tiap langkah: `git status --short`, laporkan ke Boss yang berubah, lalu lanjut.
- Empat kepala divisi (kiri, niki, sylpha, tessa) sudah punya "Aturan buntu": wajib lapor segera bila ditolak/tertunda.
- Gagal atau tertolak = lapor apa adanya saat itu juga.

## Hal teknis yang perlu diingat
- Frontend di folder `simo/` dari root repo (path lengkap `D:\skripsi new\simo\simo`; semua jalur `simo/...` di dokumen ini relatif ke root repo), Tailwind 4.3.0, Next 16.2.6 (jangan dinaikkan di Windows: diblokir Application Control).
- Uji tampilan memakai puppeteer-core + Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) dengan data mock di folder uji luar repo (`D:\skripsi new\uji-design\`).
- `/design` ada di luar grup `(dashboard)`, jadi guard klien harus memanggil `hydrate()` sendiri; `middleware.ts` hanya mengecek keberadaan cookie, bukan role (guard klien bukan keamanan kuat tapi isi /design statis dan tidak sensitif).
- Commit Conventional Commits TANPA trailer Co-Authored-By. Merge/push hanya atas izin Boss.
