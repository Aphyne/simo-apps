const L = require('./lib');
(async () => {
  const port = 8006, base = `http://localhost:${port}`;
  const srv = await L.startServer(port, 'srv-crash.log'); const c = (...a) => L.call(base, ...a);
  const T = await L.login(base, 'admin'); const db = await L.db(); const lock = await L.db();
  const tgl = new Date().toISOString().slice(0, 10);
  const A = (await db.query('select id from obat order by id limit 1')).rows[0].id;
  const bkid = (await db.query('select id from barang_keluar where obat_id=$1 limit 1', [A])).rows[0].id;
  // simulasi satu transaksi lambat/macet yang memegang kunci baris obat
  await lock.query('BEGIN'); await lock.query('SELECT 1 FROM obat WHERE id=$1 FOR UPDATE', [A]);
  console.log('kunci baris obat dipegang; kirim 3 bulk keluar (mengisi pool max=3) + 1 PUT keluar + probe');
  const bulk = () => c('POST', '/api/barang-keluar/bulk', { t: T, body: { tanggal: tgl, keterangan: 'Penjualan', items: [{ obat_id: A, jumlah: 1 }] }, timeout: 90000 });
  const j = [bulk(), bulk(), bulk()];
  await new Promise(r => setTimeout(r, 1000));
  const probe1 = await c('GET', '/api/obat', { t: T, timeout: 8000 });
  console.log('probe GET /api/obat saat 3 koneksi pool tertahan:', probe1.s, probe1.ms + 'ms', probe1.err || '');
  const put = c('PUT', '/api/barang-keluar/' + bkid, { t: T, body: { tanggal: tgl, jumlah: 1, keterangan: 'Penjualan' }, timeout: 90000 });
  const t0 = Date.now();
  const res = await Promise.all([...j, put]);
  console.log('hasil setelah', Date.now() - t0, 'ms:', JSON.stringify(res.map(r => r.s || r.err)));
  console.log('server hidup?', !srv.exited, 'exit code', srv.code);
  const h = await c('GET', '/api/health', { timeout: 3000 }); console.log('health setelah itu:', h.s, h.err || '');
  await lock.query('ROLLBACK').catch(() => { }); await lock.end().catch(() => { }); await db.end();
  if (!srv.exited) srv.kill();
})().catch(e => { console.log('ERR', e); process.exit(1) });
