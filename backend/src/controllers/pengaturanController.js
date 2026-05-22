const pool = require('../db/pool');

// GET /api/pengaturan
async function getPengaturan(req, res) {
  try {
    const { rows } = await pool.query('SELECT key, value, deskripsi FROM pengaturan ORDER BY key ASC');
    // Ubah array menjadi object { key: value }
    const data = {};
    rows.forEach(r => { data[r.key] = { value: r.value, deskripsi: r.deskripsi }; });
    res.json({ success: true, data });
  } catch (err) {
    console.error('pengaturan.get:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// PUT /api/pengaturan — update banyak key sekaligus
async function updatePengaturan(req, res) {
  const updates = req.body; // { key: value, ... }
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'Tidak ada data yang dikirim' });
  }
  try {
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        'UPDATE pengaturan SET value=$1, updated_at=NOW() WHERE key=$2',
        [String(value), key]
      );
    }
    res.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  } catch (err) {
    console.error('pengaturan.update:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getPengaturan, updatePengaturan };
