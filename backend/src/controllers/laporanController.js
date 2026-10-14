const pool = require('../db/pool');

// GET /api/laporan/stok?kategori=&obat_id=
async function getLaporanStok(req, res) {
  try {
    const { kategori, obat_id } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (kategori) { params.push(kategori); where += ` AND kategori = $${params.length}`; }
    if (obat_id)  { params.push(obat_id);  where += ` AND id = $${params.length}`; }

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

// GET /api/laporan/barang-masuk?dari=&sampai=&kategori=&obat_id=
async function getLaporanBarangMasuk(req, res) {
  try {
    const { dari, sampai, kategori, obat_id } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (dari)     { params.push(dari);     where += ` AND bm.tanggal >= $${params.length}`; }
    if (sampai)   { params.push(sampai);   where += ` AND bm.tanggal <= $${params.length}`; }
    if (kategori) { params.push(kategori); where += ` AND o.kategori = $${params.length}`; }
    if (obat_id)  { params.push(obat_id);  where += ` AND o.id = $${params.length}`; }

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

// GET /api/laporan/barang-keluar?dari=&sampai=&keterangan=&kategori=&obat_id=
async function getLaporanBarangKeluar(req, res) {
  try {
    const { dari, sampai, keterangan, kategori, obat_id } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (dari)       { params.push(dari);       where += ` AND bk.tanggal >= $${params.length}`; }
    if (sampai)     { params.push(sampai);     where += ` AND bk.tanggal <= $${params.length}`; }
    if (keterangan) { params.push(keterangan); where += ` AND bk.keterangan = $${params.length}`; }
    if (kategori)   { params.push(kategori);   where += ` AND o.kategori = $${params.length}`; }
    if (obat_id)    { params.push(obat_id);    where += ` AND o.id = $${params.length}`; }

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

// GET /api/laporan/kedaluarsa?hari=90&kategori=&obat_id=
async function getLaporanKedaluarsa(req, res) {
  try {
    const hari = parseInt(req.query.hari) || 90;
    const { kategori, obat_id } = req.query;
    const params = [hari];
    let extraWhere = '';
    if (kategori) { params.push(kategori); extraWhere += ` AND kategori = $${params.length}`; }
    if (obat_id)  { params.push(obat_id);  extraWhere += ` AND o.id = $${params.length}`; }

    const { rows } = await pool.query(`
      WITH batch_masuk AS (
        SELECT obat_id, expired_batch,
          SUM(jumlah_satuan)::int AS total_masuk
        FROM barang_masuk
        WHERE expired_batch IS NOT NULL
        GROUP BY obat_id, expired_batch
      ),
      total_keluar AS (
        SELECT obat_id,
          COALESCE(SUM(jumlah), 0)::int AS total_keluar
        FROM barang_keluar
        GROUP BY obat_id
      ),
      batch_calc AS (
        SELECT
          bm.obat_id, bm.expired_batch,
          GREATEST(0,
            bm.total_masuk - GREATEST(0,
              COALESCE(tk.total_keluar, 0) -
              COALESCE(SUM(bm.total_masuk) OVER (
                PARTITION BY bm.obat_id ORDER BY bm.expired_batch
                ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
              ), 0)
            )
          ) AS estimasi_sisa
        FROM batch_masuk bm
        LEFT JOIN total_keluar tk ON tk.obat_id = bm.obat_id
      ),
      nearest_batch AS (
        SELECT DISTINCT ON (obat_id)
          obat_id, estimasi_sisa
        FROM batch_calc
        WHERE expired_batch >= CURRENT_DATE AND estimasi_sisa > 0
        ORDER BY obat_id, expired_batch ASC
      )
      SELECT
        o.id, o.kode, o.nama, o.kategori, o.satuan,
        COALESCE(nb.estimasi_sisa, o.stok) AS stok,
        o.expired_terdekat,
        (o.expired_terdekat - CURRENT_DATE) AS sisa_hari
      FROM obat o
      LEFT JOIN nearest_batch nb ON nb.obat_id = o.id
      WHERE o.expired_terdekat IS NOT NULL
        AND o.expired_terdekat >= CURRENT_DATE
        AND o.expired_terdekat <= CURRENT_DATE + ($1 || ' days')::INTERVAL
        ${extraWhere}
      ORDER BY o.expired_terdekat ASC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('laporan.kedaluarsa:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/laporan/kartu-stok?obat_id=&dari=&sampai=
// Riwayat mutasi stok satu obat (gabungan barang_masuk + barang_keluar),
// diurutkan kronologis lama -> baru, dengan saldo berjalan (stok_sesudah).
async function getLaporanKartuStok(req, res) {
  try {
    const { obat_id, dari, sampai } = req.query;
    if (!obat_id) {
      return res.status(400).json({ success: false, message: 'obat_id wajib diisi' });
    }

    const { rows: obatRows } = await pool.query(
      'SELECT id, kode, nama, satuan, stok FROM obat WHERE id = $1',
      [obat_id]
    );
    if (!obatRows.length) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }

    const params = [obat_id];
    let dateWhere = '';
    if (dari)   { params.push(dari);   dateWhere += ` AND tanggal >= $${params.length}`; }
    if (sampai) { params.push(sampai); dateWhere += ` AND tanggal <= $${params.length}`; }

    const { rows } = await pool.query(`
      SELECT * FROM (
        SELECT
          bm.tanggal AS tanggal, bm.created_at AS created_at,
          'Masuk' AS jenis,
          ('No. Faktur ' || COALESCE(bm.no_faktur, '-')) AS keterangan,
          bm.jumlah_satuan AS masuk,
          0 AS keluar,
          bm.stok_sesudah AS sisa,
          bm.expired_batch AS expired_batch,
          u.nama AS nama_user
        FROM barang_masuk bm
        LEFT JOIN users u ON u.id = bm.user_id
        WHERE bm.obat_id = $1 ${dateWhere.replace(/tanggal/g, 'bm.tanggal')}

        UNION ALL

        SELECT
          bk.tanggal AS tanggal, bk.created_at AS created_at,
          'Keluar' AS jenis,
          bk.keterangan AS keterangan,
          0 AS masuk,
          bk.jumlah AS keluar,
          bk.stok_sesudah AS sisa,
          NULL AS expired_batch,
          u.nama AS nama_user
        FROM barang_keluar bk
        LEFT JOIN users u ON u.id = bk.user_id
        WHERE bk.obat_id = $1 ${dateWhere.replace(/tanggal/g, 'bk.tanggal')}
      ) gabungan
      ORDER BY tanggal ASC, created_at ASC
    `, params);

    res.json({ success: true, data: rows, obat: obatRows[0] });
  } catch (err) {
    console.error('laporan.kartuStok:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/laporan/eoq-rop?kategori=&obat_id=
async function getLaporanEoqRop(req, res) {
  try {
    const { kategori, obat_id } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (kategori) { params.push(kategori); where += ` AND kategori = $${params.length}`; }
    if (obat_id)  { params.push(obat_id);  where += ` AND id = $${params.length}`; }

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
  getLaporanKartuStok,
};
