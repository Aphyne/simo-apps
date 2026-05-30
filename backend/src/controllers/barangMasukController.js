const pool = require('../db/pool');

async function getAll(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(o.nama ILIKE $${params.length} OR o.kode ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM barang_masuk bm JOIN obat o ON bm.obat_id = o.id ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT
         bm.*,
         o.nama AS nama_obat,
         o.kode AS kode_obat,
         o.satuan,
         s.nama AS nama_supplier,
         u.nama AS nama_user,
         u.username,
         u.role AS role_user
       FROM barang_masuk bm
       JOIN obat o ON bm.obat_id = o.id
       LEFT JOIN supplier s ON bm.supplier_id = s.id
       LEFT JOIN users u ON bm.user_id = u.id
       ${where}
       ORDER BY bm.tanggal DESC, bm.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      meta: {
        current_page: page,
        per_page: limit,
        total,
        last_page: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('barangMasuk.getAll:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function create(req, res) {
  const { tanggal, obat_id, jumlah_dus, supplier_id, no_faktur, expired_batch, catatan } = req.body;
  const user_id = req.user?.id ?? null;

  if (!tanggal || !obat_id || !jumlah_dus) {
    return res.status(400).json({ success: false, message: 'Tanggal, obat, dan jumlah wajib diisi' });
  }
  if (parseFloat(jumlah_dus) <= 0) {
    return res.status(400).json({ success: false, message: 'Jumlah harus lebih dari 0' });
  }

  try {
    const { rows: obatRows } = await pool.query('SELECT * FROM obat WHERE id = $1', [obat_id]);
    if (!obatRows.length) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }
    const obat = obatRows[0];

    const jumlah_satuan = Math.round(parseFloat(jumlah_dus) * obat.satuan_per_dus);
    const stok_sebelum = obat.stok;
    const stok_sesudah = stok_sebelum + jumlah_satuan;

    const { rows } = await pool.query(
      `INSERT INTO barang_masuk
         (tanggal, obat_id, jumlah_dus, jumlah_satuan, supplier_id, no_faktur, expired_batch, catatan, user_id, stok_sebelum, stok_sesudah)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        tanggal, obat_id, jumlah_dus, jumlah_satuan,
        supplier_id || null, no_faktur || null,
        expired_batch || null, catatan || null,
        user_id, stok_sebelum, stok_sesudah,
      ]
    );

    await pool.query(
      'UPDATE obat SET stok = $1, updated_at = NOW() WHERE id = $2',
      [stok_sesudah, obat_id]
    );

    // Auto-update expired_terdekat → ambil yang paling dekat dari semua barang masuk
    if (expired_batch) {
      await pool.query(
        `UPDATE obat
         SET expired_terdekat = (
           SELECT MIN(expired_batch)
           FROM barang_masuk
           WHERE obat_id = $1 AND expired_batch IS NOT NULL
         ),
         updated_at = NOW()
         WHERE id = $1`,
        [obat_id]
      );
    }

    // Auto-update supplier → pakai supplier dari barang masuk terbaru
    if (supplier_id) {
      await pool.query(
        'UPDATE obat SET supplier_id = $1, updated_at = NOW() WHERE id = $2',
        [supplier_id, obat_id]
      );
    }

    res.status(201).json({
      success: true,
      data: { ...rows[0], nama_obat: obat.nama, kode_obat: obat.kode, satuan: obat.satuan },
      message: 'Barang masuk berhasil dicatat',
    });
  } catch (err) {
    console.error('barangMasuk.create:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getAll, create };
