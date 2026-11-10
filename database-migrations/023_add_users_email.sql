-- Migration 023 — kolom users.email (dipakai login Google & halaman Pengguna)
--
-- Kolom ini sudah dipakai kode (authController.googleLogin, userController) dan sudah ada di
-- database production (dengan constraint unik users_email_key), tetapi tidak pernah dibuat oleh
-- migrasi mana pun. Akibatnya database yang dibangun ulang dari file migrasi akan error saat
-- login Google / membuka halaman Pengguna (temuan QA H-7).
--
-- Idempoten: di production (kolom sudah ada) tidak melakukan apa-apa; di database baru
-- membuat kolom beserta constraint unik yang sama dengan production.
-- Terapkan manual (jangan `migrate up`, tracker migrasi tidak sinkron).

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
