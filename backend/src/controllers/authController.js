const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, username, nama, role, password FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, nama: user.nama, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, nama: user.nama, role: user.role },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function logout(req, res) {
  // JWT stateless — token dihapus di sisi frontend
  return res.json({ success: true, message: 'Berhasil logout' });
}

async function me(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, nama, role FROM users WHERE id = $1 AND is_active = true',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { login, logout, me };
