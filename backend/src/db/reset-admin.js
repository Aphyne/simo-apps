require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete('sslmode');
url.searchParams.delete('channel_binding');

const pool = new Pool({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function run() {
  const hash = await bcrypt.hash('password', 10);
  await pool.query(
    'UPDATE users SET password = $1 WHERE username = $2',
    [hash, 'admin']
  );
  console.log('Password admin berhasil direset ke: password');
  await pool.end();
}

run().catch(console.error);
