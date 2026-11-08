const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Pencatatan aktivitas pengguna untuk keperluan penelitian (dilihat peneliti lewat
// akun superadmin). Prinsip: TIDAK menyimpan isi data transaksi, body request, atau
// password — hanya siapa, kapan, jenis aktivitas, dan halaman/endpoint yang diakses.
// Kegagalan mencatat tidak boleh pernah mengganggu fitur utama (selalu try/catch).

function ipDari(req) {
  const xf = req.headers['x-forwarded-for'];
  return (xf ? String(xf).split(',')[0].trim() : req.socket?.remoteAddress || '').slice(0, 64);
}

// Ambil user dari token Authorization (tanpa menolak request kalau tidak ada/invalid)
function userDariToken(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

async function catat({ req, user = null, jenis, deskripsi = null, path = null, status = null, username = null }) {
  try {
    // Aktivitas peneliti sendiri tidak dicatat
    if (user && user.role === 'superadmin') return;

    await pool.query(
      `INSERT INTO log_aktivitas
         (user_id, username, nama, role, jenis, deskripsi, path, metode, status_http, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        user?.id ?? null,
        (user?.username ?? username ?? null)?.toString().slice(0, 50) ?? null,
        user?.nama ?? null,
        user?.role ?? null,
        jenis,
        deskripsi,
        (path ?? req.originalUrl.split('?')[0]).slice(0, 255),
        req.method,
        status,
        ipDari(req),
        (req.headers['user-agent'] || '').slice(0, 300),
      ]
    );
    if (user?.id) {
      await pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [user.id]);
    }
  } catch (err) {
    console.error('aktivitas.catat:', err.message);
  }
}

module.exports = { catat, userDariToken };
