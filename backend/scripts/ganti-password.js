// Ganti password akun di database yang dituju backend/.env (DATABASE_URL).
//
// Cara pakai (dijalankan sendiri oleh pemilik, di terminal):
//   cd backend
//   node scripts/ganti-password.js
//
// Password diketik lewat input tersembunyi — tidak ditampilkan, tidak masuk riwayat
// terminal, dan tidak pernah dicetak oleh skrip ini. Kosongkan input untuk melewati akun.
// Menggantikan backend/src/db/reset-admin.js yang menulis password 'password' secara tetap.

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const MIN_PANJANG = 8;
const DILARANG = ['password', '12345678', 'qwertyui', 'admin123'];

function tanyaTersembunyi(pertanyaan) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new Error('Harus dijalankan di terminal interaktif.'));
    process.stdout.write(pertanyaan);
    let nilai = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const onData = (ch) => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          return resolve(nilai);
        }
        if (c === '\u0003') { // Ctrl+C
          process.stdin.setRawMode(false);
          process.stdout.write('\nDibatalkan.\n');
          process.exit(130);
        }
        if (c === '\u007f' || c === '\b') nilai = nilai.slice(0, -1);
        else nilai += c;
      }
    };
    process.stdin.on('data', onData);
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tidak ditemukan di backend/.env');
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('channel_binding');
  const pool = new Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 });

  try {
    const { rows } = await pool.query('SELECT id, username, role FROM users ORDER BY id');
    console.log(`Database: ${url.hostname}`);
    console.log(`Akun ditemukan: ${rows.map((u) => `${u.username} (${u.role})`).join(', ')}\n`);

    for (const u of rows) {
      const baru = await tanyaTersembunyi(`Password baru untuk "${u.username}" (kosong = lewati): `);
      if (!baru) { console.log('  dilewati\n'); continue; }
      if (baru.length < MIN_PANJANG) { console.log(`  DITOLAK: minimal ${MIN_PANJANG} karakter\n`); continue; }
      if (baru.toLowerCase() === u.username.toLowerCase() || DILARANG.includes(baru.toLowerCase())) {
        console.log('  DITOLAK: terlalu mudah ditebak\n');
        continue;
      }
      const ulang = await tanyaTersembunyi('  Ketik ulang untuk konfirmasi: ');
      if (ulang !== baru) { console.log('  DITOLAK: konfirmasi tidak sama\n'); continue; }

      const hash = await bcrypt.hash(baru, 10);
      const r = await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hash, u.id]);
      console.log(r.rowCount === 1 ? `  OK: password "${u.username}" diganti\n` : '  GAGAL: baris tidak ditemukan\n');
    }
    console.log('Selesai. Sesi login lama baru berakhir saat tokennya kedaluwarsa (maks. 7 hari),');
    console.log('atau segera bila JWT_SECRET diganti lalu backend dijalankan ulang.');
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
