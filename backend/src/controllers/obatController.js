const pool = require('../db/pool');
const { kalkulasiLengkap, kalkulasiStepByStep } = require('../services/eoqService');
const { hitungUlangObat } = require('../services/stokService');

function hitungStatus(stok, rop) {
  if (rop === null || rop === undefined) return 'AMAN';
  const ropNum = parseFloat(rop);
  if (stok <= ropNum) return 'HARUS_REORDER';
  if (stok <= ropNum * 1.5) return 'MENDEKATI_ROP';
  return 'AMAN';
}

function hitungEstimasiHabis(stok, demand_harian) {
  const d = parseFloat(demand_harian);
  if (!d || d <= 0) return null;
  return Math.floor(stok / d);
}

function formatObat(row) {
  return {
    ...row,
    status: hitungStatus(row.stok, row.rop),
    estimasi_habis_hari: hitungEstimasiHabis(row.stok, row.demand_harian),
  };
}

async function getAll(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const kategori = req.query.kategori?.trim() || '';
    const status = req.query.status?.trim() || '';

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(o.nama ILIKE $${params.length} OR o.kode ILIKE $${params.length})`);
    }
    if (kategori) {
      params.push(kategori);
      conditions.push(`o.kategori = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM obat o ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT o.* FROM obat o ${where} ORDER BY o.nama ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    let data = rows.map(formatObat);

    // Filter status dilakukan setelah kalkulasi (status tidak tersimpan di DB)
    if (status) {
      data = data.filter((o) => o.status === status);
    }

    res.json({
      success: true,
      data,
      meta: {
        current_page: page,
        per_page: limit,
        total: status ? data.length : total,
        last_page: Math.ceil((status ? data.length : total) / limit),
      },
    });
  } catch (err) {
    console.error('obat.getAll:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getById(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM obat WHERE id = $1', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }
    res.json({ success: true, data: formatObat(rows[0]) });
  } catch (err) {
    console.error('obat.getById:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function create(req, res) {
  const {
    nama, kategori, satuan, satuan_per_dus,
    harga_beli, harga_jual, stok,
    demand_harian, demand_tahunan, std_dev_demand,
    biaya_pesan, biaya_simpan,
    lead_time, service_level, expired_terdekat, supplier_id,
  } = req.body;

  if (!nama || !kategori || !satuan) {
    return res.status(400).json({ success: false, message: 'Nama, kategori, dan satuan wajib diisi' });
  }

  try {
    // Auto-generate kode: ambil nomor terbesar dari kode OBT-xxx
    const { rows: kodeRows } = await pool.query(
      `SELECT kode FROM obat WHERE kode ~ '^OBT-[0-9]+$' ORDER BY CAST(SUBSTRING(kode FROM 5) AS INTEGER) DESC LIMIT 1`
    );
    let nextNum = 1;
    if (kodeRows.length) {
      nextNum = parseInt(kodeRows[0].kode.replace('OBT-', '')) + 1;
    }
    const kode = `OBT-${String(nextNum).padStart(3, '0')}`;

    // Ambil nama supplier jika supplier_id diisi
    let nama_supplier = null;
    if (supplier_id) {
      const { rows: supRows } = await pool.query('SELECT nama FROM supplier WHERE id = $1', [supplier_id]);
      if (supRows.length) nama_supplier = supRows[0].nama;
    }

    const { rows } = await pool.query(
      `INSERT INTO obat (
        kode, nama, kategori, satuan, satuan_per_dus,
        harga_beli, harga_jual, stok,
        demand_harian, demand_tahunan, std_dev_demand,
        biaya_pesan, biaya_simpan,
        lead_time, service_level, expired_terdekat,
        supplier_id, nama_supplier
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [
        kode, nama, kategori, satuan,
        satuan_per_dus || 1, harga_beli || 0, harga_jual || 0, stok || 0,
        demand_harian || 0, demand_tahunan || 0, std_dev_demand || 0,
        biaya_pesan || 0, biaya_simpan || 0,
        lead_time || 1, service_level || 95,
        expired_terdekat || null,
        supplier_id || null, nama_supplier,
      ]
    );
    // Auto-kalkulasi EOQ/SS/ROP setelah insert
    const obatBaru = rows[0];
    const kalkulasi = kalkulasiLengkap(obatBaru);
    const { rows: updated } = await pool.query(
      `UPDATE obat SET eoq=$1, safety_stock=$2, rop=$3, total_biaya=$4 WHERE id=$5 RETURNING *`,
      [kalkulasi.eoq, kalkulasi.safety_stock, kalkulasi.rop, kalkulasi.total_biaya, obatBaru.id]
    );
    res.status(201).json({ success: true, data: formatObat(updated[0]), message: 'Obat berhasil ditambahkan' });
  } catch (err) {
    console.error('obat.create:', err);
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Kode obat sudah ada, coba lagi' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function update(req, res) {
  const {
    nama, kategori, satuan, satuan_per_dus,
    harga_beli, harga_jual, stok,
    demand_harian, demand_tahunan, std_dev_demand,
    biaya_pesan, biaya_simpan,
    lead_time, service_level, expired_terdekat, supplier_id,
  } = req.body;

  if (!nama || !kategori || !satuan) {
    return res.status(400).json({ success: false, message: 'Nama, kategori, dan satuan wajib diisi' });
  }

  try {
    // Ambil nama supplier jika supplier_id diisi
    let nama_supplier = null;
    if (supplier_id) {
      const { rows: supRows } = await pool.query('SELECT nama FROM supplier WHERE id = $1', [supplier_id]);
      if (supRows.length) nama_supplier = supRows[0].nama;
    }

    const { rows } = await pool.query(
      `UPDATE obat SET
        nama = $1, kategori = $2, satuan = $3, satuan_per_dus = $4,
        harga_beli = $5, harga_jual = $6, stok = $7,
        demand_harian = $8, demand_tahunan = $9, std_dev_demand = $10,
        biaya_pesan = $11, biaya_simpan = $12,
        lead_time = $13, service_level = $14, expired_terdekat = $15,
        supplier_id = $16, nama_supplier = $17, updated_at = NOW()
       WHERE id = $18
       RETURNING *`,
      [
        nama, kategori, satuan,
        satuan_per_dus || 1, harga_beli || 0, harga_jual || 0, stok || 0,
        demand_harian || 0, demand_tahunan || 0, std_dev_demand || 0,
        biaya_pesan || 0, biaya_simpan || 0,
        lead_time || 1, service_level || 95,
        expired_terdekat || null,
        supplier_id || null, nama_supplier, req.params.id,
      ]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }
    // Auto-kalkulasi EOQ/SS/ROP setelah update
    const kalkulasi = kalkulasiLengkap(rows[0]);
    const { rows: updated } = await pool.query(
      `UPDATE obat SET eoq=$1, safety_stock=$2, rop=$3, total_biaya=$4 WHERE id=$5 RETURNING *`,
      [kalkulasi.eoq, kalkulasi.safety_stock, kalkulasi.rop, kalkulasi.total_biaya, req.params.id]
    );
    res.json({ success: true, data: formatObat(updated[0]), message: 'Obat berhasil diperbarui' });
  } catch (err) {
    console.error('obat.update:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getPerhitungan(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM obat WHERE id = $1', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }
    const detail = kalkulasiStepByStep(rows[0]);
    res.json({ success: true, data: detail });
  } catch (err) {
    console.error('obat.getPerhitungan:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function hitungUlang(req, res) {
  try {
    const updated = await hitungUlangObat(req.params.id);
    res.json({ success: true, data: formatObat(updated), message: 'Kalkulasi berhasil diperbarui' });
  } catch (err) {
    console.error('obat.hitungUlang:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM obat WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }
    res.json({ success: true, message: 'Obat berhasil dihapus' });
  } catch (err) {
    console.error('obat.remove:', err);
    // Foreign key violation — obat masih ada di transaksi
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Obat tidak bisa dihapus karena masih memiliki riwayat transaksi',
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getAll, getById, create, update, remove, getPerhitungan, hitungUlang };
