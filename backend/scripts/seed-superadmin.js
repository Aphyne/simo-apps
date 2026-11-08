/**
 * Buat (atau reset password) akun superadmin / peneliti.
 * Akun ini TIDAK muncul di Manajemen User dan aktivitasnya tidak dicatat.
 *
 * Jalankan dari folder /backend:
 *   node scripts/seed-superadmin.js                     (username "peneliti", password acak)
 *   node scripts/seed-superadmin.js --username=budi
 *   node scripts/seed-superadmin.js --password=RahasiaKu123   (tentukan sendiri, min 8 karakter)
 *
 * Password acak ditampilkan SEKALI di terminal — catat. Tidak disimpan di file apa pun.
 */

require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../src/db/pool');

const arg = (name) => {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
};

async function main() {
  const username = arg('username') || 'peneliti';
  const diberikan = arg('password');
  if (diberikan && diberikan.length < 8) {
    console.error('Password minimal 8 karakter.');
    process.exit(1);
  }
  const password = diberikan || crypto.randomBytes(9).toString('base64url');
  const hash = await bcrypt.hash(password, 12);

  const { rows: ada } = await pool.query('SELECT id, role FROM users WHERE username = $1', [username]);
  if (ada.length && ada[0].role !== 'superadmin') {
    console.error(`Username "${username}" sudah dipakai akun ${ada[0].role}. Pilih username lain (--username=...).`);
    await pool.end();
    process.exit(1);
  }

  await pool.query(
    `INSERT INTO users (username, password, nama, role, is_active)
     VALUES ($1, $2, 'Peneliti', 'superadmin', true)
     ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, is_active = true, updated_at = NOW()`,
    [username, hash]
  );

  console.log(`\n✓ Akun superadmin siap.`);
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}${diberikan ? '' : '   (acak — catat sekarang, tidak ditampilkan lagi)'}\n`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
