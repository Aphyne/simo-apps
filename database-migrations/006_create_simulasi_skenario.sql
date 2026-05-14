-- Migration 006: Create simulasi_skenario table
-- Bergantung pada: 001_create_users.sql, 003_create_obat.sql

CREATE TABLE IF NOT EXISTS simulasi_skenario (
    id                  SERIAL PRIMARY KEY,
    obat_id             INTEGER NOT NULL REFERENCES obat(id) ON DELETE CASCADE,
    nama_skenario       VARCHAR(100),
    -- JSONB: { demand_perubahan_pct, demand_nilai_baru, lead_time_baru, biaya_simpan_baru, biaya_pesan_baru }
    parameter_input     JSONB NOT NULL DEFAULT '{}',
    -- JSONB: { nilai_sekarang: {...}, nilai_simulasi: {...}, selisih: {...} }
    hasil_simulasi      JSONB NOT NULL DEFAULT '{}',
    user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulasi_obat ON simulasi_skenario(obat_id);
CREATE INDEX IF NOT EXISTS idx_simulasi_user ON simulasi_skenario(user_id);
CREATE INDEX IF NOT EXISTS idx_simulasi_created ON simulasi_skenario(created_at DESC);
