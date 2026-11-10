const L = require('./lib');
(async () => {
  const port = 8005, base = `http://localhost:${port}`;
  const srv = await L.startServer(port, 'srv-conc.log'); const c = (...a) => L.call(base, ...a);
  const T = await L.login(base, 'admin'); const db = await L.db(); const q = async (s, p) => (await db.query(s, p)).rows;
  const tgl = new Date().toISOString().slice(0, 10);
  const sid = (await q('select min(id) i from supplier'))[0].i;
  const mk = async (stok) => (await c('POST', '/api/obat', { t: T, body: { nama: 'Konk ' + Math.random().toString(36).slice(2, 7), kategori: 'Uji', satuan: 'tablet', satuan_per_dus: 10, harga_beli: 1000, harga_jual: 1500, stok, biaya_pesan: 50000, biaya_simpan: 100, lead_time: 3, service_level: 95 } })).j.data.id;
  const ledger = async (ids) => {
    const r = await q(`select o.id,o.stok,(coalesce((select sum(jumlah_satuan) from barang_masuk where obat_id=o.id),0)-coalesce((select sum(jumlah) from barang_keluar where obat_id=o.id),0))::int led from obat o where o.id=any($1)`, [ids]);
    const bad = r.filter(x => x.stok !== x.led);
    return bad.length ? 'TIDAK KONSISTEN: ' + JSON.stringify(bad.slice(0, 4)) : 'konsisten (' + r.length + ' obat)';
  };
  const dist = (rs) => { const m = {}; rs.forEach(r => { const k = r.s || r.err; m[k] = (m[k] || 0) + 1 }); return JSON.stringify(m) };
  const errs = () => { const t = require('fs').readFileSync('srv-conc.log', 'utf8'); return { deadlock: (t.match(/deadlock/gi) || []).length, total_err: (t.match(/error/gi) || []).length } };

  // S1 deadlock
  {
    const A = await mk(100000), B = await mk(100000);
    const mkb = (items) => c('POST', '/api/barang-keluar/bulk', { t: T, body: { tanggal: tgl, keterangan: 'Penjualan', items: items.map(i => ({ obat_id: i, jumlah: 1 })) }, timeout: 120000 });
    const jobs = []; for (let i = 0; i < 5; i++) { jobs.push(mkb([A, B])); jobs.push(mkb([B, A])) }
    const t0 = Date.now(); const rs = await Promise.all(jobs);
    console.log('S1 bulk keluar urutan terbalik 10 req:', dist(rs), (Date.now() - t0) + 'ms; log', JSON.stringify(errs()), '; ledger', await ledger([A, B]));
    const ids = []; for (let i = 0; i < 6; i++) ids.push(await mk(100000));
    const sh = () => [...ids].sort(() => Math.random() - .5);
    const rs2 = await Promise.all(Array.from({ length: 10 }, () => mkb(sh())));
    console.log('S1b 6 obat urutan acak x40:', dist(rs2), '; ledger', await ledger(ids), JSON.stringify(errs()));
    const mkm = (items, n) => c('POST', '/api/barang-masuk/bulk', { t: T, body: { tanggal: tgl, supplier_id: sid, no_faktur: 'DL-' + n + '-' + Math.random(), items: items.map((i, k) => ({ obat_id: i, jumlah_dus: 1, no_batch: 'b' + n + k + Math.random(), expired_batch: '2030-01-01' })) }, timeout: 120000 });
    const rs3 = await Promise.all(Array.from({ length: 8 }, (_, i) => mkm(i % 2 ? [A, B] : [B, A], i)));
    console.log('S1c bulk MASUK terbalik x40:', dist(rs3), '; ledger', await ledger([A, B]), JSON.stringify(errs()));
  }
  // S2
  {
    const A = await mk(1000); const body = { tanggal: tgl, obat_id: A, jumlah: 7, keterangan: 'Penjualan' };
    const rs = await Promise.all([c('POST', '/api/barang-keluar', { t: T, body }), c('POST', '/api/barang-keluar', { t: T, body })]);
    const n = (await q('select count(*)::int n from barang_keluar where obat_id=$1', [A]))[0].n;
    console.log('S2 double-submit keluar identik: status', dist(rs), 'baris tercatat', n, '(tanpa idempotency); ledger', await ledger([A]));
    const bk = { tanggal: tgl, keterangan: 'Penjualan', items: [{ obat_id: A, jumlah: 3 }] };
    const rb = await Promise.all([c('POST', '/api/barang-keluar/bulk', { t: T, body: bk }), c('POST', '/api/barang-keluar/bulk', { t: T, body: bk })]);
    const mb = { tanggal: tgl, supplier_id: sid, no_faktur: 'DUP-1', items: [{ obat_id: A, jumlah_dus: 1, no_batch: 'X1', expired_batch: '2030-01-01' }] };
    const rm = await Promise.all([c('POST', '/api/barang-masuk/bulk', { t: T, body: mb }), c('POST', '/api/barang-masuk/bulk', { t: T, body: mb })]);
    console.log('   bulk keluar dobel', dist(rb), '; bulk masuk faktur+batch sama dobel', dist(rm), 'baris masuk', (await q("select count(*)::int n from barang_masuk where no_faktur='DUP-1'"))[0].n, '; ledger', await ledger([A]));
  }
  // S2b
  {
    const A = await mk(50);
    const rs = await Promise.all(Array.from({ length: 30 }, () => c('POST', '/api/barang-keluar', { t: T, body: { tanggal: tgl, obat_id: A, jumlah: 5, keterangan: 'Penjualan' } })));
    const st = await q('select stok from obat where id=$1', [A]); const k = (await q('select coalesce(sum(jumlah),0)::int k from barang_keluar where obat_id=$1', [A]))[0].k;
    console.log('S2b 30x POST single keluar @5 pada stok 50:', dist(rs), 'tercatat keluar', k, 'stok akhir', st[0].stok, '; ledger', await ledger([A]));
    const B = await mk(0);
    const rm = await Promise.all(Array.from({ length: 30 }, (_, i) => c('POST', '/api/barang-masuk', { t: T, body: { tanggal: tgl, obat_id: B, jumlah_dus: 1, supplier_id: sid, no_faktur: 'SM-' + i, no_batch: 'S' + i, expired_batch: '2030-01-01', harga_beli_dus: 1000 } })));
    console.log('S2c 30x POST single masuk:', dist(rm), '; ledger', await ledger([B]));
  }
  // S3
  {
    const A = await mk(100000);
    const r = await c('POST', '/api/barang-keluar', { t: T, body: { tanggal: tgl, obat_id: A, jumlah: 10, keterangan: 'Penjualan' } }); const id = r.j.data.id;
    const rs = await Promise.all(Array.from({ length: 20 }, (_, i) => c('PUT', '/api/barang-keluar/' + id, { t: T, body: { tanggal: tgl, jumlah: 1 + i, keterangan: 'Penjualan' } })));
    console.log('S3a PUT paralel x20 pada 1 baris:', dist(rs), '; ledger', await ledger([A]));
    const rd = await Promise.all(Array.from({ length: 10 }, () => c('DELETE', '/api/barang-keluar/' + id, { t: T })));
    console.log('S3b DELETE paralel x10 (baris sama):', dist(rd), '; ledger', await ledger([A]));
    const ids = []; for (let i = 0; i < 10; i++) ids.push((await c('POST', '/api/barang-keluar', { t: T, body: { tanggal: tgl, obat_id: A, jumlah: 5, keterangan: 'Penjualan' } })).j.data.id);
    const jobs = []; ids.forEach((x, i) => { jobs.push(c('PUT', '/api/barang-keluar/' + x, { t: T, body: { tanggal: tgl, jumlah: 2 + i, keterangan: 'Penjualan' } })); if (i % 2) jobs.push(c('DELETE', '/api/barang-keluar/' + x, { t: T })) });
    const rj = await Promise.all(jobs); console.log('S3c campur PUT/DELETE 10 baris obat sama:', dist(rj), '; ledger', await ledger([A]), JSON.stringify(errs()));
    const m = await c('POST', '/api/barang-masuk', { t: T, body: { tanggal: tgl, obat_id: A, jumlah_dus: 2, supplier_id: sid, no_faktur: 'ED-1', no_batch: 'E1', expired_batch: '2030-01-01', harga_beli_dus: 1000 } }); const mid = m.j?.data?.id;
    const rmj = await Promise.all([...Array.from({ length: 8 }, (_, i) => c('PUT', '/api/barang-masuk/' + mid, { t: T, body: { tanggal: tgl, jumlah_dus: 1 + i, supplier_id: sid, no_faktur: 'ED-1', no_batch: 'E1', expired_batch: '2030-01-01', harga_beli_dus: 1000 } })), ...Array.from({ length: 4 }, () => c('DELETE', '/api/barang-masuk/' + mid, { t: T }))]);
    console.log('S3d masuk PUT x8 + DELETE x4 paralel:', dist(rmj), '; ledger', await ledger([A]), JSON.stringify(errs()));
  }
  // S4
  {
    const A = await mk(500);
    const rs = await Promise.all(Array.from({ length: 60 }, () => c('POST', '/api/obat/' + A + '/hitung-ulang', { t: T })));
    console.log('S4 hitung-ulang x60 satu obat:', dist(rs), 'ms max', Math.max(...rs.map(r => r.ms)));
    const all = (await q('select id from obat limit 80')).map(r => r.id);
    const rs2 = await Promise.all(all.flatMap(i => [0, 1, 2].map(() => c('POST', '/api/obat/' + i + '/hitung-ulang', { t: T }))));
    console.log('S4b hitung-ulang 240 (80 obat x3):', dist(rs2));
    const mixed = await Promise.all([...Array.from({ length: 20 }, () => c('POST', '/api/obat/' + A + '/hitung-ulang', { t: T })), ...Array.from({ length: 20 }, () => c('POST', '/api/barang-keluar', { t: T, body: { tanggal: tgl, obat_id: A, jumlah: 1, keterangan: 'Penjualan' } }))]);
    console.log('S4c campur hitung-ulang + keluar:', dist(mixed), '; ledger', await ledger([A]));
  }
  // S5
  {
    const ids = (await q('select id from obat order by id limit 80')).map(r => r.id);
    const big = () => c('POST', '/api/barang-keluar/bulk', { t: T, body: { tanggal: tgl, keterangan: 'Penjualan', items: Array.from({ length: 1500 }, (_, i) => ({ obat_id: ids[i % 80], jumlah: 1 })) }, timeout: 120000 });
    const t0 = Date.now(); const jobs = [big(), big(), big()]; const probes = [];
    let done = false; const pr = (async () => { await new Promise(r => setTimeout(r, 500)); while (!done) { const r = await c('GET', '/api/dashboard/summary', { t: T, timeout: 60000 }); probes.push(r.s ? r.ms : -1) } })();
    const rs = await Promise.all(jobs); done = true; await pr;
    console.log('S5 3 bulk keluar 1500 item paralel:', dist(rs), (Date.now() - t0) + 'ms; probe summary selama itu n', probes.length, 'max', Math.max(...probes), 'ms; ledger semua', await ledger(ids), JSON.stringify(errs()));
  }
  console.log('server hidup', !srv.exited, 'rss', L.rss(srv.pid));
  await db.end(); srv.kill();
})().catch(e => { console.log('ERR', e); process.exit(1) });
