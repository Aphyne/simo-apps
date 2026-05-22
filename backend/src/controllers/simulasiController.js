const pool = require('../db/pool');
const { kalkulasiLengkap } = require('../services/eoqService');

// POST /api/simulasi/jalankan — hitung skenario, tidak simpan ke DB
async function jalankanSimulasi(req, res) {
  try {
    const { obat_id, demand_perubahan_pct, lead_time_baru, biaya_pesan_baru, biaya_simpan_baru } = req.body;
    if (!obat_id) return res.status(400).json({ success: false, message: 'obat_id wajib diisi' });

    const { rows } = await pool.query('SELECT * FROM obat WHERE id = $1', [obat_id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });

    const o = rows[0];

    const aktual = {
      demand_tahunan: parseFloat(o.demand_tahunan) || 0,
      demand_harian:  parseFloat(o.demand_harian)  || 0,
      std_dev_demand: parseFloat(o.std_dev_demand) || 0,
      biaya_pesan:    parseFloat(o.biaya_pesan)    || 0,
      biaya_simpan:   parseFloat(o.biaya_simpan)   || 0,
      lead_time:      parseInt(o.lead_time)         || 1,
      service_level:  parseFloat(o.service_level)  || 95,
      eoq:         o.eoq         !== null ? parseFloat(o.eoq)         : null,
      safety_stock: parseFloat(o.safety_stock) || 0,
      rop:          parseFloat(o.rop)          || 0,
      total_biaya: o.total_biaya !== null ? parseFloat(o.total_biaya) : null,
    };

    // Bangun parameter simulasi — fallback ke nilai aktual jika tidak diisi
    const pct      = parseFloat(demand_perubahan_pct) || 0;
    const sim_D    = aktual.demand_tahunan * (1 + pct / 100);
    const sim_d    = aktual.demand_harian  * (1 + pct / 100);
    const sim_sig  = aktual.std_dev_demand * (1 + pct / 100);
    const sim_LT   = lead_time_baru   !== undefined && lead_time_baru   !== '' ? parseInt(lead_time_baru)      : aktual.lead_time;
    const sim_S    = biaya_pesan_baru  !== undefined && biaya_pesan_baru  !== '' ? parseFloat(biaya_pesan_baru)  : aktual.biaya_pesan;
    const sim_H    = biaya_simpan_baru !== undefined && biaya_simpan_baru !== '' ? parseFloat(biaya_simpan_baru) : aktual.biaya_simpan;

    const hasilSim = kalkulasiLengkap({
      demand_tahunan: sim_D,
      demand_harian:  sim_d,
      std_dev_demand: sim_sig,
      biaya_pesan:    sim_S,
      biaya_simpan:   sim_H,
      lead_time:      sim_LT,
      service_level:  aktual.service_level,
    });

    const simulasi = {
      demand_tahunan: Math.round(sim_D),
      demand_harian:  parseFloat(sim_d.toFixed(2)),
      biaya_pesan:    sim_S,
      biaya_simpan:   sim_H,
      lead_time:      sim_LT,
      eoq:          hasilSim.eoq,
      safety_stock: parseFloat(hasilSim.safety_stock.toFixed(2)),
      rop:          parseFloat(hasilSim.rop.toFixed(2)),
      total_biaya:  hasilSim.total_biaya,
    };

    const selisih = {
      eoq:         hasilSim.eoq !== null && aktual.eoq !== null
                     ? parseFloat((hasilSim.eoq - aktual.eoq).toFixed(2)) : null,
      safety_stock: parseFloat((hasilSim.safety_stock - aktual.safety_stock).toFixed(2)),
      rop:          parseFloat((hasilSim.rop - aktual.rop).toFixed(2)),
      total_biaya:  hasilSim.total_biaya !== null && aktual.total_biaya !== null
                     ? parseFloat((hasilSim.total_biaya - aktual.total_biaya).toFixed(2)) : null,
    };

    res.json({
      success: true,
      data: {
        obat: { id: o.id, nama: o.nama, kode: o.kode, satuan: o.satuan },
        parameter_input: { demand_perubahan_pct: pct, lead_time_baru: sim_LT, biaya_pesan_baru: sim_S, biaya_simpan_baru: sim_H },
        aktual,
        simulasi,
        selisih,
      },
    });
  } catch (err) {
    console.error('simulasi.jalankan:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// POST /api/simulasi/simpan
async function simpanSimulasi(req, res) {
  try {
    const { obat_id, nama_skenario, parameter_input, aktual, simulasi, selisih } = req.body;
    if (!obat_id) return res.status(400).json({ success: false, message: 'obat_id wajib diisi' });

    const user_id = req.user?.id ?? null;
    const hasil_simulasi = { aktual, simulasi, selisih };

    const { rows } = await pool.query(
      `INSERT INTO simulasi_skenario (obat_id, nama_skenario, parameter_input, hasil_simulasi, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [obat_id, nama_skenario || 'Skenario tanpa nama', JSON.stringify(parameter_input), JSON.stringify(hasil_simulasi), user_id]
    );

    res.json({ success: true, data: { id: rows[0].id } });
  } catch (err) {
    console.error('simulasi.simpan:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/simulasi
async function getSimulasi(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.nama_skenario, s.parameter_input, s.hasil_simulasi, s.created_at,
             o.nama AS nama_obat, o.kode AS kode_obat, o.satuan,
             u.nama AS nama_user
      FROM simulasi_skenario s
      JOIN obat o ON o.id = s.obat_id
      LEFT JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
      LIMIT 20
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('simulasi.getAll:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// DELETE /api/simulasi/:id
async function deleteSimulasi(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM simulasi_skenario WHERE id = $1', [id]);
    res.json({ success: true, message: 'Simulasi berhasil dihapus' });
  } catch (err) {
    console.error('simulasi.delete:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { jalankanSimulasi, simpanSimulasi, getSimulasi, deleteSimulasi };
