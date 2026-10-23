-- Migration 015: Tambah ppn_pct ke barang_masuk
-- Diskon % sengaja belum ditambahkan — posisinya (level faktur vs per-obat)
-- masih belum diputuskan, lihat Fase 15 di docs/08-development-roadmap.md

ALTER TABLE barang_masuk
  ADD COLUMN IF NOT EXISTS ppn_pct DECIMAL(5, 2) DEFAULT 0;
