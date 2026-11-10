# PLAN: tahap Design System (jalur SEDANG)

- Tanggal: 2026-11-10 | Branch: `refactor/design-system` | Pemilik: Niki
- Sumber: docs/pm/HANDOFF-DESIGN.md, docs/spec/design-system.md (v1.0, 16 AC)
- Cakupan sekarang: TAHAP A (T-D0..T-D4). Tahap B (T-D5, T-D6) belum dimulai, menunggu Tahap A lolos Tessa dan AC-DS-14 terbukti.

| ID | Judul | Pengerja | Status |
|----|-------|----------|--------|
| T-D0 | Garis dasar (cacahan, tangkapan layar, lint/tsc/build) | dev-frontend | SEDANG/terputus (10 Nov): lint 16 error + 9 warning (lama), tsc EXIT=0, build EXIT=0 tercatat; tangkapan baru 5 dari 14 halaman (login, dashboard, obat, obat-tambah, obat-detail; 1366 dan 390, 3x). Bukti: D:\skripsi new\uji-design\ (log-*.txt, cacahan.js, skrip-tangkap.js, sebelum\). Belum: barang-masuk/keluar, laporan, supplier, users, pengaturan, monitoring, reorder, 404, hash.txt, cacahan.txt, README skrip, uji determinisme |
| T-D1 | docs/DESIGN.md | dev-frontend | belum |
| T-D2 | Token `@theme inline` + bukti (a)(b) | dev-frontend | belum |
| T-D3 | Halaman /design (Motion, Progres) | dev-frontend | belum |
| T-D4 | Akses superadmin (SuperadminOnly, middleware) | dev-frontend | belum |
| T-D5a..g, T-D6 | Migrasi token, dokumen akhir | dev-frontend | TAHAP B, belum dimulai |

## Jejak gerbang
| Gerbang | Status | Bukti |
|---------|--------|-------|
| 1 (PRD) | lewat (jalur Sedang; keputusan Boss final di HANDOFF) | docs/pm/HANDOFF-DESIGN.md, Boss 2026-11-10 |
| 2 (spesifikasi/AC) | lewat | docs/spec/design-system.md (16 AC), Sylpha |
| 3 (build+lint Kiri) | belum | |
| 4 (Tessa, AC-DS-2,10,11,12,14 + tampilan identik) | belum | |

Catatan: PLAN.md utama tidak diubah sesi ini; pm-tracker dapat menggabungkan berkas ini ke PLAN.md nanti.
