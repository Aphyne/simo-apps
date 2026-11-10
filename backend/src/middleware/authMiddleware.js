const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Token JWT stateless saja tidak cukup: akun yang sudah dinonaktifkan / dihapus / diturunkan
// rolenya, atau token setelah logout, tetap akan diterima sampai kedaluwarsa (temuan QA AUTH-01).
// Karena itu setiap request dicocokkan dengan database. Hasilnya di-cache sebentar supaya
// tidak menambah satu query per request; cache dibuang langsung saat akun diubah (lihat
// hapusCacheUser) sehingga perubahan berlaku seketika di proses ini.
const CACHE_MS = 15 * 1000;
const cacheUser = new Map(); // id -> { kadaluarsa, user }

// Token yang diterbitkan PADA ATAU SEBELUM detik ini (klaim `iat`, resolusi 1 detik) dianggap sudah
// dicabut — diisi saat logout atau reset password. Disimpan di memori proses: setelah server
// restart daftar ini kosong (token lama tetap mati sendiri saat kedaluwarsa).
const tokenDicabutSebelum = new Map(); // id -> detik

function hapusCacheUser(id) {
  cacheUser.delete(Number(id));
}

// Cabut semua token user ini yang diterbitkan sampai detik ini.
function cabutTokenUser(id) {
  tokenDicabutSebelum.set(Number(id), Math.floor(Date.now() / 1000));
  hapusCacheUser(id);
}

async function ambilUser(id) {
  const ada = cacheUser.get(id);
  if (ada && ada.kadaluarsa > Date.now()) return ada.user;

  const { rows } = await pool.query(
    'SELECT id, username, nama, role, is_active FROM users WHERE id = $1',
    [id]
  );
  const user = rows[0] || null;
  if (user) cacheUser.set(id, { kadaluarsa: Date.now() + CACHE_MS, user });
  else cacheUser.delete(id);
  return user;
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    // Algoritma dikunci ke HS256 (sesuai jwt.sign default) — menolak algoritma lain.
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }

  const id = Number(decoded.id);
  if (!Number.isSafeInteger(id)) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }

  const dicabut = tokenDicabutSebelum.get(id);
  if (dicabut && decoded.iat <= dicabut) {
    return res.status(401).json({ success: false, message: 'Sesi sudah berakhir, silakan login lagi' });
  }

  try {
    const user = await ambilUser(id);
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Akun tidak ditemukan atau nonaktif' });
    }
    // Identitas & role diambil dari database (bukan dari isi token) supaya perubahan role langsung berlaku.
    req.user = { ...decoded, id: user.id, username: user.username, nama: user.nama, role: user.role };
    next();
  } catch (err) {
    console.error('verifyToken:', err.message);
    return res.status(503).json({ success: false, message: 'Layanan sementara tidak tersedia, coba lagi sebentar' });
  }
}

module.exports = { verifyToken, hapusCacheUser, cabutTokenUser };
