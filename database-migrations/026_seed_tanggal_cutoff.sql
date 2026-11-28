-- Migration 026: Seed pengaturan Tanggal Cut-off data permintaan (keputusan Boss 28 Nov 2026)
-- Jendela data permintaan (d, sigma, D) = dari yang paling akhir di antara tanggal cut-off dan
-- (hari ini - 364 hari) sampai hari ini. Penjualan sebelum cut-off tidak ikut dihitung.
-- Nilai kosong = belum diisi admin -> dipakai 365 hari terakhir. Isi lewat menu Pengaturan.
-- DO NOTHING: menjalankan ulang migrasi ini tidak menimpa tanggal yang sudah diisi admin.

INSERT INTO pengaturan (key, value, deskripsi) VALUES
('tanggal_cutoff', '', 'Tanggal cut-off data permintaan (YYYY-MM-DD). Penjualan sebelum tanggal ini tidak dihitung untuk EOQ/ROP')
ON CONFLICT (key) DO NOTHING;
