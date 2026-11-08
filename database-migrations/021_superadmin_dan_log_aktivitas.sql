-- Migration 021: Role superadmin + log aktivitas pengguna
-- Untuk keperluan penelitian (skripsi): peneliti (superadmin) dapat memantau kapan
-- pengguna login, halaman apa yang dibuka, dan aksi data apa yang dilakukan.
-- Akun superadmin tidak muncul di daftar Manajemen User dan tidak dicatat aktivitasnya.
-- Idempotent: aman dijalankan ulang.

-- 1. Izinkan role 'superadmin' (10 karakter, muat di VARCHAR(10))
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'staf', 'superadmin'));

-- 2. Penanda terakhir aktif (diperbarui oleh heartbeat dari browser)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

-- 3. Tabel log aktivitas. username/nama/role disalin (denormalisasi) supaya riwayat
--    tetap terbaca walau user dihapus. TIDAK menyimpan isi data transaksi/body request.
CREATE TABLE IF NOT EXISTS log_aktivitas (
    id          BIGSERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username    VARCHAR(50),
    nama        VARCHAR(100),
    role        VARCHAR(10),
    jenis       VARCHAR(15) NOT NULL
                CHECK (jenis IN ('login', 'login_gagal', 'logout', 'halaman', 'aksi')),
    deskripsi   TEXT,
    path        VARCHAR(255),
    metode      VARCHAR(10),
    status_http SMALLINT,
    ip          VARCHAR(64),
    user_agent  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_aktivitas_waktu ON log_aktivitas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_aktivitas_user ON log_aktivitas(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_aktivitas_jenis ON log_aktivitas(jenis);
