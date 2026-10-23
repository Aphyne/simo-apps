-- Migration 016: Seed pengaturan Asumsi Dus Tradisional
-- Q tradisional (skenario sebelum EOQ) dihitung dari asumsi tetap ini × satuan_per_dus,
-- bukan otomatis 1 dus lagi. Lihat docs/08-development-roadmap.md — Fase 6, "Revisi Q Tradisional"
-- untuk alasan lengkap kenapa ini asumsi tetap (bisa diubah admin), bukan dihitung dari data historis.

INSERT INTO pengaturan (key, value, deskripsi) VALUES
('asumsi_dus_tradisional', '2', 'Asumsi jumlah dus per pemesanan untuk skenario tradisional (sebelum EOQ) di Analisis Komparatif — bisa diubah admin, default 2 dus')
ON CONFLICT (key) DO UPDATE SET
    value      = EXCLUDED.value,
    deskripsi  = EXCLUDED.deskripsi,
    updated_at = NOW();
