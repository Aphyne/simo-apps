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

const TGL = /^\d{4}-\d{2}-\d{2}$/;

// Rentang tanggal (WIB) dari query ?dari=&sampai=. Bila kosong: dari = hari pertama ada log, sampai = hari ini.
async function rentangDari(query) {
  const { rows } = await pool.query(
    `SELECT (NOW() AT TIME ZONE '${TZ}')::date::text AS hari_ini,
            (SELECT (MIN(created_at) AT TIME ZONE '${TZ}')::date::text FROM log_aktivitas) AS pertama`
  );
  let sampai = TGL.test(query.sampai || '') ? query.sampai : rows[0].hari_ini;
  let dari = TGL.test(query.dari || '') ? query.dari : (rows[0].pertama || sampai);
  if (dari > sampai) [dari, sampai] = [sampai, dari];
  const hariTotal = Math.round((Date.parse(sampai) - Date.parse(dari)) / 86400000) + 1;
  return { dari, sampai, hariTotal };
}

// GET /api/aktivitas/ringkasan?dari=&sampai=   (superadmin)
// Ringkasan per pengguna + total hari ini. Hitungan login/halaman/aksi mengikuti rentang tanggal (bawaan: sepanjang waktu).
async function getRingkasan(req, res) {
  try {
    const dari = TGL.test(req.query.dari || '') ? req.query.dari : '1970-01-01';
    const sampai = TGL.test(req.query.sampai || '') ? req.query.sampai : '2999-12-31';
    const dalam = `(l.created_at AT TIME ZONE '${TZ}')::date BETWEEN $1::date AND $2::date`;

    const { rows: users } = await pool.query(
      `SELECT u.id, u.username, u.nama, u.role, u.is_active, u.last_seen_at,
              (u.last_seen_at IS NOT NULL
                 AND u.last_seen_at > NOW() - INTERVAL '${ONLINE_MENIT} minutes') AS online,
              (SELECT MAX(created_at) FROM log_aktivitas WHERE user_id = u.id AND jenis = 'login') AS login_terakhir,
              (SELECT l.user_agent FROM log_aktivitas l WHERE l.user_id = u.id AND l.jenis = 'login'
                 ORDER BY l.created_at DESC LIMIT 1) AS perangkat_terakhir,
              (SELECT COUNT(*) FROM log_aktivitas l WHERE l.user_id = u.id AND l.jenis = 'login' AND ${dalam})::int AS jumlah_login,
              (SELECT COUNT(*) FROM log_aktivitas l WHERE l.user_id = u.id AND l.jenis = 'aksi' AND ${dalam})::int AS jumlah_aksi,
              (SELECT COUNT(*) FROM log_aktivitas l WHERE l.user_id = u.id AND l.jenis = 'aksi'
                 AND (l.created_at AT TIME ZONE '${TZ}')::date = (NOW() AT TIME ZONE '${TZ}')::date)::int AS aksi_hari_ini,
              (SELECT COUNT(*) FROM log_aktivitas l WHERE l.user_id = u.id AND l.jenis = 'halaman' AND ${dalam})::int AS halaman_dibuka,
              -- Aktivitas (halaman + aksi) per hari selama 7 hari terakhir, terlama dulu: bahan garis mini di tabel pengguna.
              (SELECT COALESCE(array_agg(x.c ORDER BY x.tgl), '{}') FROM (
                 SELECT g.tgl,
                        (SELECT COUNT(*) FROM log_aktivitas l WHERE l.user_id = u.id AND l.jenis IN ('halaman','aksi')
                           AND (l.created_at AT TIME ZONE '${TZ}')::date = g.tgl)::int AS c
                 FROM generate_series((NOW() AT TIME ZONE '${TZ}')::date - 6, (NOW() AT TIME ZONE '${TZ}')::date, INTERVAL '1 day') AS g(tgl)
               ) x) AS tren_7_hari
       FROM users u
       WHERE u.role <> 'superadmin'
       ORDER BY u.role ASC, u.nama ASC`,
      [dari, sampai]
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

// Modul aplikasi yang dihitung pemakaiannya (urut seperti menu). Modul tanpa catatan tetap dikirim dengan angka 0,
// supaya "belum pernah dibuka" terlihat (temuan yang berguna untuk penelitian). Menu yang dinonaktifkan tidak ikut.
const MODUL_APLIKASI = [
  ['dashboard', 'Dashboard'],
  ['obat', 'Data Obat'],
  ['barang-masuk', 'Stok Masuk'],
  ['barang-keluar', 'Stok Keluar'],
  ['reorder', 'Reorder'],
  ['laporan', 'Laporan'],
  ['supplier', 'Supplier'],
  ['users', 'Manajemen User'],
  ['pengaturan', 'Pengaturan'],
];

// GET /api/aktivitas/analitik?dari=&sampai=&user_id=   (superadmin)
// Bahan semua grafik halaman Pemantauan dalam satu panggilan: angka ringkas, aktivitas per hari (per minggu bila rentang
// > 92 hari), pemakaian per modul, peta jam sibuk, komposisi aksi, dan temuan yang perlu diperhatikan. Hanya kueri baca.
async function getAnalitik(req, res) {
  try {
    const { dari, sampai, hariTotal } = await rentangDari(req.query);
    const userId = parseInt(req.query.user_id) > 0 ? parseInt(req.query.user_id) : null;
    const satuan = hariTotal > 92 ? 'week' : 'day'; // nilai tetap dari kode, aman dipakai di SQL
    const params = [dari, sampai];
    let where = `(l.created_at AT TIME ZONE '${TZ}')::date BETWEEN $1::date AND $2::date`;
    if (userId) { params.push(userId); where += ` AND l.user_id = $3`; }
    const tgl = `(l.created_at AT TIME ZONE '${TZ}')`;

    const [kpiQ, harianQ, modulQ, jamQ, aksiQ, sesiQ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE l.jenis = 'login')::int AS login,
                COUNT(*) FILTER (WHERE l.jenis = 'login_gagal')::int AS login_gagal,
                COUNT(*) FILTER (WHERE l.jenis = 'aksi')::int AS aksi,
                COUNT(*) FILTER (WHERE l.jenis = 'halaman')::int AS halaman,
                COUNT(DISTINCT ${tgl}::date) FILTER (WHERE l.jenis IN ('login','halaman','aksi'))::int AS hari_aktif
         FROM log_aktivitas l WHERE ${where}`, params),
      pool.query(
        `WITH d AS (
           SELECT generate_series(date_trunc('${satuan}', $1::date)::date, $2::date, INTERVAL '1 ${satuan}')::date AS awal
         )
         SELECT d.awal::text AS awal,
                COUNT(*) FILTER (WHERE x.jenis = 'login')::int AS login,
                COUNT(*) FILTER (WHERE x.jenis = 'halaman')::int AS halaman,
                COUNT(*) FILTER (WHERE x.jenis = 'aksi')::int AS aksi,
                COUNT(*) FILTER (WHERE x.jenis = 'login_gagal')::int AS login_gagal,
                COUNT(DISTINCT x.user_id) FILTER (WHERE x.jenis IN ('login','halaman','aksi'))::int AS pengguna_aktif
         FROM d
         LEFT JOIN (SELECT ${tgl}::date AS tgl, l.jenis, l.user_id FROM log_aktivitas l WHERE ${where}) x
                ON date_trunc('${satuan}', x.tgl)::date = d.awal
         GROUP BY d.awal ORDER BY d.awal`, params),
      pool.query(
        `SELECT CASE WHEN l.jenis = 'halaman' THEN split_part(l.path, '/', 2) ELSE split_part(l.path, '/', 3) END AS kunci,
                l.jenis, COUNT(*)::int AS jumlah
         FROM log_aktivitas l
         WHERE l.jenis IN ('halaman','aksi') AND ${where}
         GROUP BY 1, 2`, params),
      pool.query(
        `SELECT EXTRACT(ISODOW FROM ${tgl})::int AS hari, EXTRACT(HOUR FROM ${tgl})::int AS jam, COUNT(*)::int AS jumlah
         FROM log_aktivitas l
         WHERE l.jenis IN ('login','halaman','aksi') AND ${where}
         GROUP BY 1, 2`, params),
      pool.query(
        `SELECT CASE WHEN l.deskripsi LIKE 'Menghapus%' THEN 'hapus'
                     WHEN l.deskripsi LIKE 'Menambah%' OR l.deskripsi LIKE 'Mencatat%' THEN 'tambah'
                     WHEN l.deskripsi LIKE 'Mengubah%' THEN 'ubah'
                     ELSE 'lainnya' END AS kelompok,
                COUNT(*)::int AS jumlah
         FROM log_aktivitas l WHERE l.jenis = 'aksi' AND ${where}
         GROUP BY 1`, params),
      // Durasi sesi = dari login sampai aktivitas (halaman/aksi/logout) terakhir sebelum login berikutnya. Itu batas bawah:
      // denyut aktif tidak masuk log, jadi waktu diam di satu halaman tidak terhitung. Satu sesi dibatasi 8 jam.
      pool.query(
        `SELECT COUNT(*)::int AS sesi, COALESCE(ROUND(AVG(LEAST(t.menit, 480)))::int, 0) AS rata_menit
         FROM (
           SELECT EXTRACT(EPOCH FROM (a.akhir - s.mulai)) / 60 AS menit
           FROM (
             SELECT l.user_id, l.created_at AS mulai,
                    (SELECT MIN(n.created_at) FROM log_aktivitas n
                      WHERE n.user_id = l.user_id AND n.jenis = 'login' AND n.created_at > l.created_at) AS berikut
             FROM log_aktivitas l WHERE l.jenis = 'login' AND ${where}
           ) s
           CROSS JOIN LATERAL (
             SELECT MAX(e.created_at) AS akhir FROM log_aktivitas e
              WHERE e.user_id = s.user_id AND e.created_at > s.mulai AND (s.berikut IS NULL OR e.created_at < s.berikut)
           ) a
           WHERE a.akhir IS NOT NULL
         ) t`, params),
    ]);

    // Pemakaian per modul: halaman dibuka dan aksi data, semua modul ikut walau 0.
    const modul = MODUL_APLIKASI.map(([kunci, label]) => {
      const nilai = (jenis) => modulQ.rows.find((r) => r.kunci === kunci && r.jenis === jenis)?.jumlah ?? 0;
      return { kunci, label, halaman: nilai('halaman'), aksi: nilai('aksi') };
    });

    // Peta jam sibuk: baris = Senin..Minggu, kolom = jam 0..23 (WIB).
    const jam = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const r of jamQ.rows) jam[r.hari - 1][r.jam] = r.jumlah;

    const aksiJenis = { tambah: 0, ubah: 0, hapus: 0, lainnya: 0 };
    for (const r of aksiQ.rows) aksiJenis[r.kelompok] = r.jumlah;

    // Temuan: kondisi SEKARANG, tidak mengikuti rentang tanggal. Dilewati bila melihat satu pengguna.
    let perhatian = null;
    if (!userId) {
      const [gagalQ, lamaQ, nonaktifQ] = await Promise.all([
        pool.query(
          `SELECT g.username, COUNT(*)::int AS jumlah, MAX(g.created_at) AS terakhir
           FROM log_aktivitas g
           WHERE g.jenis = 'login_gagal' AND g.username IS NOT NULL AND g.created_at > NOW() - INTERVAL '24 hours'
             AND NOT EXISTS (SELECT 1 FROM log_aktivitas s WHERE s.jenis = 'login' AND s.username = g.username AND s.created_at > g.created_at)
           GROUP BY g.username HAVING COUNT(*) >= 3
           ORDER BY jumlah DESC LIMIT 5`),
        pool.query(
          `SELECT id, nama, username, last_seen_at FROM users
           WHERE role <> 'superadmin' AND is_active AND (last_seen_at IS NULL OR last_seen_at < NOW() - INTERVAL '7 days')
           ORDER BY last_seen_at ASC NULLS FIRST LIMIT 5`),
        pool.query(`SELECT COUNT(*)::int AS jumlah FROM users WHERE role <> 'superadmin' AND NOT is_active`),
      ]);
      perhatian = { login_gagal_beruntun: gagalQ.rows, akun_lama_diam: lamaQ.rows, akun_nonaktif: nonaktifQ.rows[0].jumlah };
    }

    res.json({
      success: true,
      data: {
        rentang: { dari, sampai, hari_total: hariTotal, satuan: satuan === 'week' ? 'minggu' : 'hari' },
        kpi: { ...kpiQ.rows[0], sesi: sesiQ.rows[0].sesi, rata_sesi_menit: sesiQ.rows[0].rata_menit },
        harian: harianQ.rows,
        modul,
        jam,
        aksi_jenis: aksiJenis,
        perhatian,
      },
    });
  } catch (err) {
    console.error('aktivitas.getAnalitik:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { catatHalaman, heartbeat, getLog, getRingkasan, getAnalitik };
