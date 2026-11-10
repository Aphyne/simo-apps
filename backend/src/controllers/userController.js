const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { hapusCacheUser, cabutTokenUser } = require('../middleware/authMiddleware');
const { balasHttpError } = require('../utils/validasi');

const PASSWORD_MIN = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/users
async function getUsers(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.username, u.nama, u.email, u.role, u.is_active, u.created_at,
             (SELECT COUNT(*) FROM barang_masuk WHERE user_id = u.id) +
             (SELECT COUNT(*) FROM barang_keluar WHERE user_id = u.id) AS jumlah_transaksi
      FROM users u
      WHERE u.role <> 'superadmin'
      ORDER BY u.role ASC, u.nama ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('users.get:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// POST /api/users
async function createUser(req, res) {
  const { username, password, nama, role, email } = req.body;
  if (!username || !password || !nama || !role) {
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
  }
  if (!['admin', 'staf'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role tidak valid' });
  }
  if (typeof username !== 'string' || typeof password !== 'string' || typeof nama !== 'string') {
    return res.status(400).json({ success: false, message: 'Data tidak valid' });
  }
  if (password.length < PASSWORD_MIN) {
    return res.status(400).json({ success: false, message: `Password minimal ${PASSWORD_MIN} karakter` });
  }
  if (password.toLowerCase() === username.toLowerCase()) {
    return res.status(400).json({ success: false, message: 'Password tidak boleh sama dengan username' });
  }
  if (email && (typeof email !== 'string' || !EMAIL_RE.test(email))) {
    return res.status(400).json({ success: false, message: 'Format email tidak valid' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password, nama, role, email) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, nama, email, role, is_active, created_at',
      [username, hashed, nama, role, email || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Username atau email sudah digunakan' });
    }
    if (balasHttpError(err, res)) return;
    console.error('users.create:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// PUT /api/users/:id
async function updateUser(req, res) {
  const { id } = req.params;
  const { nama, role, is_active, email } = req.body;
  if (!nama || !role) {
    return res.status(400).json({ success: false, message: 'Nama dan role wajib diisi' });
  }
  if (!['admin', 'staf'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role tidak valid' });
  }
  if (is_active !== undefined && typeof is_active !== 'boolean') {
    return res.status(400).json({ success: false, message: 'is_active harus true atau false' });
  }
  if (typeof nama !== 'string' || (email && (typeof email !== 'string' || !EMAIL_RE.test(email)))) {
    return res.status(400).json({ success: false, message: 'Nama atau email tidak valid' });
  }
  const diriSendiri = req.user.id === parseInt(id);
  if (diriSendiri && is_active === false) {
    return res.status(400).json({ success: false, message: 'Tidak bisa menonaktifkan akun sendiri' });
  }
  if (diriSendiri && role !== req.user.role) {
    return res.status(400).json({ success: false, message: 'Tidak bisa mengubah role akun sendiri' });
  }
  try {
    // is_active tidak dikirim → status lama dipertahankan (sebelumnya otomatis jadi aktif lagi
    // sehingga akun nonaktif bisa hidup kembali hanya karena nama diedit — temuan QA AUTH-08).
    const { rows } = await pool.query(
      `UPDATE users SET nama=$1, role=$2, is_active=COALESCE($3::boolean, is_active), email=$4, updated_at=NOW()
       WHERE id=$5 AND role <> 'superadmin' RETURNING id, username, nama, email, role, is_active, created_at`,
      [nama, role, is_active === undefined ? null : is_active, email || null, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    hapusCacheUser(id);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    if (balasHttpError(err, res)) return;
    console.error('users.update:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// POST /api/users/:id/reset-password
async function resetPassword(req, res) {
  const { id } = req.params;
  const { password_baru } = req.body;
  if (typeof password_baru !== 'string' || password_baru.length < PASSWORD_MIN) {
    return res.status(400).json({ success: false, message: `Password baru minimal ${PASSWORD_MIN} karakter` });
  }
  try {
    const hashed = await bcrypt.hash(password_baru, 10);
    const { rowCount } = await pool.query(
      "UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2 AND role <> 'superadmin'",
      [hashed, id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    cabutTokenUser(id); // sesi lama user ini tidak berlaku lagi setelah password diganti
    res.json({ success: true, message: 'Password berhasil direset' });
  } catch (err) {
    console.error('users.resetPassword:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// PATCH /api/users/:id/toggle-aktif — toggle is_active
async function toggleAktif(req, res) {
  const { id } = req.params;
  if (req.user.id === parseInt(id)) {
    return res.status(400).json({ success: false, message: 'Tidak bisa mengubah status akun sendiri' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at=NOW()
       WHERE id=$1 AND role <> 'superadmin' RETURNING id, username, nama, role, is_active, created_at`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    hapusCacheUser(id);
    const status = rows[0].is_active ? 'diaktifkan' : 'dinonaktifkan';
    res.json({ success: true, data: rows[0], message: `User berhasil ${status}` });
  } catch (err) {
    console.error('users.toggleAktif:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// DELETE /api/users/:id — hard delete, hanya jika belum ada transaksi
async function deleteUser(req, res) {
  const { id } = req.params;
  if (req.user.id === parseInt(id)) {
    return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri' });
  }
  try {
    const { rows } = await pool.query("SELECT id, nama FROM users WHERE id=$1 AND role <> 'superadmin'", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    // Cek transaksi
    const { rows: cek } = await pool.query(`
      SELECT (SELECT COUNT(*) FROM barang_masuk WHERE user_id=$1) +
             (SELECT COUNT(*) FROM barang_keluar WHERE user_id=$1) AS total
    `, [id]);
    if (parseInt(cek[0].total) > 0) {
      return res.status(400).json({ success: false, message: 'User sudah memiliki transaksi, hanya bisa dinonaktifkan' });
    }
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
    hapusCacheUser(id);
    res.json({ success: true, message: `Akun "${rows[0].nama}" berhasil dihapus permanen` });
  } catch (err) {
    console.error('users.delete:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getUsers, createUser, updateUser, resetPassword, toggleAktif, deleteUser };
