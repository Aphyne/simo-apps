const { Pool } = require('pg');

const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete('sslmode');
url.searchParams.delete('channel_binding');

const pool = new Pool({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 10000,
  max: 3,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});

// Override pool.query dengan auto-retry agar semua controller tidak perlu diubah
const originalQuery = pool.query.bind(pool);
pool.query = async (text, params) => {
  try {
    return await originalQuery(text, params);
  } catch (err) {
    const isConnError =
      err.message?.includes('Connection terminated') ||
      err.message?.includes('connection timeout') ||
      err.code === 'ECONNRESET';
    if (isConnError) {
      await new Promise(r => setTimeout(r, 2000));
      return await originalQuery(text, params);
    }
    throw err;
  }
};

module.exports = pool;
