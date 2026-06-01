const pool = require('../db/pool');

async function getSummary(req, res) {
  try {
    const [
      totalObat,
      obatReorder,
      nilaiStok,
      transaksiHariIni,
      obatExpiring,
      obatMendesak,
      daftarExpired,
      stokMenipis,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM obat'),
      pool.query('SELECT COUNT(*) FROM obat WHERE rop IS NOT NULL AND stok <= rop'),
      pool.query(`SELECT COALESCE(SUM(jumlah), 0) AS total FROM barang_keluar WHERE keterangan = 'Penjualan' AND tanggal = CURRENT_DATE`),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM barang_masuk WHERE tanggal = CURRENT_DATE) +
          (SELECT COUNT(*) FROM barang_keluar WHERE tanggal = CURRENT_DATE) AS total
      `),
      pool.query(`
        SELECT COUNT(*) FROM obat
        WHERE expired_terdekat IS NOT NULL
          AND expired_terdekat >= CURRENT_DATE
          AND expired_terdekat <= CURRENT_DATE + INTERVAL '90 days'
      `),
      pool.query(`
        SELECT id, kode, nama, satuan, stok, rop, eoq, safety_stock,
               (stok - rop) AS selisih
        FROM obat
        WHERE rop IS NOT NULL AND stok <= rop
        ORDER BY (stok - rop) ASC
        LIMIT 5
      `),
      pool.query(`
        SELECT nama, satuan, stok, expired_terdekat
        FROM obat
        WHERE expired_terdekat IS NOT NULL
          AND expired_terdekat >= CURRENT_DATE
        ORDER BY expired_terdekat ASC
        LIMIT 5
      `),
      pool.query(`
        SELECT o.id, o.kode, o.nama, o.satuan, o.stok, o.rop, o.eoq,
               (o.stok - o.rop) AS selisih
        FROM obat o
        WHERE o.rop IS NOT NULL AND o.stok <= o.rop * 1.5
        ORDER BY (o.stok::float / NULLIF(o.rop, 0)) ASC
        LIMIT 5
      `),
    ]);

    res.json({
      success: true,
      data: {
        cards: {
          total_obat: parseInt(totalObat.rows[0].count),
          obat_reorder: parseInt(obatReorder.rows[0].count),
          penjualan_hari_ini: parseInt(nilaiStok.rows[0].total),
          transaksi_hari_ini: parseInt(transaksiHariIni.rows[0].total),
          obat_expiring: parseInt(obatExpiring.rows[0].count),
        },
        obat_mendesak: obatMendesak.rows,
        daftar_expired: daftarExpired.rows,
        stok_menipis: stokMenipis.rows,
      },
    });
  } catch (err) {
    console.error('dashboard.getSummary:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getTrenPermintaan(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        DATE_TRUNC('month', tanggal) AS bulan,
        SUM(jumlah) AS total
      FROM barang_keluar
      WHERE keterangan = 'Penjualan'
        AND tanggal >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', tanggal)
      ORDER BY bulan ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('dashboard.getTrenPermintaan:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getPerbandinganBiaya(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        id, nama, satuan,
        demand_tahunan, biaya_pesan, biaya_simpan,
        satuan_per_dus, eoq, total_biaya
      FROM obat
      WHERE total_biaya IS NOT NULL
        AND biaya_pesan > 0
        AND biaya_simpan > 0
        AND demand_tahunan > 0
        AND satuan_per_dus > 0
      ORDER BY total_biaya DESC
      LIMIT 8
    `);

    const data = rows.map((o) => {
      const D = parseFloat(o.demand_tahunan);
      const S = parseFloat(o.biaya_pesan);
      const H = parseFloat(o.biaya_simpan);
      const Q_trad = parseFloat(o.satuan_per_dus);
      const tc_tanpa_eoq = (D / Q_trad) * S + (Q_trad / 2) * H;

      return {
        id: o.id,
        nama: o.nama.length > 15 ? o.nama.substring(0, 15) + '…' : o.nama,
        nama_lengkap: o.nama,
        biaya_eoq: parseFloat(parseFloat(o.total_biaya).toFixed(0)),
        biaya_tanpa_eoq: parseFloat(tc_tanpa_eoq.toFixed(0)),
        penghematan: parseFloat((tc_tanpa_eoq - parseFloat(o.total_biaya)).toFixed(0)),
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('dashboard.getPerbandinganBiaya:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getSummary, getTrenPermintaan, getPerbandinganBiaya };
