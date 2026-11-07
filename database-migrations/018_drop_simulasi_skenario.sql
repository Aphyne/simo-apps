-- Migration 018: Hapus tabel simulasi_skenario
-- Fitur Simulasi Skenario sudah dinonaktifkan (menu Sidebar dikomentari,
-- lihat components/layout/Sidebar.tsx) dan tidak dipakai lagi di sistem.
-- Kode frontend/backend terkait (app/(dashboard)/simulasi, hooks/useSimulasi.ts,
-- backend/src/controllers/simulasiController.js, backend/src/routes/simulasi.js)
-- masih ada di repo tapi tidak lagi terjangkau lewat navigasi normal.

DROP TABLE IF EXISTS simulasi_skenario;
