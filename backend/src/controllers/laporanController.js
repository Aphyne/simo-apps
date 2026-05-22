const pool = require('../db/pool');

// GET /api/laporan/stok?kategori=
async function getLaporanStok(req, res) {
  try {
    const { kategori } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (kategori) { params.push(kategori); where += ` AND kategori = $${params.length}`; }

    const { rows } = await pool.query(`
      SELECT id, kode, nama, kategori, satuan, stok,
             eoq, safety_stock, rop, total_biaya,
             expired_terdekat, demand_harian
      FROM obat
      ${where}
      ORDER BY kategori ASC, nama ASC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('laporan.stok:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/laporan/barang-masuk?dari=&sampai=&kategori=
async function getLaporanBarangMasuk(req, res) {
  try {
    const { dari, sampai, kategori } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (dari)     { params.push(dari);     where += ` AND bm.tanggal >= $${params.length}`; }
    if (sampai)   { params.push(sampai);   where += ` AND bm.tanggal <= $${params.length}`; }
    if (kategori) { params.push(kategori); where += ` AND o.kategori = $${params.length}`; }

    const { rows } = await pool.query(`
      SELECT bm.id, bm.tanggal, bm.jumlah_dus, bm.jumlah_satuan,
             bm.no_faktur, bm.catatan,
             o.kode, o.nama AS nama_obat, o.satuan, o.kategori,
             s.nama AS nama_supplier,
             u.nama AS nama_user, u.role AS role_user
      FROM barang_masuk bm
      JOIN obat o ON o.id = bm.obat_id
      LEFT JOIN supplier s ON s.id = bm.supplier_id
      LEFT JOIN users u ON u.id = bm.user_id
      ${where}
      ORDER BY bm.tanggal DESC, bm.id DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('laporan.barangMasuk:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/laporan/barang-keluar?dari=&sampai=&keterangan=&kategori=
async function getLaporanBarangKeluar(req, res) {
  try {
    const { dari, sampai, keterangan, kategori } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (dari)       { params.push(dari);       where += ` AND bk.tanggal >= $${params.length}`; }
    if (sampai)     { params.push(sampai);     where += ` AND bk.tanggal <= $${params.length}`; }
    if (keterangan) { params.push(keterangan); where += ` AND bk.keterangan = $${params.length}`; }
    if (kategori)   { params.push(kategori);   where += ` AND o.kategori = $${params.length}`; }

    const { rows } = await pool.query(`
      SELECT bk.id, bk.tanggal, bk.jumlah, bk.keterangan, bk.catatan,
             bk.stok_sebelum, bk.stok_sesudah,
             o.kode, o.nama AS nama_obat, o.satuan, o.kategori,
             u.nama AS nama_user, u.role AS role_user
      FROM barang_keluar bk
      JOIN obat o ON o.id = bk.obat_id
      LEFT JOIN users u ON u.id = bk.user_id
      ${where}
      ORDER BY bk.tanggal DESC, bk.id DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('laporan.barangKeluar:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/laporan/kedaluarsa?hari=90&kategori=
async function getLaporanKedaluarsa(req, res) {
  try {
    const hari = parseInt(req.query.hari) || 90;
    const { kategori } = req.query;
    const params = [hari];
    let extraWhere = '';
    if (kategori) { params.push(kategori); extraWhere = ` AND kategori = $${params.length}`; }

    const { rows } = await pool.query(`
      SELECT id, kode, nama, kategori, satuan, stok, expired_terdekat,
             (expired_terdekat - CURRENT_DATE) AS sisa_hari
      FROM obat
      WHERE expired_terdekat IS NOT NULL
        AND expired_terdekat >= CURRENT_DATE
        AND expired_terdekat <= CURRENT_DATE + ($1 || ' days')::INTERVAL
        ${extraWhere}
      ORDER BY expired_terdekat ASC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('laporan.kedaluarsa:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/laporan/eoq-rop?kategori=
async function getLaporanEoqRop(req, res) {
  try {
    const { kategori } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (kategori) { params.push(kategori); where += ` AND kategori = $${params.length}`; }

    const { rows } = await pool.query(`
      SELECT id, kode, nama, satuan, kategori,
             demand_harian, demand_tahunan, std_dev_demand,
             biaya_pesan, biaya_simpan, lead_time, service_level,
             eoq, safety_stock, rop, total_biaya
      FROM obat
      ${where}
      ORDER BY nama ASC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('laporan.eoqRop:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getLaporanStok,
  getLaporanBarangMasuk,
  getLaporanBarangKeluar,
  getLaporanKedaluarsa,
  getLaporanEoqRop,
};
