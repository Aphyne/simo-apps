# Audit kode mati frontend (Fase C1, 10 Nov 2026)

Alat: knip 5 (tanpa dipasang ke proyek) + pemeriksaan rujukan manual (grep kode, docs, aset). Cakupan: `simo/` (frontend). Backend, migrasi, dan `.env` tidak diaudit (Fase C4, usulan terpisah). Tidak ada berkas yang dihapus atau diubah oleh audit ini.

## Tingkat 1: pasti tak terpakai (usul dihapus setelah Boss setuju)
| Item | Bukti |
|------|-------|
| `simo/public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Sisa bawaan create-next-app; 0 rujukan di kode/CSS/konfigurasi |
| `components/dashboard/ReorderTable.tsx` | 0 impor (hanya disebut di docs 02, 05, 08) |
| `store/notification.store.ts` | 0 impor (hanya disebut di docs 02, 05, 08) |
| Dependensi `zod` | 0 impor `zod` atau `@hookform/resolvers` di seluruh `simo/` |
| Dev-dependensi `@types/jspdf` | `jspdf` membawa tipe sendiri (`types/index.d.ts`) |
| Hook `useCreateBarangMasuk`, `useCreateBarangKeluar` | 0 pemanggil; form memakai versi `...Bulk` |

## Tingkat 2: mungkin; butuh keputusan Boss satu per satu
| Item | Catatan |
|------|---------|
| `components/dashboard/PerbandinganBiayaChart.tsx` + hook `usePerbandinganBiaya` | Grafik biaya EOQ vs tanpa EOQ: inti analisis skripsi, endpoint backend `/dashboard/perbandingan-biaya` masih ada. Tidak dipasang di dashboard sekarang. Jangan hapus tanpa konfirmasi |
| `components/simulasi/SimulasiChart.tsx` + hook `useJalankanSimulasi` | Fitur Simulasi sengaja dinonaktifkan di Sidebar (cukup 1 tangkapan layar untuk lampiran laporan) |
| `lib/utils.ts`: `generateKodeObat`, `formatTanggalInput`; `lib/reorder.ts`: `buatLinkWa`; `lib/constants.ts`: `KETERANGAN_KELUAR`, `STATUS_STOK`, `STATUS_LABEL` | Ekspor tak terpakai; kecil, bisa dibuang atau disimpan |

## Tingkat 3: dipertahankan (bukan sampah)
- `components/ui/card.tsx`, `table.tsx`, `separator.tsx`: primitif shadcn yang tidak dipakai sekarang, tapi dibutuhkan Fase D (komponen bersama).
- Ekspor shadcn yang tidak terpakai (dialog, dropdown, select, badge/button variants): permukaan API pustaka, tidak perlu dipangkas.
- 11 tipe TypeScript yang tidak dipakai: tidak berdampak ke build.

## Hasil pelaksanaan (C2 dan C3, 10 Nov 2026)
Keputusan Boss: grafik Perbandingan Biaya (`PerbandinganBiayaChart`, `usePerbandinganBiaya`) dan seluruh kode analisis komparatif DIPERTAHANKAN karena akan dilampirkan di skripsi (perbandingan sebelum dan sesudah sistem); sisanya boleh dibersihkan. Dihapus dalam commit terpisah (satu kelompok per commit): 5 aset `public/`, `ReorderTable`, `notification.store`, `SimulasiChart`, hook `useCreateBarangMasuk/Keluar` dan `useJalankanSimulasi`, `formatTanggalInput`, `generateKodeObat`, `KETERANGAN_KELUAR`, `STATUS_STOK`, `STATUS_LABEL`, dependensi `zod` dan `@types/jspdf`. Dikecualikan dari penghapusan karena ternyata dipakai: `buatLinkWa` (dipakai di dalam `lib/reorder.ts`). Dipertahankan: tingkat 3. Impor `alert-dialog` dirapikan ke paket `radix-ui`. Cek: `tsc` 0 error; lint tetap 16 error + 9 warning (baseline).

## Temuan lain (bukan penghapusan)
- `components/ui/alert-dialog.tsx` mengimpor `@radix-ui/react-alert-dialog` yang tidak terdaftar di `package.json`; berjalan karena terpasang lewat paket `radix-ui`. Sebaiknya diimpor dari `radix-ui` agar tidak rapuh (perubahan kecil, terpisah dari pembersihan).
- `postcss` dirujuk `postcss.config.mjs` tanpa terdaftar (aman: dibawa `@tailwindcss/postcss`).
- Dokumen `docs/02-folder-structure.md`, `05-frontend-routes.md`, `08-development-roadmap.md` masih menyebut berkas tingkat 1; rujukannya diperbarui bila berkas dihapus.
- Folder berkas terlacak git yang bukan kode (`tsbuildinfo`, `.next`): tidak ada.
