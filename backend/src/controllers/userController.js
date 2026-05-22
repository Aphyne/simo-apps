const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

// GET /api/users
async function getUsers(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.username, u.nama, u.role, u.is_active, u.created_at,
             (SELECT COUNT(*) FROM barang_masuk WHERE user_id = u.id) +
             (SELECT COUNT(*) FROM barang_keluar WHERE user_id = u.id) AS jumlah_transaksi
      FROM users u
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
  const { username, password, nama, role } = req.body;
  if (!username || !password || !nama || !role) {
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
  }
  if (!['admin', 'staf'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role tidak valid' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password, nama, role) VALUES ($1, $2, $3, $4) RETURNING id, username, nama, role, is_active, created_at',
      [username, hashed, nama, role]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
    }
    console.error('users.create:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// PUT /api/users/:id
async function updateUser(req, res) {
  const { id } = req.params;
  const { nama, role, is_active } = req.body;
  if (!nama || !role) {
    return res.status(400).json({ success: false, message: 'Nama dan role wajib diisi' });
  }
  if (!['admin', 'staf'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role tidak valid' });
  }
  // Tidak boleh non-aktifkan diri sendiri
  if (req.user.id === parseInt(id) && is_active === false) {
    return res.status(400).json({ success: false, message: 'Tidak bisa menonaktifkan akun sendiri' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE users SET nama=$1, role=$2, is_active=$3, updated_at=NOW()
       WHERE id=$4 RETURNING id, username, nama, role, is_active, created_at`,
      [nama, role, is_active ?? true, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('users.update:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// POST /api/users/:id/reset-password
async function resetPassword(req, res) {
  const { id } = req.params;
  const { password_baru } = req.body;
  if (!password_baru || password_baru.length < 6) {
    return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
  }
  try {
    const hashed = await bcrypt.hash(password_baru, 10);
    const { rowCount } = await pool.query(
      'UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2',
      [hashed, id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
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
       WHERE id=$1 RETURNING id, username, nama, role, is_active, created_at`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
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
    const { rows } = await pool.query('SELECT id, nama FROM users WHERE id=$1', [id]);
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
    res.json({ success: true, message: `Akun "${rows[0].nama}" berhasil dihapus permanen` });
  } catch (err) {
    console.error('users.delete:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getUsers, createUser, updateUser, resetPassword, toggleAktif, deleteUser };
