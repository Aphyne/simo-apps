const REPO = require('path').resolve(__dirname, '..').split(require('path').sep).join('/');
// Smoke test MODE PRODUKSI: backend NODE_ENV=production (DB lokal sementara) + frontend `next start`.
const { spawn } = require('child_process');
const crypto = require('crypto');
const SP = require('path').join(__dirname,'pgenv');
const DB = 'postgresql://qa:qa@localhost:54329/simo_qa';
const BE = 'http://localhost:8032', FE = 'http://localhost:3010';
const out = [];
const rec = (id, nama, ok, d) => { out.push(ok); console.log(`${ok ? 'LULUS' : 'GAGAL'} | ${id} | ${nama}${d ? ' -> ' + d : ''}`); };
const wait = async (url) => { for (let i = 0; i < 60; i++) { try { const r = await fetch(url, { redirect: 'manual' }); if (r.status) return true; } catch {} await new Promise(r => setTimeout(r, 500)); } return false; };
const login = (u, p, ip) => fetch(BE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify({ username: u, password: p }) });

(async () => {
  const be = spawn('node', ['-r', SP + '/preload.js', 'src/app.js'], {
    cwd: REPO + '/backend', stdio: 'ignore',
    env: { ...process.env, NODE_ENV: 'production', PORT: '8032', DATABASE_URL: DB, JWT_SECRET: crypto.randomBytes(48).toString('hex'), FRONTEND_URL: 'https://simo.test', TRUST_PROXY: '1' },
  });
  const fe = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3010'], { cwd: REPO + '/simo', stdio: 'ignore' });
  try {
    rec('BOOT-BE', 'Backend mode produksi menyala dengan konfigurasi sehat', await wait(BE + '/api/health'));
    rec('BOOT-FE', 'Frontend hasil build menyala (next start)', await wait(FE + '/login'));

    let r = await fetch(BE + '/api/health', { headers: { Origin: 'https://simo.test' } });
    rec('HDR-1', 'X-Powered-By tidak ada', !r.headers.get('x-powered-by'));
    rec('HDR-2', 'Header keamanan (nosniff, HSTS, frame)', !!r.headers.get('x-content-type-options') && !!r.headers.get('strict-transport-security') && !!(r.headers.get('x-frame-options') || r.headers.get('content-security-policy')), `hsts=${!!r.headers.get('strict-transport-security')}`);
    rec('CORS-1', 'Origin frontend produksi diizinkan', r.headers.get('access-control-allow-origin') === 'https://simo.test');
    r = await fetch(BE + '/api/health', { headers: { Origin: 'https://evil.test' } });
    rec('CORS-2', 'Origin asing tidak diizinkan', r.headers.get('access-control-allow-origin') !== 'https://evil.test');

    // pembatas login per-IP di belakang proxy
    const kode = []; for (let i = 0; i < 12; i++) kode.push((await login('admin', 'salah' + i, '10.0.0.1')).status);
    rec('RATE-1', 'IP-A: 10 gagal pertama 401, berikutnya 429', kode.slice(0, 10).every(s => s === 401) && kode.slice(10).every(s => s === 429), kode.join(','));
    r = await login('admin', 'salah', '10.0.0.2');
    rec('RATE-2', 'IP-B (pengguna lain) TIDAK ikut terkunci', r.status === 401, 'status ' + r.status);
    r = await login('admin', 'password', '10.0.0.2');
    const tok = (await r.json()).data?.token;
    rec('RATE-3', 'IP-B login benar tetap bisa', r.status === 200 && !!tok, 'status ' + r.status);

    const H = { Authorization: 'Bearer ' + tok };
    r = await fetch(BE + '/api/obat', { headers: H }); rec('AUTH-1', 'Token valid -> /obat 200', r.status === 200);
    await fetch(BE + '/api/auth/logout', { method: 'POST', headers: H });
    r = await fetch(BE + '/api/obat', { headers: H }); rec('AUTH-2', 'Setelah logout token ditolak 401', r.status === 401);

    // frontend: penjagaan rute oleh middleware
    r = await fetch(FE + '/login', { redirect: 'manual' }); rec('FE-1', '/login terbuka (200)', r.status === 200, 'status ' + r.status);
    for (const p of ['/dashboard', '/obat', '/users', '/laporan']) {
      r = await fetch(FE + p, { redirect: 'manual' });
      rec('FE-2', `${p} tanpa cookie diarahkan ke /login`, [307, 308].includes(r.status) && (r.headers.get('location') || '').includes('/login'), `status ${r.status}`);
    }
    r = await fetch(FE + '/dashboard', { redirect: 'manual', headers: { Cookie: 'simo_token=x' } });
    rec('FE-3', '/dashboard dengan cookie -> 200', r.status === 200, 'status ' + r.status);
    r = await fetch(FE + '/halaman-tidak-ada', { redirect: 'manual', headers: { Cookie: 'simo_token=x' } });
    const html = await r.text();
    rec('FE-4', 'Halaman tidak ada -> 404 (bukan layar kosong)', r.status === 404 && /tidak ditemukan/i.test(html), 'status ' + r.status);
  } catch (e) { console.log('ERR', e.message); }
  be.kill(); fe.kill();
  console.log(`\nRINGKAS: ${out.filter(Boolean).length} lulus, ${out.filter(x => !x).length} gagal dari ${out.length}`);
  process.exit(0);
})();
