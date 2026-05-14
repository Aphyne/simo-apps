-- Seed 008: Data awal user
-- Password yang di-hash di sini adalah bcrypt dari string 'password'
-- Hash ini valid untuk bcrypt cost factor 12
-- PENTING: Setelah sistem berjalan, segera ganti password via fitur manajemen user

INSERT INTO users (username, password, nama, role, is_active) VALUES
(
    'admin',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Admin Apotek Rezky Medika',
    'admin',
    TRUE
),
(
    'staf1',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Staf Apotek',
    'staf',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Akun default:
-- Username: admin   | Password: password | Role: admin
-- Username: staf1   | Password: password | Role: staf
