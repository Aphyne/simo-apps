const pool = require('../db/pool');

async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM supplier ORDER BY nama ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('supplier.getAll:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getById(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM supplier WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('supplier.getById:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function create(req, res) {
  const { nama, alamat, telepon, whatsapp, jenis_obat, lead_time_avg } = req.body;

  if (!nama) {
    return res.status(400).json({ success: false, message: 'Nama supplier wajib diisi' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO supplier (nama, alamat, telepon, whatsapp, jenis_obat, lead_time_avg)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nama, alamat || null, telepon || null, whatsapp || null, jenis_obat || null, lead_time_avg || 1]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'Supplier berhasil ditambahkan' });
  } catch (err) {
    console.error('supplier.create:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function update(req, res) {
  const { nama, alamat, telepon, whatsapp, jenis_obat, lead_time_avg } = req.body;

  if (!nama) {
    return res.status(400).json({ success: false, message: 'Nama supplier wajib diisi' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE supplier
       SET nama = $1, alamat = $2, telepon = $3, whatsapp = $4,
           jenis_obat = $5, lead_time_avg = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [nama, alamat || null, telepon || null, whatsapp || null, jenis_obat || null, lead_time_avg || 1, req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    }
    res.json({ success: true, data: rows[0], message: 'Supplier berhasil diperbarui' });
  } catch (err) {
    console.error('supplier.update:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    // Cek apakah masih dipakai oleh obat
    const { rows: obatRows } = await pool.query(
      'SELECT COUNT(*) FROM obat WHERE supplier_id = $1',
      [req.params.id]
    );
    if (parseInt(obatRows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: `Supplier tidak bisa dihapus karena masih digunakan oleh ${obatRows[0].count} obat`,
      });
    }

    const { rowCount } = await pool.query('DELETE FROM supplier WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    }
    res.json({ success: true, message: 'Supplier berhasil dihapus' });
  } catch (err) {
    console.error('supplier.remove:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getAll, getById, create, update, remove };
