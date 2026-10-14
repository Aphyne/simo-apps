const pool = require('../db/pool');
const { hitungUlangObat, updateExpiredTerdekat } = require('../services/stokService');
const { hitungDemandDariRiwayat } = require('../services/demandService');

// Error yang sengaja dilempar dari dalam transaksi createBulk — dibedakan dari
// error tak terduga supaya bisa direspon sebagai 400 (kesalahan input), bukan 500.
class BulkValidationError extends Error {}

async function getAll(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const keterangan = req.query.keterangan?.trim() || '';
    const tanggal = req.query.tanggal?.trim() || '';
    const dari = req.query.dari?.trim() || '';
    const sampai = req.query.sampai?.trim() || '';

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
    if (tanggal) {
      params.push(tanggal);
      conditions.push(`bk.tanggal = $${params.length}`);
    }
    if (dari) {
      params.push(dari);
      conditions.push(`bk.tanggal >= $${params.length}`);
    }
    if (sampai) {
      params.push(sampai);
      conditions.push(`bk.tanggal <= $${params.length}`);
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
         (tanggal, obat_id, jumlah, keterangan, catatan, user_id, stok_sebelum, stok_sesudah, harga_jual)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [tanggal, obat_id, jumlah, keterangan, catatan || null, user_id, stok_sebelum, stok_sesudah, obat.harga_jual]
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

// Edit satu baris barang keluar (admin only). Obat TIDAK bisa diganti — kalau obatnya
// salah, hapus baris ini dan catat ulang. Efek stok lama ditarik balik (+jumlah lama),
// baru efek baru diterapkan (-jumlah baru), dalam 1 transaksi atomik.
async function update(req, res) {
  const { id } = req.params;
  const { tanggal, jumlah, keterangan, catatan } = req.body;

  if (!tanggal || !jumlah || parseInt(jumlah) <= 0 || !keterangan) {
    return res.status(400).json({ success: false, message: 'Tanggal, jumlah (lebih dari 0), dan keterangan wajib diisi' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: bkRows } = await client.query('SELECT * FROM barang_keluar WHERE id = $1 FOR UPDATE', [id]);
    if (!bkRows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ success: false, message: 'Data barang keluar tidak ditemukan' });
    }
    const old = bkRows[0];

    const { rows: obatRows } = await client.query('SELECT * FROM obat WHERE id = $1 FOR UPDATE', [old.obat_id]);
    const obat = obatRows[0];

    const jumlah_baru = parseInt(jumlah);
    const stok_setelah_reverse = obat.stok + old.jumlah;
    const stok_baru = stok_setelah_reverse - jumlah_baru;

    if (stok_baru < 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        success: false,
        message: `Jumlah baru melebihi stok yang tersedia (tersedia ${stok_setelah_reverse} ${obat.satuan})`,
      });
    }

    const { rows: updated } = await client.query(
      `UPDATE barang_keluar SET tanggal=$1, jumlah=$2, keterangan=$3, catatan=$4, stok_sebelum=$5, stok_sesudah=$6
       WHERE id=$7
       RETURNING *`,
      [tanggal, jumlah_baru, keterangan, catatan || null, stok_setelah_reverse, stok_baru, id]
    );

    await client.query('UPDATE obat SET stok=$1, updated_at=NOW() WHERE id=$2', [stok_baru, obat.id]);

    await client.query('COMMIT');
    client.release();

    if (keterangan === 'Penjualan' || old.keterangan === 'Penjualan') {
      const demand = await hitungDemandDariRiwayat(obat.id);
      if (demand) {
        await pool.query(
          'UPDATE obat SET demand_harian = $1, demand_tahunan = $2, std_dev_demand = $3 WHERE id = $4',
          [demand.demand_harian, demand.demand_tahunan, demand.std_dev_demand, obat.id]
        );
      }
    }
    await updateExpiredTerdekat(obat.id);
    const obatUpdated = await hitungUlangObat(obat.id);
    const reorder_alert = obatUpdated.rop !== null && stok_baru <= parseFloat(obatUpdated.rop);

    res.json({
      success: true,
      data: { ...updated[0], nama_obat: obat.nama, kode_obat: obat.kode, satuan: obat.satuan },
      reorder_alert,
      message: 'Barang keluar berhasil diperbarui',
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('barangKeluar.update:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Hapus satu baris barang keluar (admin only). Stok ditarik balik (ditambah lagi) —
// arahnya kebalikan dari barang masuk, jadi tidak pernah bisa bikin stok minus.
async function remove(req, res) {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: bkRows } = await client.query('SELECT * FROM barang_keluar WHERE id = $1 FOR UPDATE', [id]);
    if (!bkRows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ success: false, message: 'Data barang keluar tidak ditemukan' });
    }
    const old = bkRows[0];

    const { rows: obatRows } = await client.query('SELECT * FROM obat WHERE id = $1 FOR UPDATE', [old.obat_id]);
    const obat = obatRows[0];
    const stok_baru = obat.stok + old.jumlah;

    await client.query('DELETE FROM barang_keluar WHERE id = $1', [id]);
    await client.query('UPDATE obat SET stok = $1, updated_at = NOW() WHERE id = $2', [stok_baru, obat.id]);

    await client.query('COMMIT');
    client.release();

    if (old.keterangan === 'Penjualan') {
      const demand = await hitungDemandDariRiwayat(obat.id);
      if (demand) {
        await pool.query(
          'UPDATE obat SET demand_harian = $1, demand_tahunan = $2, std_dev_demand = $3 WHERE id = $4',
          [demand.demand_harian, demand.demand_tahunan, demand.std_dev_demand, obat.id]
        );
      }
    }
    await updateExpiredTerdekat(obat.id);
    await hitungUlangObat(obat.id);

    res.json({ success: true, message: 'Barang keluar berhasil dihapus' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('barangKeluar.remove:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Catat beberapa obat sekaligus dalam satu transaksi ("keranjang") — dipakai form
// multi-item Barang Keluar. Kalau ada satu item gagal (obat tidak ada / stok kurang),
// semua item di-rollback, tidak ada yang setengah tercatat.
async function createBulk(req, res) {
  const { tanggal, keterangan, catatan, items } = req.body;
  const user_id = req.user?.id ?? null;

  if (!tanggal || !keterangan) {
    return res.status(400).json({ success: false, message: 'Tanggal dan keterangan wajib diisi' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Minimal 1 obat harus diisi' });
  }
  for (const item of items) {
    if (!item.obat_id || !item.jumlah || parseInt(item.jumlah) <= 0) {
      return res.status(400).json({ success: false, message: 'Setiap baris harus punya obat dan jumlah lebih dari 0' });
    }
  }

  const client = await pool.connect();
  let hasil = [];
  try {
    await client.query('BEGIN');

    for (const item of items) {
      // FOR UPDATE mengunci baris obat ini sampai transaksi selesai — mencegah
      // request lain (form manual/import lain) membaca stok yang sama secara bersamaan.
      const { rows: obatRows } = await client.query('SELECT * FROM obat WHERE id = $1 FOR UPDATE', [item.obat_id]);
      if (!obatRows.length) {
        throw new BulkValidationError(`Obat dengan ID ${item.obat_id} tidak ditemukan`);
      }
      const obat = obatRows[0];
      const jumlah = parseInt(item.jumlah);

      if (obat.stok < jumlah) {
        throw new BulkValidationError(
          `Stok ${obat.nama} tidak cukup (tersedia ${obat.stok} ${obat.satuan}, diminta ${jumlah})`
        );
      }

      const stok_sebelum = obat.stok;
      const stok_sesudah = stok_sebelum - jumlah;

      const { rows } = await client.query(
        `INSERT INTO barang_keluar
           (tanggal, obat_id, jumlah, keterangan, catatan, user_id, stok_sebelum, stok_sesudah, harga_jual)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [tanggal, obat.id, jumlah, keterangan, catatan || null, user_id, stok_sebelum, stok_sesudah, obat.harga_jual]
      );

      await client.query('UPDATE obat SET stok = $1, updated_at = NOW() WHERE id = $2', [stok_sesudah, obat.id]);

      hasil.push({
        barang_keluar: rows[0],
        obat_id: obat.id,
        nama_obat: obat.nama,
        kode_obat: obat.kode,
        satuan: obat.satuan,
        jumlah,
        stok_sesudah,
      });
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    if (err instanceof BulkValidationError) {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error('barangKeluar.createBulk:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
  client.release();

  // Setelah commit: hitung ulang demand/EOQ/ROP per obat yang kena dampak.
  // Ini kalkulasi turunan (cache), kegagalannya tidak boleh membatalkan data
  // yang sudah tersimpan — makanya di-try/catch per obat, bukan ikut transaksi di atas.
  const reorder_alerts = [];
  for (const h of hasil) {
    try {
      if (keterangan === 'Penjualan') {
        const demand = await hitungDemandDariRiwayat(h.obat_id);
        if (demand) {
          await pool.query(
            'UPDATE obat SET demand_harian = $1, demand_tahunan = $2, std_dev_demand = $3 WHERE id = $4',
            [demand.demand_harian, demand.demand_tahunan, demand.std_dev_demand, h.obat_id]
          );
        }
      }
      await updateExpiredTerdekat(h.obat_id);
      const obatUpdated = await hitungUlangObat(h.obat_id);

      if (obatUpdated.rop !== null && h.stok_sesudah <= parseFloat(obatUpdated.rop)) {
        reorder_alerts.push({
          obat_id: h.obat_id,
          nama_obat: h.nama_obat,
          stok_sesudah: h.stok_sesudah,
          rop: obatUpdated.rop,
        });
      }
    } catch (err) {
      console.error(`barangKeluar.createBulk — hitung ulang obat ${h.obat_id} gagal:`, err);
    }
  }

  res.status(201).json({
    success: true,
    data: hasil,
    reorder_alerts,
    message: `${hasil.length} obat berhasil dicatat`,
  });
}

module.exports = { getAll, create, createBulk, update, remove };
