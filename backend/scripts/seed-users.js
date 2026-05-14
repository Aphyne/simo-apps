require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../src/db/pool');

async function seedUsers() {
  const password = 'password';
  const hash = await bcrypt.hash(password, 12);

  console.log('\n[seed-users] Hash yang dibuat:', hash);

  const users = [
    { username: 'admin', nama: 'Admin Apotek Rezky Medika', role: 'admin' },
    { username: 'staf1', nama: 'Staf Apotek', role: 'staf' },
  ];

  const client = await pool.connect();
  try {
    for (const u of users) {
      const { rows } = await client.query(
        `INSERT INTO users (username, password, nama, role, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (username) DO UPDATE
           SET password = EXCLUDED.password,
               is_active = true
         RETURNING id, username, role`,
        [u.username, hash, u.nama, u.role]
      );
      console.log(`[seed-users] ✓ ${rows[0].username} (${rows[0].role}) — id: ${rows[0].id}`);
    }

    console.log('\n[seed-users] Selesai. Login dengan:');
    console.log('  Username: admin  | Password: password');
    console.log('  Username: staf1  | Password: password\n');
  } finally {
    client.release();
    pool.end();
  }
}

seedUsers().catch((err) => {
  console.error('[seed-users] Error:', err.message);
  process.exit(1);
});
