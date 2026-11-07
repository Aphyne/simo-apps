-- Migration 019: Ubah default_lead_time dari 3 menjadi 1 hari
-- Dipakai sebagai nilai awal di halaman Pengaturan dan fallback lead time
-- untuk obat yang belum diisi lead time-nya sendiri.

UPDATE pengaturan
SET value = '1',
    updated_at = NOW()
WHERE key = 'default_lead_time';
