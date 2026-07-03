-- Migration 014: Pindahkan biaya_pesan dan lead_time ke tabel supplier
-- lead_time_avg sudah ada di supplier sejak migration 002
-- Tambahkan biaya_pesan ke supplier

ALTER TABLE supplier
  ADD COLUMN IF NOT EXISTS biaya_pesan NUMERIC(12,2) NOT NULL DEFAULT 0;
