const { Client } = require('pg');
const bc = require('bcryptjs');
(async () => {
  const c = new Client('postgresql://qa:qa@localhost:54329/simo_qa'); await c.connect();
  await c.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE');
  const h = bc.hashSync('password', 10);
  await c.query('UPDATE users SET password=$1, is_active=true', [h]);
  console.log((await c.query('select username,role,is_active from users')).rows);
  await c.end();
})();
