-- Migration 002: Create supplier table

CREATE TABLE IF NOT EXISTS supplier (
    id              SERIAL PRIMARY KEY,
    nama            VARCHAR(100) NOT NULL,
    alamat          TEXT,
    telepon         VARCHAR(20),
    whatsapp        VARCHAR(20),
    jenis_obat      TEXT,
    lead_time_avg   INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_nama ON supplier(nama);
