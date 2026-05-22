const pool = require('../db/pool');

async function getMonitoring(req, res) {
  try {
    const { search } = req.query;

    let where = 'WHERE demand_harian > 0';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (nama ILIKE $${params.length} OR kode ILIKE $${params.length})`;
    }

    const { rows } = await pool.query(
      `SELECT id, kode, nama, kategori, satuan, stok,
              safety_stock, rop, demand_harian
       FROM obat
       ${where}
       ORDER BY (stok::numeric / demand_harian) ASC`,
      params
    );

    const data = rows.map((o) => {
      const stok = parseInt(o.stok) || 0;
      const rop = o.rop !== null ? parseFloat(o.rop) : null;
      const ss = parseFloat(o.safety_stock) || 0;
      const demand = parseFloat(o.demand_harian);
      const estimasi_habis_hari = Math.round(stok / demand);

      let status_stok;
      if (rop === null) {
        status_stok = 'Belum Dihitung';
      } else if (stok <= ss) {
        status_stok = 'Kritis';
      } else if (stok <= rop) {
        status_stok = 'Perlu Reorder';
      } else {
        status_stok = 'Aman';
      }

      return {
        id: o.id,
        kode: o.kode,
        nama: o.nama,
        kategori: o.kategori,
        satuan: o.satuan,
        stok,
        rop,
        demand_harian: parseFloat(demand.toFixed(2)),
        estimasi_habis_hari,
        status_stok,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('monitoring.getMonitoring:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getMonitoring };
