# Serah terima: tahap Design System (dibuat 10 Nov 2026)

Dibaca pertama oleh sesi baru. Tujuan sesi baru: **mengerjakan tahap Design System** dengan tim agent (niki → kiri → staf dev, lalu tessa). Konteks sesi lama terlalu panjang, jadi mulai dari sini.

## Posisi
- Branch kerja: `refactor/design-system` (dari `main`, belum di-merge/push). Isi saat ini: `CLAUDE.md` (aturan tim + jalur), `docs/spec/design-system.md` (spesifikasi Sylpha v1.0, 503 baris, 16 AC), berkas ini. **Belum ada kode yang diubah.**
- `main` = hasil audit QA + persiapan hosting, sudah di GitHub (`ea43fd8`). Sisa urusan non-desain milik Boss ada di CLAUDE.md.

## Keputusan Boss (final)
1. Tujuan: SATU sumber desain terstruktur seperti "Akuris Design System" milik teman Boss (gambar di `docs/design-reference/`): satu halaman `/design` + satu dokumen `docs/DESIGN.md` + token semantik yang benar-benar dipakai (ubah `globals.css` → seluruh aplikasi ikut).
2. Tingkat 1 (dokumen/halaman) DAN tingkat 2 (token semantik) dikerjakan. **Tampilan TIDAK boleh berubah sedikit pun** (bukti: tangkapan layar byte-identik 1366px dan 390px, CSS hasil build identik).
3. `/design` hanya dapat dibuka **superadmin (akun "peneliti") di produksi**; terbuka bebas di mode pengembangan (`NODE_ENV !== 'production'`).
4. Pakai agent: niki, sylpha, kiri, tessa (dan staf). Hemat token: jalur Sedang (sylpha sudah selesai; jangan dipanggil lagi kecuali spesifikasi perlu revisi).

## Pertanyaan terbuka Sylpha: sudah diputuskan Niki (menerima rekomendasi; Boss boleh menimpa)
P1 green/emerald/gray-800 TIDAK diseragamkan (mengubah piksel; dicatat sebagai penyimpangan di DESIGN.md) · P2 tautan ke DESIGN.md berupa teks jalur · P3 tanpa menu Sidebar untuk /design · P4 hex grafik/PDF jadi usulan terpisah nanti · P5 `prefers-reduced-motion` penuh = usulan terpisah · P6 `--primary` shadcn (blue-700) TIDAK diselaraskan (mengubah piksel; dicatat) · P7 hapus `docs/07-ui-guidelines.md` (usang).

## Langkah pertama sesi baru
1. Baca `CLAUDE.md`, lalu bagian 1, 3, 7, 8 dari `docs/spec/design-system.md` (inventaris/token/AC/tugas).
2. Panggil **niki** (jalur Sedang) dengan cakupan **Tahap A**: T-D0, T-D1, T-D2, T-D3, T-D4 (siapkan, dokumen, bukti token, halaman /design, akses). Niki menerbitkan surat tugas ke **kiri**; kiri memanggil **dev-frontend** BERURUTAN (T-D3 lalu T-D4 sama-sama menyentuh `app/design/layout.tsx`). Setelah itu **tessa** menguji terarah (AC-DS-2, 10, 11, 12, 14 + tampilan identik).
3. **Tahap B** (migrasi token T-D5a..g, lalu T-D6 dokumen akhir/folder gambar) hanya setelah Tahap A lolos uji Tessa dan AC-DS-14 terbukti.
4. Dua hal yang WAJIB dibuktikan di T-D2 sebelum migrasi massal: (a) alias `@theme inline` ter-resolve identik di Tailwind 4.3.0, (b) `tailwind-merge` 2.6.1 mengenali `bg-brand-*` sebagai satu grup dengan warna lama (pengaman `cn()`).
5. Migrasi nama kelas dilakukan dengan SKRIP mekanis (bukan diketik agent), diverifikasi tangkapan layar; inventaris: 2.522 kemunculan kelas warna di 85 berkas, 0 kelas dinamis.
6. Isi 4 gambar `docs/ui-design-reference/` belum diperiksa; periksa sebelum dipindah ke `docs/design-reference/simo-mockup/`.

## Hal teknis yang perlu diingat
- Frontend di `simo/simo` (bukan `simo/`), Tailwind 4.3.0, Next 16.2.6 (jangan dinaikkan di Windows: diblokir Application Control).
- Uji tampilan memakai puppeteer-core + Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) dengan data mock di folder uji luar repo; contoh skrip: `qa-tools/` dan scratchpad sesi lama (`uji-fe/`) mungkin sudah hilang — bila perlu tulis ulang di `qa-tools/`.
- `/design` ada di luar grup `(dashboard)`, jadi guard klien harus memanggil `hydrate()` sendiri; `middleware.ts` hanya mengecek keberadaan cookie, bukan role (guard klien bukan keamanan kuat tapi isi /design statis dan tidak sensitif).
- Commit Conventional Commits TANPA trailer Co-Authored-By. Merge/push hanya atas izin Boss.
