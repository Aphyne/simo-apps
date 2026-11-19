// Uji per peran (Login, Staf, Peneliti) memakai SERVER DEV YANG SEDANG JALAN di port 3000 (`npm run dev` di simo/simo),
// tanpa build dan tanpa menyentuh folder .next. Panggilan API dari browser dialihkan ke backend uji lokal (port 8038)
// dengan Postgres lokal sementara (port 54329), jadi tidak menyentuh Neon/production.
//   node jalankan-uji-peran.js                  -> semua uji di uji-peran/
//   node jalankan-uji-peran.js -- -g "Staf"      -> argumen setelah "--" diteruskan ke `playwright test`
// Laporan web: npx playwright show-report hasil/laporan-peran-html
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const REPO = path.join(ROOT, '..');
const BE_DIR = path.join(REPO, 'backend');
const FE_DIR = path.join(REPO, 'simo');
const PG = path.join(ROOT, 'pgenv');
const DB = 'postgresql://qa:qa@localhost:54329/simo_qa';
const BE_PORT = 8038;
const FE_URL = 'http://localhost:3000';

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
const bawaPW = sep >= 0 ? argv.slice(sep + 1) : [];

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
// Server dev yang dinyalakan skrip ini sendiri (bila port 3000 kosong); dimatikan bersama proses turunannya di akhir.
let devSendiri = null;
function matikanPohon(p) {
  if (!p || p.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { p.kill(); } catch { /* sudah mati */ } }
}
async function bersihkan() {
  matikanPohon(devSendiri);
  for (const p of anak) { try { p.kill(); } catch { /* sudah mati */ } }
  fs.writeFileSync(path.join(PG, 'pg.stop'), '');
  await tunggu(3000);
  for (const f of ['pg.stop', 'pg.ready']) { try { fs.rmSync(path.join(PG, f)); } catch { /* tidak ada */ } }
}

(async () => {
  let kode = 1;
  try {
    console.log('> cek server dev frontend di port 3000…');
    try {
      await siap(`${FE_URL}/login`, 'server dev', 5);
      console.log('  memakai server dev yang sudah menyala (tidak dimatikan di akhir)');
    } catch {
      // Port 3000 kosong: nyalakan `next dev` sendiri (tidak membangun dan tidak menghapus .next), matikan di akhir.
      console.log('  port 3000 kosong: menyalakan next dev sendiri (dimatikan lagi di akhir)…');
      devSendiri = spawn(process.execPath, [path.join(FE_DIR, 'node_modules/next/dist/bin/next'), 'dev', '-p', '3000'], { cwd: FE_DIR, stdio: 'ignore' });
      await siap(`${FE_URL}/login`, 'server dev', 180);
    }

    console.log('> Postgres lokal sementara…');
    for (const f of ['pg.ready', 'pg.stop']) { try { fs.rmSync(path.join(PG, f)); } catch { /* tidak ada */ } }
    fs.rmSync(path.join(PG, 'data'), { recursive: true, force: true });
    mulai(process.execPath, [path.join(PG, 'up.js')], { cwd: PG });
    for (let i = 0; i < 120 && !fs.existsSync(path.join(PG, 'pg.ready')); i++) await tunggu(1000);
    if (!fs.existsSync(path.join(PG, 'pg.ready'))) throw new Error('Postgres lokal tidak siap');
    const fix = spawnSync(process.execPath, [path.join(PG, 'fix.js')], { cwd: PG, encoding: 'utf8' });
    if (fix.status !== 0) throw new Error('fix.js gagal: ' + fix.stderr);
    console.log('> data uji (akun, obat, stok, aktivitas)…');
    await require('./uji-peran/seed')(DB);

    console.log('> backend uji (port %d)…', BE_PORT);
    mulai(process.execPath, ['-r', path.join(PG, 'preload.js'), 'src/app.js'], {
      cwd: BE_DIR,
      env: {
        ...process.env, NODE_ENV: 'development', PORT: String(BE_PORT), DATABASE_URL: DB,
        JWT_SECRET: crypto.randomBytes(48).toString('hex'), FRONTEND_URL: FE_URL,
      },
    });
    await siap(`http://localhost:${BE_PORT}/api/health`, 'backend');

    console.log('> playwright test (uji-peran)…\n');
    const pw = spawnSync(process.execPath, [path.join(ROOT, 'node_modules/@playwright/test/cli.js'), 'test', '-c', path.join(ROOT, 'uji-peran/playwright.config.js'), ...bawaPW], {
      cwd: ROOT, stdio: 'inherit',
      env: { ...process.env, SIMO_FE_URL: FE_URL, SIMO_BE_URL: `http://localhost:${BE_PORT}`, SIMO_DB: DB },
    });
    kode = pw.status ?? 1;
  } catch (e) {
    console.error('GAGAL:', e.message);
  } finally {
    await bersihkan();
  }
  process.exit(kode);
})();
