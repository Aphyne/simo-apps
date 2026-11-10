const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../db/pool');
const { catat } = require('../services/aktivitasService');
const { cabutTokenUser } = require('../middleware/authMiddleware');

// Hash tiruan (cost 10, sama dengan hash password asli) agar waktu respons login tetap sama
// walaupun username tidak ditemukan.
const HASH_TIRUAN = bcrypt.hashSync('tiruan-waktu-login', 10);

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      await bcrypt.compare(password, HASH_TIRUAN);
      await catat({ req, jenis: 'login_gagal', username, deskripsi: 'Login gagal (username tidak ditemukan/nonaktif)', status: 401 });
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await catat({ req, user, jenis: 'login_gagal', deskripsi: 'Login gagal (password salah)', status: 401 });
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, nama: user.nama, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await catat({ req, user, jenis: 'login', deskripsi: 'Login dengan username & password', status: 200 });

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
  // Token yang dipakai sampai saat ini dicabut di server (selain dihapus di sisi frontend).
  cabutTokenUser(req.user.id);
  await catat({ req, user: req.user, jenis: 'logout', deskripsi: 'Logout', status: 200 });
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

async function googleLogin(req, res) {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Token Google tidak ditemukan' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email tidak ditemukan dari akun Google' });
    }

    // Email Google yang belum terverifikasi tidak boleh dipakai login (cegah pengambilalihan akun).
    if (payload.email_verified !== true && payload.email_verified !== 'true') {
      await catat({ req, jenis: 'login_gagal', username: email, deskripsi: 'Login Google gagal (email belum terverifikasi)', status: 401 });
      return res.status(401).json({ success: false, message: 'Email Google belum terverifikasi' });
    }

    const { rows } = await pool.query(
      'SELECT id, username, nama, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Akun Google ini tidak terdaftar di sistem. Hubungi admin.' });
    }

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, nama: user.nama, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await catat({ req, user, jenis: 'login', deskripsi: 'Login dengan akun Google', status: 200 });

    return res.json({
      success: true,
      data: { token, user: { id: user.id, username: user.username, nama: user.nama, role: user.role } },
    });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(401).json({ success: false, message: 'Verifikasi Google gagal' });
  }
}

module.exports = { login, logout, me, googleLogin };
