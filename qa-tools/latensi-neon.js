const REPO = require('path').resolve(__dirname, '..').split(require('path').sep).join('/');
// Ukur latensi SEBENARNYA ke Neon: hanya request GET (baca), token ditandatangani lokal.
// Tidak ada login, tidak ada tulis. Tidak mencetak rahasia.
const B = REPO + '/backend/node_modules/';
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { Client } = require('pg');
const { spawn } = require('child_process');
const fs = require('fs');
const env = dotenv.parse(fs.readFileSync(REPO + '/backend/.env'));
const PORT = 8031, BASE = `http://localhost:${PORT}`;
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

(async () => {
  const url = new URL(env.DATABASE_URL); url.searchParams.delete('sslmode'); url.searchParams.delete('channel_binding');
  const c = new Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
  await c.connect();
  const t0 = Date.now(); await c.query('SELECT 1'); const rtt1 = Date.now() - t0;
  const rtts = []; for (let i = 0; i < 10; i++) { const t = Date.now(); await c.query('SELECT 1'); rtts.push(Date.now() - t); }
  const adm = (await c.query("SELECT id, username, nama, role FROM users WHERE username='admin'")).rows[0];
  const obat = (await c.query('SELECT id FROM obat ORDER BY id LIMIT 1')).rows[0];
  await c.end();
  console.log(`SELECT 1 ke Neon: pertama ${rtt1} ms, median 10x ${pct(rtts, 0.5)} ms, maks ${Math.max(...rtts)} ms`);

  const token = jwt.sign({ id: adm.id, username: adm.username, nama: adm.nama, role: adm.role }, env.JWT_SECRET, { expiresIn: '10m' });
  const srv = spawn('node', ['src/app.js'], { cwd: REPO + '/backend', env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  let ready = false;
  for (let i = 0; i < 50 && !ready; i++) { try { ready = (await fetch(BASE + '/api/health')).ok; } catch { await new Promise(r => setTimeout(r, 400)); } }
  if (!ready) { console.log('server tidak start'); srv.kill(); process.exit(1); }

  const get = async (p) => { const t = Date.now(); const r = await fetch(BASE + p, { headers: { Authorization: 'Bearer ' + token } }); await r.text(); return { s: r.status, ms: Date.now() - t }; };
  const eps = ['/api/dashboard/summary', '/api/obat?page=1&limit=10', '/api/monitoring', '/api/laporan/stok', '/api/obat/' + obat.id, '/api/dashboard/tren-permintaan', '/api/barang-keluar?limit=15'];
  console.log('\n| endpoint | status | pertama (dingin) | median 8x | p95 | maks |');
  console.log('|---|---|---|---|---|---|');
  for (const p of eps) {
    const first = await get(p); const ms = [];
    let st = first.s;
    for (let i = 0; i < 8; i++) { const r = await get(p); ms.push(r.ms); if (r.s !== 200) st = r.s; }
    console.log(`| ${p} | ${st} | ${first.ms} ms | ${pct(ms, 0.5)} ms | ${pct(ms, 0.95)} ms | ${Math.max(...ms)} ms |`);
  }
  // beban ringan realistis: 5 pengguna bersamaan membuka dashboard + obat
  const t = Date.now();
  const rs = await Promise.all(Array.from({ length: 10 }, (_, i) => get(i % 2 ? '/api/dashboard/summary' : '/api/obat?page=1&limit=10')));
  console.log(`\n10 request bersamaan (5 pengguna): total ${Date.now() - t} ms, status ${[...new Set(rs.map(r => r.s))].join(',')}, terlama ${Math.max(...rs.map(r => r.ms))} ms`);
  srv.kill();
  process.exit(0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
