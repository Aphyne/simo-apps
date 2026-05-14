const { Pool } = require('pg');

// Hapus sslmode dari URL agar tidak ada conflict dengan konfigurasi ssl eksplisit di bawah.
// pg-connection-string v3 akan ubah perilaku sslmode=require, jadi kita handle SSL sendiri.
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete('sslmode');

const pool = new Pool({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});

module.exports = pool;
