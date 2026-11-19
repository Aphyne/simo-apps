// Data uji untuk uji per peran (HANYA Postgres lokal sementara). Dipanggil jalankan-uji-peran.js sesudah fix.js.
// Isi: akun peneliti dan staf2 (belum pernah aktif), supplier, enam obat (aman, mendekati ROP, harus reorder, habis),
// beberapa catatan stok oleh admin (dan satu tanpa pencatat), serta riwayat aktivitas 20 hari untuk halaman Pemantauan.
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

module.exports = async function seed(DB) {
  const c = new Client(DB);
  await c.connect();
  const h = bcrypt.hashSync('password', 10);
  for (const [u, n, r] of [['peneliti', 'Peneliti', 'superadmin'], ['staf2', 'Staf Dua', 'staf']]) {
    await c.query(
      `INSERT INTO users (username, password, nama, role, is_active) VALUES ($1,$2,$3,$4,true)
       ON CONFLICT (username) DO UPDATE SET password = $2, role = $4, is_active = true`, [u, h, n, r]);
  }
  await c.query('UPDATE users SET last_seen_at = NULL');
  const id = Object.fromEntries((await c.query('SELECT username, id, nama, role FROM users')).rows.map((r) => [r.username, r]));

  const sup = (await c.query("INSERT INTO supplier (nama) VALUES ('PBF Uji Peran') RETURNING id")).rows[0].id;
  const obat = [
    // kode, nama, kategori, satuan, isi/dus, hb, hj, stok, rop, D/tahun, S, H
    ['UJP-001', 'Paracetamol Uji 500mg', 'Analgesik', 'tablet', 10, 500, 800, 300, 60, 3650, 45000, 100],
    ['UJP-002', 'Amoxicillin Uji 500mg', 'Antibiotik', 'kapsul', 10, 1000, 1500, 40, 50, 1825, 45000, 200],
    ['UJP-003', 'Vitamin Uji C 500mg', 'Vitamin', 'tablet', 10, 600, 1000, 0, 40, 1460, 45000, 120],
    ['UJP-004', 'Antasida Uji DOEN', 'Antasida', 'tablet', 10, 300, 500, 70, 60, 2190, 45000, 60],
    ['UJP-005', 'Omeprazole Uji 20mg', 'Antasida', 'kapsul', 10, 1200, 2000, 500, 80, 1095, 45000, 240],
    ['UJP-006', 'Cetirizine Uji 10mg', 'Antihistamin', 'tablet', 10, 400, 700, 200, 30, 730, 45000, 80],
  ];
  const idObat = {};
  for (const [kode, nama, kat, sat, isi, hb, hj, stok, rop, D, S, H] of obat) {
    const eoq = Math.sqrt((2 * D * S) / H);
    const r = await c.query(
      `INSERT INTO obat (kode, nama, kategori, satuan, satuan_per_dus, harga_beli, harga_jual, stok, rop, safety_stock, eoq,
                         total_biaya, demand_harian, demand_tahunan, biaya_pesan, biaya_simpan, lead_time, expired_terdekat,
                         supplier_id, nama_supplier)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,5,$10,$11,$12,$13,$14,$15,3, CURRENT_DATE + 400, $16, 'PBF Uji Peran') RETURNING id`,
      [kode, nama, kat, sat, isi, hb, hj, stok, rop, eoq, (D / eoq) * S + (eoq / 2) * H, D / 365, D, S, H, sup]);
    idObat[kode] = r.rows[0].id;
  }

  // Catatan stok oleh admin (tidak bisa dibatalkan staf) dan satu stok keluar tanpa pencatat (data lama).
  await c.query(
    `INSERT INTO barang_masuk (tanggal, obat_id, jumlah_dus, jumlah_satuan, supplier_id, no_faktur, no_batch, expired_batch,
                               harga_beli, harga_jual, ppn_pct, user_id, stok_sebelum, stok_sesudah)
     VALUES (CURRENT_DATE - 1, $1, 2, 20, $2, 'F-ADMIN-UJI', 'BA1', CURRENT_DATE + 400, 555, 800, 11, $3, 280, 300)`,
    [idObat['UJP-001'], sup, id.admin.id]);
  await c.query(
    `INSERT INTO barang_keluar (tanggal, obat_id, jumlah, keterangan, user_id, stok_sebelum, stok_sesudah, harga_jual)
     VALUES (CURRENT_DATE - 1, $1, 5, 'Penjualan', $2, 305, 300, 800),
            (CURRENT_DATE - 2, $1, 2, 'Rusak', NULL, 307, 305, 800)`,
    [idObat['UJP-001'], id.admin.id]);

  // Riwayat aktivitas 20 hari (admin dan staf1) + 4 login gagal beruntun (username tidak dikenal) beberapa menit lalu.
  const halaman = ['/dashboard', '/obat', '/barang-masuk', '/barang-keluar', '/laporan'];
  const aksi = [['POST', '/api/barang-keluar', 'Menambah barang keluar'], ['POST', '/api/barang-masuk', 'Menambah barang masuk'], ['PUT', '/api/obat/1', 'Mengubah data obat'], ['DELETE', '/api/obat/9', 'Menghapus data obat']];
  let acak = 11;
  const r = (n) => { acak = (acak * 9301 + 49297) % 233280; return Math.floor((acak / 233280) * n); };
  for (let hari = 20; hari >= 1; hari--) {
    for (const u of [id.admin, id.staf1]) {
      if (r(10) < 2) continue;
      const jam = 8 + r(3);
      const t = (j, m) => `date_trunc('day', NOW() - INTERVAL '${hari} days') + INTERVAL '${j} hours ${m} minutes'`;
      const ins = (jenis, desk, path, metode, waktu) => c.query(
        `INSERT INTO log_aktivitas (user_id, username, nama, role, jenis, deskripsi, path, metode, ip, user_agent, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'10.0.0.5','Mozilla/5.0 (Windows NT 10.0) Chrome/130.0', ${waktu})`,
        [u.id, u.username, u.nama, u.role, jenis, desk, path, metode]);
      await ins('login', 'Login dengan username & password', '/api/auth/login', 'POST', t(jam, r(50)));
      for (let i = 0; i < 4 + r(5); i++) { const p = halaman[r(halaman.length)]; await ins('halaman', `Membuka halaman ${p}`, p, null, t(Math.min(jam + i, 20), r(59))); }
      for (let i = 0; i < r(4); i++) { const a = aksi[r(aksi.length)]; await ins('aksi', a[2], a[1], a[0], t(Math.min(jam + 1 + i, 20), r(59))); }
    }
  }
  for (let i = 0; i < 4; i++) {
    await c.query(`INSERT INTO log_aktivitas (username, jenis, deskripsi, path, metode, status_http, ip, user_agent)
                   VALUES ('kasir_baru','login_gagal','Login gagal (username tidak ditemukan/nonaktif)','/api/auth/login','POST',401,'10.0.0.9','Mozilla/5.0 (Linux; Android 14) Chrome/130.0')`);
  }
  await c.end();
};
