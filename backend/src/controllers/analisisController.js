const pool = require('../db/pool');

async function getPerbandingan(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT id, kode, nama, satuan,
             demand_tahunan, biaya_pesan, biaya_simpan,
             satuan_per_dus, eoq, total_biaya
      FROM obat
      WHERE biaya_pesan > 0
        AND biaya_simpan > 0
        AND demand_tahunan > 0
        AND satuan_per_dus > 0
        AND eoq IS NOT NULL
      ORDER BY nama ASC
    `);

    const detail = rows.map((o) => {
      const D = parseFloat(o.demand_tahunan);
      const S = parseFloat(o.biaya_pesan);
      const H = parseFloat(o.biaya_simpan);
      const Q_trad = parseFloat(o.satuan_per_dus);
      const Q_eoq = parseFloat(o.eoq);

      const tc_tradisional = (D / Q_trad) * S + (Q_trad / 2) * H;
      const tc_eoq =
        o.total_biaya !== null
          ? parseFloat(o.total_biaya)
          : (D / Q_eoq) * S + (Q_eoq / 2) * H;

      const penghematan = tc_tradisional - tc_eoq;
      const persen_hemat =
        tc_tradisional > 0 ? (penghematan / tc_tradisional) * 100 : 0;

      return {
        id: o.id,
        kode: o.kode,
        nama: o.nama,
        satuan: o.satuan,
        demand_tahunan: Math.round(D),
        biaya_pesan: Math.round(S),
        biaya_simpan: Math.round(H),
        q_tradisional: Q_trad,
        q_eoq: Math.round(Q_eoq),
        tc_tradisional: Math.round(tc_tradisional),
        tc_eoq: Math.round(tc_eoq),
        penghematan: Math.round(penghematan),
        persen_hemat: parseFloat(persen_hemat.toFixed(1)),
      };
    });

    const total_tc_trad = detail.reduce((s, d) => s + d.tc_tradisional, 0);
    const total_tc_eoq = detail.reduce((s, d) => s + d.tc_eoq, 0);
    const total_penghematan = total_tc_trad - total_tc_eoq;
    const persen_hemat_total =
      total_tc_trad > 0
        ? parseFloat(((total_penghematan / total_tc_trad) * 100).toFixed(1))
        : 0;

    res.json({
      success: true,
      data: {
        ringkasan: {
          total_obat_dihitung: detail.length,
          total_tc_tradisional: total_tc_trad,
          total_tc_eoq,
          total_penghematan,
          persen_hemat_total,
        },
        detail,
      },
    });
  } catch (err) {
    console.error('analisis.getPerbandingan:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Kondisi sesudah = current state (EOQ-based)
async function getKondisiSesudah(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT id, kode, nama, satuan, stok,
             eoq, safety_stock, rop, total_biaya,
             demand_harian, demand_tahunan
      FROM obat
      WHERE eoq IS NOT NULL
      ORDER BY nama ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('analisis.getKondisiSesudah:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getPerbandingan, getKondisiSesudah };
