// Menjalankan suite regresi API (46 uji) dalam SATU perintah di foreground: menyalakan Postgres lokal sementara,
// menyiapkan akun uji, menjalankan pgenv/suite.js (yang menyalakan backend ujinya sendiri di port 8002), lalu
// mematikan semuanya. Tanpa proses latar belakang yang tertinggal.
//   node jalankan-regresi.js
// Aman: pgenv/preload.js menolak DB selain Postgres lokal; tidak menyentuh Neon.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PG = path.join(__dirname, 'pgenv');
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
let pgProses = null;

async function bersihkan() {
  try { pgProses && pgProses.kill(); } catch { /* sudah mati */ }
  fs.writeFileSync(path.join(PG, 'pg.stop'), '');
  await tunggu(3000);
  for (const f of ['pg.stop', 'pg.ready']) { try { fs.rmSync(path.join(PG, f)); } catch { /* tidak ada */ } }
}

(async () => {
  let kode = 1;
  try {
    console.log('> Postgres lokal sementara…');
    for (const f of ['pg.ready', 'pg.stop']) { try { fs.rmSync(path.join(PG, f)); } catch { /* tidak ada */ } }
    fs.rmSync(path.join(PG, 'data'), { recursive: true, force: true });
    pgProses = spawn(process.execPath, [path.join(PG, 'up.js')], { cwd: PG, stdio: 'ignore' });
    for (let i = 0; i < 120 && !fs.existsSync(path.join(PG, 'pg.ready')); i++) await tunggu(1000);
    if (!fs.existsSync(path.join(PG, 'pg.ready'))) throw new Error('Postgres lokal tidak siap');

    const fix = spawnSync(process.execPath, [path.join(PG, 'fix.js')], { cwd: PG, encoding: 'utf8' });
    if (fix.status !== 0) throw new Error('fix.js gagal: ' + fix.stderr);

    console.log('> suite regresi API…\n');
    const suite = spawnSync(process.execPath, [path.join(PG, 'suite.js')], { cwd: PG, stdio: 'inherit' });
    kode = suite.status ?? 1;
  } catch (e) {
    console.error('GAGAL:', e.message);
  } finally {
    await bersihkan();
  }
  process.exit(kode);
})();
