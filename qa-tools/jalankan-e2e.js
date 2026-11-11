// Menyalakan seluruh stack uji lokal lalu menjalankan uji browser Playwright, dan mematikannya lagi.
//   node jalankan-e2e.js                 -> pakai build frontend yang sudah ada (simo/simo/.next)
//   node jalankan-e2e.js --build         -> build frontend dulu dengan alamat API uji
//   node jalankan-e2e.js -- --update-snapshots   -> argumen setelah "--" diteruskan ke `playwright test`
// Aman: Postgres lokal sementara (pgenv/preload.js menolak DB selain lokal). Tidak menyentuh Neon.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const REPO = path.join(ROOT, '..');
const FE_DIR = path.join(REPO, 'simo');
const BE_DIR = path.join(REPO, 'backend');
const PG = path.join(ROOT, 'pgenv');
const DB = 'postgresql://qa:qa@localhost:54329/simo_qa';
const BE_PORT = 8032;
const FE_PORT = 3010;
const API_URL = `http://localhost:${BE_PORT}/api`;

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
const bawaPW = sep >= 0 ? argv.slice(sep + 1) : [];
const adaBuild = argv.slice(0, sep >= 0 ? sep : undefined).includes('--build');

const anak = [];
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
async function siap(url, label, batasDetik = 60) {
  for (let i = 0; i < batasDetik * 2; i++) {
    try { const r = await fetch(url, { redirect: 'manual' }); if (r.status) return; } catch { /* belum siap */ }
    await tunggu(500);
  }
  throw new Error(`${label} tidak siap dalam ${batasDetik} detik`);
}
function mulai(cmd, args, opsi) {
  const p = spawn(cmd, args, { stdio: 'ignore', ...opsi });
  anak.push(p);
  return p;
}

async function bersihkan() {
  for (const p of anak) { try { p.kill(); } catch { /* sudah mati */ } }
  fs.writeFileSync(path.join(PG, 'pg.stop'), '');
  await tunggu(3000);
  for (const f of ['pg.stop', 'pg.ready']) { try { fs.rmSync(path.join(PG, f)); } catch { /* tidak ada */ } }
}

(async () => {
  let kode = 1;
  try {
    if (adaBuild) {
      console.log('> build frontend (alamat API uji tertanam)…');
      const b = spawnSync(process.execPath, [path.join(FE_DIR, 'node_modules/next/dist/bin/next'), 'build'], {
        cwd: FE_DIR, stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_API_URL: API_URL },
      });
      if (b.status !== 0) throw new Error('build frontend gagal');
    } else if (!fs.existsSync(path.join(FE_DIR, '.next'))) {
      throw new Error('simo/simo/.next belum ada. Jalankan dengan --build.');
    }

    console.log('> Postgres lokal sementara…');
    for (const f of ['pg.ready', 'pg.stop']) { try { fs.rmSync(path.join(PG, f)); } catch { /* tidak ada */ } }
    fs.rmSync(path.join(PG, 'data'), { recursive: true, force: true });
    mulai(process.execPath, [path.join(PG, 'up.js')], { cwd: PG });
    for (let i = 0; i < 120 && !fs.existsSync(path.join(PG, 'pg.ready')); i++) await tunggu(1000);
    if (!fs.existsSync(path.join(PG, 'pg.ready'))) throw new Error('Postgres lokal tidak siap');
    const fix = spawnSync(process.execPath, [path.join(PG, 'fix.js')], { cwd: PG, encoding: 'utf8' });
    if (fix.status !== 0) throw new Error('fix.js gagal: ' + fix.stderr);

    // Akun peneliti (superadmin) hanya di DB lokal, password 'password'.
    const { Client } = require('pg');
    const bcrypt = require('bcryptjs');
    const c = new Client(DB); await c.connect();
    await c.query(
      `INSERT INTO users (username, password, nama, role, is_active)
       SELECT 'peneliti', $1, 'Peneliti', 'superadmin', true
       WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'peneliti')`,
      [bcrypt.hashSync('password', 10)]
    );
    await c.end();

    console.log('> backend uji (port %d)…', BE_PORT);
    mulai(process.execPath, ['-r', path.join(PG, 'preload.js'), 'src/app.js'], {
      cwd: BE_DIR,
      env: {
        ...process.env, NODE_ENV: 'development', PORT: String(BE_PORT), DATABASE_URL: DB,
        JWT_SECRET: crypto.randomBytes(48).toString('hex'), FRONTEND_URL: `http://localhost:${FE_PORT}`,
      },
    });
    await siap(`http://localhost:${BE_PORT}/api/health`, 'backend');

    console.log('> frontend next start (port %d)…', FE_PORT);
    mulai(process.execPath, [path.join(FE_DIR, 'node_modules/next/dist/bin/next'), 'start', '-p', String(FE_PORT)], { cwd: FE_DIR });
    await siap(`http://localhost:${FE_PORT}/login`, 'frontend');

    console.log('> playwright test…\n');
    const pw = spawnSync(process.execPath, [path.join(ROOT, 'node_modules/@playwright/test/cli.js'), 'test', ...bawaPW], {
      cwd: ROOT, stdio: 'inherit',
      env: { ...process.env, SIMO_FE_URL: `http://localhost:${FE_PORT}`, SIMO_BE_URL: `http://localhost:${BE_PORT}` },
    });
    kode = pw.status ?? 1;
  } catch (e) {
    console.error('GAGAL:', e.message);
  } finally {
    await bersihkan();
  }
  process.exit(kode);
})();
