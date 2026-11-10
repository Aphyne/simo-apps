/**
 * Backup logis database SIMO ke satu berkas JSON berstempel waktu.
 *
 * - Node + pg saja (tanpa pg_dump). Hanya SELECT, dalam transaksi READ ONLY
 *   dengan snapshot tunggal (semua tabel konsisten pada satu titik waktu).
 * - Semua nilai kolom diekspor sebagai teks Postgres, sehingga tanggal, numerik,
 *   dan JSON kembali persis sama saat restore (lihat restore-db.js).
 * - Berkas berisi data sensitif (termasuk hash password): simpan aman, jangan commit.
 *   Folder keluaran default backend/backups/ sudah ada di .gitignore.
 *
 * Pemakaian (dari folder backend):
 *   node scripts/backup-db.js [--out <folder>]
 * Sumber: DATABASE_URL dari environment atau backend/.env (tidak pernah dicetak).
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const LOCAL = new Set(['localhost', '127.0.0.1', '::1']);
const argOut = process.argv.indexOf('--out');
const outDir = path.resolve(argOut > -1 ? process.argv[argOut + 1] : path.join(__dirname, '..', 'backups'));

// Urutan tabel: induk sebelum anak (berdasar foreign key) agar restore tidak melanggar FK.
function urutkan(tabel, fk) {
  const sisa = new Set(tabel), hasil = [];
  while (sisa.size) {
    const siap = [...sisa].filter(t => fk.filter(f => f.anak === t && f.induk !== t).every(f => !sisa.has(f.induk)));
    if (!siap.length) { hasil.push(...[...sisa].sort()); break; } // siklus FK: urutan alfabet
    siap.sort().forEach(t => { hasil.push(t); sisa.delete(t); });
  }
  return hasil;
}

(async () => {
  if (!process.env.DATABASE_URL) { console.error('DATABASE_URL tidak ditemukan (env atau backend/.env).'); process.exit(1); }
  const url = new URL(process.env.DATABASE_URL);
  const lokal = LOCAL.has(url.hostname);
  url.searchParams.delete('sslmode'); url.searchParams.delete('channel_binding');
  const c = new Client({ connectionString: url.toString(), ssl: lokal ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 });
  await c.connect();
  try {
    await c.query('BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ');
    const t = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY 1");
    const names = t.rows.map(r => r.table_name);
    const fkr = await c.query("SELECT conrelid::regclass::text AS anak, confrelid::regclass::text AS induk FROM pg_constraint WHERE contype='f'");
    const urut = urutkan(names, fkr.rows);
    const data = { dibuat: new Date().toISOString(), versi: 1, urutan: urut, tabel: {} };
    const ringkas = [];
    for (const n of urut) {
      const cols = (await c.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [n])).rows.map(r => r.column_name);
      const sel = cols.map(k => `"${k}"::text AS "${k}"`).join(', ');
      const rows = (await c.query(`SELECT ${sel} FROM "${n}"`)).rows;
      data.tabel[n] = { kolom: cols, baris: rows };
      ringkas.push([n, rows.length]);
    }
    await c.query('COMMIT');
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
    const file = path.join(outDir, `simo-backup-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify(data), { mode: 0o600 });
    console.log('Backup selesai:', file);
    console.log('Ukuran:', (fs.statSync(file).size / 1024).toFixed(1), 'KB');
    for (const [n, k] of ringkas) console.log(`  ${n}: ${k} baris`);
  } finally {
    await c.end();
  }
})().catch(e => { console.error('Backup gagal:', e.message.split('\n')[0]); process.exit(1); });
