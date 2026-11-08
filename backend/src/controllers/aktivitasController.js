const pool = require('../db/pool');
const { catat } = require('../services/aktivitasService');

const TZ = 'Asia/Jakarta';
const ONLINE_MENIT = 3; // dianggap "online" kalau heartbeat terakhir <= 3 menit lalu

// POST /api/aktivitas/halaman  { path }  — dikirim frontend saat pindah halaman
async function catatHalaman(req, res) {
  const path = typeof req.body?.path === 'string' ? req.body.path : '';
  if (!path.startsWith('/') || path.length > 255) {
    return res.status(400).json({ success: false, message: 'Path tidak valid' });
  }
  await catat({ req, user: req.user, jenis: 'halaman', deskripsi: `Membuka halaman ${path}`, path });
  res.json({ success: true });
}

// POST /api/aktivitas/heartbeat — penanda masih aktif (dikirim berkala selama tab terlihat)
async function heartbeat(req, res) {
  try {
    if (req.user.role !== 'superadmin') {
      await pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [req.user.id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('aktivitas.heartbeat:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/aktivitas?user_id=&jenis=&dari=&sampai=&page=&limit=   (superadmin)
async function getLog(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { user_id, jenis, dari, sampai } = req.query;

    const cond = [];
    const params = [];
    if (user_id) { params.push(parseInt(user_id)); cond.push(`l.user_id = $${params.length}`); }
    if (jenis)   { params.push(jenis);             cond.push(`l.jenis = $${params.length}`); }
    if (dari)    { params.push(dari);              cond.push(`(l.created_at AT TIME ZONE '${TZ}')::date >= $${params.length}::date`); }
    if (sampai)  { params.push(sampai);            cond.push(`(l.created_at AT TIME ZONE '${TZ}')::date <= $${params.length}::date`); }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

    const { rows: cnt } = await pool.query(`SELECT COUNT(*) FROM log_aktivitas l ${where}`, params);
    const total = parseInt(cnt[0].count);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT l.id, l.user_id, l.username, l.nama, l.role, l.jenis, l.deskripsi, l.path,
              l.metode, l.status_http, l.ip, l.user_agent, l.created_at
       FROM log_aktivitas l ${where}
       ORDER BY l.created_at DESC, l.id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({
      success: true,
      data: rows,
      meta: { current_page: page, per_page: limit, total, last_page: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error('aktivitas.getLog:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/aktivitas/ringkasan   (superadmin) — ringkasan per pengguna + total hari ini
async function getRingkasan(req, res) {
  try {
    const { rows: users } = await pool.query(
      `SELECT u.id, u.username, u.nama, u.role, u.is_active, u.last_seen_at,
              (u.last_seen_at IS NOT NULL
                 AND u.last_seen_at > NOW() - INTERVAL '${ONLINE_MENIT} minutes') AS online,
              (SELECT MAX(created_at) FROM log_aktivitas WHERE user_id = u.id AND jenis = 'login') AS login_terakhir,
              (SELECT COUNT(*) FROM log_aktivitas WHERE user_id = u.id AND jenis = 'login')::int AS jumlah_login,
              (SELECT COUNT(*) FROM log_aktivitas WHERE user_id = u.id AND jenis = 'aksi')::int AS jumlah_aksi,
              (SELECT COUNT(*) FROM log_aktivitas WHERE user_id = u.id AND jenis = 'aksi'
                 AND (created_at AT TIME ZONE '${TZ}')::date = (NOW() AT TIME ZONE '${TZ}')::date)::int AS aksi_hari_ini,
              (SELECT COUNT(*) FROM log_aktivitas WHERE user_id = u.id AND jenis = 'halaman')::int AS halaman_dibuka
       FROM users u
       WHERE u.role <> 'superadmin'
       ORDER BY u.role ASC, u.nama ASC`
    );

    const { rows: hari } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE jenis = 'login')::int       AS login_hari_ini,
         COUNT(*) FILTER (WHERE jenis = 'aksi')::int        AS aksi_hari_ini,
         COUNT(*) FILTER (WHERE jenis = 'login_gagal')::int AS login_gagal_hari_ini
       FROM log_aktivitas
       WHERE (created_at AT TIME ZONE '${TZ}')::date = (NOW() AT TIME ZONE '${TZ}')::date`
    );

    res.json({
      success: true,
      data: {
        users,
        hari_ini: { ...hari[0], user_online: users.filter((u) => u.online).length },
      },
    });
  } catch (err) {
    console.error('aktivitas.getRingkasan:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { catatHalaman, heartbeat, getLog, getRingkasan };
