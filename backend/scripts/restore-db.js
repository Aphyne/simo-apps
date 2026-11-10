/**
 * Restore backup logis (hasil backup-db.js) ke Postgres LOKAL untuk uji/verifikasi.
 *
 * Pengaman:
 * - Hanya host localhost/127.0.0.1/::1. Host lain ditolak (tidak bisa merestore ke Neon dari sini).
 * - Target dibaca dari RESTORE_DATABASE_URL (bukan DATABASE_URL), supaya tidak salah sasaran.
 * - Skema harus sudah ada (jalankan migrasi di DB lokal lebih dulu). Skrip ini hanya memuat DATA.
 * - Menolak bila ada tabel yang sudah berisi baris, kecuali memakai --timpa (TRUNCATE semua tabel di berkas).
 *
 * Pemakaian (dari folder backend):
 *   RESTORE_DATABASE_URL=postgresql://user:pass@localhost:54329/nama_db node scripts/restore-db.js <berkas.json> [--timpa]
 */
const fs = require('fs');
const { Client } = require('pg');

const LOCAL = new Set(['localhost', '127.0.0.1', '::1']);
const file = process.argv[2];
const timpa = process.argv.includes('--timpa');

(async () => {
  if (!file || file.startsWith('--')) { console.error('Pemakaian: node scripts/restore-db.js <berkas.json> [--timpa]'); process.exit(1); }
  const raw = process.env.RESTORE_DATABASE_URL;
  if (!raw) { console.error('Set RESTORE_DATABASE_URL ke Postgres lokal uji.'); process.exit(1); }
  const url = new URL(raw);
  if (!LOCAL.has(url.hostname)) { console.error('DITOLAK: restore hanya boleh ke Postgres lokal (localhost/127.0.0.1).'); process.exit(2); }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const c = new Client({ connectionString: raw, ssl: false });
  await c.connect();
  try {
    const ada = (await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")).rows.map(r => r.table_name);
    const hilang = data.urutan.filter(n => !ada.includes(n));
    if (hilang.length) { console.error('DITOLAK: tabel belum ada di target (jalankan migrasi dulu):', hilang.join(', ')); process.exit(3); }
    const terisi = [];
    for (const n of data.urutan) { if ((await c.query(`SELECT 1 FROM "${n}" LIMIT 1`)).rowCount) terisi.push(n); }
    if (terisi.length && !timpa) { console.error('DITOLAK: target tidak kosong (' + terisi.join(', ') + '). Pakai --timpa bila yakin ini DB uji.'); process.exit(4); }
    await c.query('BEGIN');
    if (terisi.length) await c.query('TRUNCATE ' + data.urutan.map(n => `"${n}"`).join(', ') + ' RESTART IDENTITY CASCADE');
    for (const n of data.urutan) {
      const { baris } = data.tabel[n];
      if (!baris.length) { console.log(`  ${n}: 0 baris`); continue; }
      // jsonb_populate_recordset mengubah teks kembali ke tipe asli kolom (tanggal, numerik, json, dst.)
      for (let i = 0; i < baris.length; i += 500) {
        await c.query(`INSERT INTO "${n}" SELECT * FROM jsonb_populate_recordset(NULL::"${n}", $1::jsonb)`, [JSON.stringify(baris.slice(i, i + 500))]);
      }
      const seq = (await c.query('SELECT a.attname AS kol, pg_get_serial_sequence($1, a.attname) AS seq FROM pg_attribute a WHERE a.attrelid=$1::regclass AND a.attnum>0 AND NOT a.attisdropped', [`"${n}"`])).rows.filter(r => r.seq);
      for (const s of seq) await c.query(`SELECT setval($1, COALESCE((SELECT MAX("${s.kol}") FROM "${n}"), 1))`, [s.seq]);
      console.log(`  ${n}: ${baris.length} baris`);
    }
    await c.query('COMMIT');
    console.log('Restore selesai.');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch {}
    throw e;
  } finally { await c.end(); }
})().catch(e => { console.error('Restore gagal:', e.message.split('\n')[0]); process.exit(1); });
