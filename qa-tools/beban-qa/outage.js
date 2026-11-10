const L = require('./lib'); const fs = require('fs'); const { spawn } = require('child_process'); const net = require('net');
const PG = require('path').join(__dirname,'..','pgenv');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const portOpen = () => new Promise(r => { const s = net.connect(54329, '127.0.0.1'); s.on('connect', () => { s.destroy(); r(true) }); s.on('error', () => r(false)); });
(async () => {
  const port = 8008, base = `http://localhost:${port}`;
  const srv = await L.startServer(port, 'srv-outage.log'); const c = (...a) => L.call(base, ...a);
  const T = await L.login(base, 'admin'); const db = await L.db();
  const ids = (await db.query('select id from obat order by id limit 80')).rows.map(r => r.id);
  await db.end();
  const tgl = new Date().toISOString().slice(0, 10);
  const t0 = Date.now(); const tl = []; let stop = false;
  const loop = (name, fn, gap) => (async () => { while (!stop) { const s = Date.now(); const r = await fn(); tl.push({ t: Math.round((s - t0) / 1000), name, s: r.s || r.err, ms: r.ms }); await sleep(gap) } })();
  const w = [loop('GET obat', () => c('GET', '/api/obat', { t: T, timeout: 60000 }), 200), loop('GET summary', () => c('GET', '/api/dashboard/summary', { t: T, timeout: 60000 }), 300), loop('POST keluar', () => c('POST', '/api/barang-keluar', { t: T, body: { tanggal: tgl, obat_id: ids[0], jumlah: 1, keterangan: 'Penjualan' }, timeout: 60000 }), 400), loop('health', () => c('GET', '/api/health', { timeout: 5000 }), 300)];
  // request lambat saat DB mati (bulk 2000 item ~5s)
  const bulk = c('POST', '/api/barang-keluar/bulk', { t: T, body: { tanggal: tgl, keterangan: 'Penjualan', items: Array.from({ length: 2000 }, (_, i) => ({ obat_id: ids[i % 80], jumlah: 1 })) }, timeout: 120000 }).then(r => { console.log('bulk 2000 item yang sedang berjalan saat DB dimatikan ->', r.s || r.err, ((Date.now() - t0) / 1000).toFixed(1) + 's'); });
  await sleep(2500);
  console.log('[t=' + ((Date.now() - t0) / 1000).toFixed(1) + 's] MEMATIKAN Postgres (pg.stop)');
  fs.writeFileSync(PG + '/pg.stop', '');
  while (await portOpen()) await sleep(300);
  const tDown = Date.now(); console.log('[t=' + ((tDown - t0) / 1000).toFixed(1) + 's] Postgres mati');
  await sleep(12000);
  console.log('server hidup selama DB mati:', !srv.exited, 'rss', L.rss(srv.pid));
  try { fs.unlinkSync(PG + '/pg.stop') } catch { } try { fs.unlinkSync(PG + '/pg.ready') } catch { }
  const up = spawn('node', ['up.js'], { cwd: PG, detached: true, stdio: ['ignore', fs.openSync(PG + '/up2.log', 'w'), fs.openSync(PG + '/up2.log', 'a')] }); up.unref();
  const tUp0 = Date.now(); console.log('[t=' + ((tUp0 - t0) / 1000).toFixed(1) + 's] menyalakan Postgres lagi (re-init + migrasi)');
  while (!fs.existsSync(PG + '/pg.ready')) await sleep(500);
  const tUp = Date.now(); console.log('[t=' + ((tUp - t0) / 1000).toFixed(1) + 's] Postgres siap lagi (butuh ' + ((tUp - tUp0) / 1000).toFixed(0) + 's)');
  await sleep(15000);
  stop = true; await Promise.all(w); await bulk;
  // ringkas timeline per 3 detik per endpoint
  const by = {};
  tl.forEach(x => { const k = x.name + ' @' + Math.floor(x.t / 3) * 3 + 's'; by[k] = by[k] || {}; by[k][x.s] = (by[k][x.s] || 0) + 1 });
  const names = ['GET obat', 'GET summary', 'POST keluar', 'health'];
  for (const n of names) { console.log(n + ': ' + Object.entries(by).filter(([k]) => k.startsWith(n + ' @')).map(([k, v]) => k.split('@')[1] + JSON.stringify(v)).join(' ')) }
  const lastOK = {}; names.forEach(n => { const ok = tl.filter(x => x.name === n && x.s === 200 || x.name === n && x.s === 201).map(x => x.t); lastOK[n] = ok.length ? ok[ok.length - 1] : null });
  const long = tl.filter(x => typeof x.ms === 'number').sort((a, b) => b.ms - a.ms)[0]; console.log('request terlama', JSON.stringify(long));
  console.log('server hidup di akhir:', !srv.exited, 'rss', L.rss(srv.pid));
  srv.kill();
})().catch(e => { console.log('ERR', e); process.exit(1) });
