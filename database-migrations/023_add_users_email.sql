-- Migration 023 — kolom users.email (dipakai login Google & halaman Pengguna)
--
-- Kolom ini sudah dipakai kode (authController.googleLogin, userController) dan sudah ada di
-- database production, tetapi tidak pernah dibuat oleh migrasi mana pun. Akibatnya database yang
-- dibangun ulang dari file migrasi akan error saat login Google / membuka halaman Pengguna
-- (temuan QA H-7). Migrasi ini idempoten: aman dijalankan di database yang kolomnya sudah ada.
--
-- Terapkan manual (jangan `migrate up`, lihat catatan tracker tidak sinkron).

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- UNIQUE lewat indeks agar tidak bentrok kalau constraint serupa sudah ada di production.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (email) WHERE email IS NOT NULL;
