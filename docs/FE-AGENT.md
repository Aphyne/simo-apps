# FE-AGENT — Penunjuk Design System SIMO

Design system SIMO sekarang **satu sumber**: `docs/DESIGN.md` (nama token, peran, aturan, penyimpangan, progres). Nilai warna hanya ada di `simo/app/globals.css`. Halaman `/design` (jalur `simo/app/design/`) memperlihatkannya secara visual. **Baca `docs/DESIGN.md` seluruhnya sebelum menyentuh UI.** Referensi visual redesign: `docs/design-reference/`.

> Backend sudah fix. Jangan ubah logic, hooks, data fetching, API calls, validasi, atau types. Hanya tampilan (JSX + kelas).

## Aturan wajib (ringkasan; rincian di DESIGN.md)
1. Baca `docs/DESIGN.md` penuh, lalu file halaman target (page.tsx + komponen terkait).
2. Jangan ubah logic, hooks, fetch, API, validasi, types.
3. Dilarang memakai skill atau desain eksternal tanpa izin eksplisit Boss. (Izin redesign total oleh Boss nanti: `ui-ux-pro-max` dan `hallmark`, wajib memakai token dan membaca DESIGN.md dan berkas ini.)
4. Implementasi bertahap: satu halaman selesai dan di-acc Boss, baru lanjut; perbarui Progres di DESIGN.md bagian 6.
5. Warna memakai **kelas token** (`brand/danger/success/warning`, `fg*`, `surface*`, `line*`). Tanpa hex, tanpa kelas warna lama di kode baru. Butuh warna baru: tambah token di `globals.css` dulu.
6. WCAG 2.1 AA: teks yang dibaca rasio >= 4,5:1 (tabel di DESIGN.md 2.2); `fg-subtle` (gray-400) hanya untuk ikon. Hitung rasio untuk warna teks baru.
7. Kartu/panel putih, latar halaman abu sangat muda, warna aksen hanya pada ikon/badge/status. Font Inter.
8. Paginasi memakai helper `getPageNumbers` yang sudah ada; format angka/tanggal memakai helper di `simo/lib/utils.ts`.
9. Dua kelas warna untuk utilitas yang sama pada satu elemen = wajib cek urutan kaskade (DESIGN.md bagian 4).
10. Jaga konsistensi dengan halaman yang sudah selesai; pakai ulang komponen sebelum membuat baru. Lapor yang tidak diuji di browser apa adanya.
