-- Migration 007: Create pengaturan table
-- Tabel key-value untuk konfigurasi sistem (standalone, tidak bergantung tabel lain)

CREATE TABLE IF NOT EXISTS pengaturan (
    id          SERIAL PRIMARY KEY,
    key         VARCHAR(50) UNIQUE NOT NULL,
    value       TEXT NOT NULL,
    deskripsi   TEXT,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pengaturan_key ON pengaturan(key);
