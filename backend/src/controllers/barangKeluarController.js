const pool = require('../db/pool');
const { hitungUlangObat, updateExpiredTerdekat } = require('../services/stokService');
const { hitungDemandDariRiwayat } = require('../services/demandService');

async function getAll(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const keterangan = req.query.keterangan?.trim() || '';

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(o.nama ILIKE $${params.length} OR o.kode ILIKE $${params.length})`);
    }
    if (keterangan) {
      params.push(keterangan);
      conditions.push(`bk.keterangan = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM barang_keluar bk JOIN obat o ON bk.obat_id = o.id ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT
         bk.*,
         o.nama AS nama_obat,
         o.kode AS kode_obat,
         o.satuan,
         o.harga_jual,
         u.nama AS nama_user,
         u.username,
         u.role AS role_user
       FROM barang_keluar bk
       JOIN obat o ON bk.obat_id = o.id
       LEFT JOIN users u ON bk.user_id = u.id
       ${where}
       ORDER BY bk.tanggal DESC, bk.created_at DESC
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
    console.error('barangKeluar.getAll:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function create(req, res) {
  const { tanggal, obat_id, jumlah, keterangan, catatan } = req.body;
  const user_id = req.user?.id ?? null;

  if (!tanggal || !obat_id || !jumlah || !keterangan) {
    return res.status(400).json({ success: false, message: 'Tanggal, obat, jumlah, dan keterangan wajib diisi' });
  }
  if (parseInt(jumlah) <= 0) {
    return res.status(400).json({ success: false, message: 'Jumlah harus lebih dari 0' });
  }

  try {
    const { rows: obatRows } = await pool.query('SELECT * FROM obat WHERE id = $1', [obat_id]);
    if (!obatRows.length) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }
    const obat = obatRows[0];

    if (obat.stok < parseInt(jumlah)) {
      return res.status(400).json({
        success: false,
        message: `Stok tidak cukup. Stok tersedia: ${obat.stok} ${obat.satuan}`,
      });
    }

    const stok_sebelum = obat.stok;
    const stok_sesudah = stok_sebelum - parseInt(jumlah);

    const { rows } = await pool.query(
      `INSERT INTO barang_keluar
         (tanggal, obat_id, jumlah, keterangan, catatan, user_id, stok_sebelum, stok_sesudah)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [tanggal, obat_id, jumlah, keterangan, catatan || null, user_id, stok_sebelum, stok_sesudah]
    );

    await pool.query(
      'UPDATE obat SET stok = $1, updated_at = NOW() WHERE id = $2',
      [stok_sesudah, obat_id]
    );

    // Jika penjualan → update demand dari riwayat
    if (keterangan === 'Penjualan') {
      const demand = await hitungDemandDariRiwayat(obat_id);
      if (demand) {
        await pool.query(
          'UPDATE obat SET demand_harian = $1, demand_tahunan = $2, std_dev_demand = $3 WHERE id = $4',
          [demand.demand_harian, demand.demand_tahunan, demand.std_dev_demand, obat_id]
        );
      }
    }

    await updateExpiredTerdekat(obat_id);

    // Hitung ulang EOQ/SS/ROP
    const obatUpdated = await hitungUlangObat(obat_id);

    const reorder_alert = obatUpdated.rop !== null && stok_sesudah <= parseFloat(obatUpdated.rop);

    res.status(201).json({
      success: true,
      data: { ...rows[0], nama_obat: obat.nama, kode_obat: obat.kode, satuan: obat.satuan },
      reorder_alert,
      obat_nama: obat.nama,
      stok_sesudah,
      rop: obatUpdated.rop,
      message: 'Barang keluar berhasil dicatat',
    });
  } catch (err) {
    console.error('barangKeluar.create:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getAll, create };
