const REPO = require('path').resolve(__dirname, '..', '..').split(require('path').sep).join('/');
const PGENV = __dirname;
const { spawn } = require('child_process');
const { Client } = require('pg');
const PORT = 8002, BASE = `http://localhost:${PORT}`;
const DBURL = 'postgresql://qa:qa@localhost:54329/simo_qa';
const out = [];
const rec = (id, nama, ok, detail) => {
  out.push({ id, nama, ok, detail });
  console.log(`${ok ? 'LULUS' : 'GAGAL'} | ${id} | ${nama}${detail ? ' -> ' + detail : ''}`);
};
const info = (t) => console.log('INFO  | ' + t);
async function call(m, p, { t, body, raw } = {}) {
  const h = {};
  if (t) h.Authorization = 'Bearer ' + t;
  let b;
  if (raw !== undefined) { b = raw; h['Content-Type'] = 'application/json'; }
  else if (body !== undefined) { b = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
  const t0 = Date.now();
  const r = await fetch(BASE + p, { method: m, headers: h, body: b });
  const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch {}
  return { s: r.status, j, ms: Date.now() - t0, txt };
}
const login = async (u, p = 'password') => (await call('POST', '/api/auth/login', { body: { username: u, password: p } }));
const tgl = (d = 0) => { const x = new Date(Date.now() + d * 864e5); return x.toISOString().slice(0, 10); };

(async () => {
  const srv = spawn('node', ['-r', PGENV + '/preload.js', 'src/app.js'], {
    cwd: REPO + '/backend',
    env: { ...process.env, PORT: String(PORT), DATABASE_URL: DBURL, JWT_SECRET: 'rahasia-pengujian-lokal-0123456789-abcdefghijklmnop', NODE_ENV: 'test', FRONTEND_URL: 'http://localhost:3000' },
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) { try { ready = (await fetch(BASE + '/api/health')).ok; } catch { await new Promise(r => setTimeout(r, 500)); } }
  if (!ready) { console.log('server uji gagal start (pengaman aktif?)'); srv.kill(); process.exit(1); }
  const db = new Client({ connectionString: DBURL }); await db.connect();
  const q = async (s, p) => (await db.query(s, p)).rows;
  try {
    // ===== login & token
    let r = await login('admin'); const ADMIN = r.j?.data?.token; rec('SETUP', 'Login admin', r.s === 200 && !!ADMIN, 'status ' + r.s);
    r = await login('staf1'); const STAF = r.j?.data?.token; rec('SETUP', 'Login staf1', r.s === 200 && !!STAF, 'status ' + r.s);
    r = await login('peneliti'); const SUPER = r.j?.data?.token; info('Login superadmin: status ' + r.s);

    // ===== AUTH-02 brute force
    const kode = [];
    for (let i = 0; i < 40; i++) kode.push((await login('admin', 'salah' + i)).s);
    const ada429 = kode.includes(429);
    rec('AUTH-02', '40 percobaan login gagal beruntun diblokir (429)', ada429, 'status unik: ' + [...new Set(kode)].join(','));
    r = await login('admin'); rec('AUTH-02b', 'Setelah 40 gagal, IP yang sama tetap diblokir 429 oleh rate limiter (login benar pun ditolak sementara)', r.s === 429, 'status ' + r.s + ' -> ' + (r.s === 429 ? 'limiter aktif: IP tetap diblokir (perilaku yang diharapkan)' : 'TIDAK terblokir'));
    // timing enumerasi
    const avg = async (u) => { let s = 0; for (let i = 0; i < 6; i++) s += (await login(u, 'x' + i)).ms; return s / 6; };
    const tAda = await avg('admin'), tTidak = await avg('tidak_ada_xyz');
    rec('AUTH-09', 'Waktu respons user ada vs tidak ada tidak beda jauh', Math.abs(tAda - tTidak) < Math.max(40, tAda * 0.3), `ada=${tAda.toFixed(0)}ms tidak-ada=${tTidak.toFixed(0)}ms`);
    r = await call('POST', '/api/auth/login/google', { body: { credential: 'sampah' } }); rec('AUTH-04x', 'Login Google credential sampah -> 4xx bukan 500', r.s >= 400 && r.s < 500, 'status ' + r.s);

    // ===== AUTH-01 revokasi
    const stafId = (await q("select id from users where username='staf1'"))[0].id;
    r = await call('PATCH', `/api/users/${stafId}/toggle-aktif`, { t: ADMIN }); info('toggle-aktif staf1 -> ' + r.s);
    r = await call('GET', '/api/obat', { t: STAF }); rec('AUTH-01', 'Token user yang sudah DINONAKTIFKAN ditolak', r.s === 401 || r.s === 403, 'status ' + r.s);
    r = await call('POST', '/api/auth/logout', { t: STAF }); const rl = await call('GET', '/api/obat', { t: STAF });
    rec('AUTH-01b', 'Token setelah logout ditolak', rl.s === 401, 'status ' + rl.s);
    // AUTH-08 aktifkan ulang via PUT tanpa is_active
    const ur = (await q('select * from users where id=$1', [stafId]))[0];
    info('staf1 aktif sekarang: ' + ur.is_active);
    r = await call('PUT', `/api/users/${stafId}`, { t: ADMIN, body: { nama: ur.nama, role: 'staf' } });
    const ur2 = (await q('select is_active from users where id=$1', [stafId]))[0];
    rec('AUTH-08', 'PUT user tanpa is_active TIDAK mengaktifkan ulang akun nonaktif', ur2.is_active === ur.is_active, `sebelum=${ur.is_active} sesudah=${ur2.is_active}`);
    if (!ur2.is_active) await call('PATCH', `/api/users/${stafId}/toggle-aktif`, { t: ADMIN });
    // AUTH-08 admin turunkan role diri sendiri
    const adminId = (await q("select id from users where username='admin'"))[0].id;
    r = await call('PUT', `/api/users/${adminId}`, { t: ADMIN, body: { nama: 'x', role: 'staf', is_active: true } });
    rec('AUTH-08b', 'Admin tidak bisa menurunkan role diri sendiri', r.s >= 400, 'status ' + r.s);
    await q("update users set role='admin' where username='admin'");
    r = await call('PUT', `/api/users/${adminId}`, { t: ADMIN, body: { nama: 'x', role: 'admin', is_active: 'false' } });
    rec('INJ-07', 'is_active="false" (string) tidak dapat menonaktifkan diri sendiri', r.s >= 400, 'status ' + r.s);
    await q("update users set is_active=true where username='admin'");
    // AUTH-06 password lemah
    r = await call('POST', '/api/users', { t: ADMIN, body: { username: 'uji_lemah', password: '123456', nama: 'Uji', role: 'staf' } });
    rec('AUTH-06', 'Password "123456" ditolak', r.s >= 400, 'status ' + r.s);

    // ===== stok & obat uji
    const mk = async (stok, extra = {}) => {
      const x = await call('POST', '/api/obat', { t: ADMIN, body: { nama: 'Obat Uji ' + Math.random().toString(36).slice(2, 7), kategori: 'Uji', satuan: 'tablet', satuan_per_dus: 10, harga_beli: 1000, harga_jual: 1500, stok, biaya_pesan: 50000, biaya_simpan: 100, lead_time: 3, service_level: 95, ...extra } });
      return x.j?.data?.id;
    };
    const stokDb = async (id) => (await q('select stok from obat where id=$1', [id]))[0].stok;

    // ===== AUTH-03 : staf mengubah/menghapus master obat benar-benar berhasil?
    const idA = await mk(50);
    r = await call('PUT', `/api/obat/${idA}`, { t: STAF, body: { nama: 'Diubah Staf', kategori: 'Uji', satuan: 'tablet', stok: 99999 } });
    rec('AUTH-03', 'Staf TIDAK boleh mengubah master obat (stok)', r.s === 403, 'status ' + r.s + ' stok kini ' + await stokDb(idA));
    const idB = await mk(0);
    r = await call('DELETE', `/api/obat/${idB}`, { t: STAF });
    const masih = (await q('select 1 from obat where id=$1', [idB])).length;
    rec('AUTH-03b', 'Staf TIDAK boleh menghapus obat', r.s === 403 && masih === 1, 'status ' + r.s + ' obat ' + (masih ? 'masih ada' : 'TERHAPUS'));

    // ===== BIZ-03 PUT obat parsial
    const idC = await mk(120, { harga_beli: 2000 });
    const sup = await call('POST', '/api/supplier', { t: ADMIN, body: { nama: 'PBF Uji', alamat: 'x', telepon: '0', lead_time_avg: 2, biaya_pesan: 1 } });
    const sid = sup.j?.data?.id;
    await q('update obat set supplier_id=$1 where id=$2', [sid, idC]);
    const before = (await q('select stok,supplier_id,satuan_per_dus,service_level from obat where id=$1', [idC]))[0];
    r = await call('PUT', `/api/obat/${idC}`, { t: ADMIN, body: { nama: 'Ganti Nama Saja', kategori: 'Uji', satuan: 'tablet' } });
    const after = (await q('select stok,supplier_id,satuan_per_dus,service_level from obat where id=$1', [idC]))[0];
    rec('BIZ-03', 'PUT /obat parsial TIDAK menimpa stok/supplier', after.stok === before.stok && after.supplier_id === before.supplier_id, `stok ${before.stok}->${after.stok}, supplier ${before.supplier_id}->${after.supplier_id}, satuan_per_dus ${before.satuan_per_dus}->${after.satuan_per_dus}, SL ${before.service_level}->${after.service_level}`);

    // ===== BIZ-01 race barang keluar
    const idD = await mk(100);
    const sblm = await stokDb(idD);
    const par = await Promise.all(Array.from({ length: 10 }, () => call('POST', '/api/barang-keluar', { t: ADMIN, body: { tanggal: tgl(), obat_id: idD, jumlah: 100, keterangan: 'Penjualan' } })));
    const sukses = par.filter(x => x.s === 201).length;
    const akhir = await stokDb(idD);
    const totKeluar = (await q('select coalesce(sum(jumlah),0)::int t from barang_keluar where obat_id=$1', [idD]))[0].t;
    rec('BIZ-01', '10 request paralel menjual seluruh stok (100): tepat 1 sukses', sukses === 1, `sukses=${sukses}, stok awal=${sblm}, stok akhir=${akhir}, total tercatat keluar=${totKeluar} (seharusnya 100)`);
    rec('BIZ-01b', 'Stok akhir konsisten dengan ledger (awal - total keluar)', akhir === sblm - totKeluar && akhir >= 0, `awal-keluar=${sblm - totKeluar}, tersimpan=${akhir}`);

    // ===== BIZ-02 race barang masuk
    const idE = await mk(0);
    const sup2 = sid;
    const parM = await Promise.all(Array.from({ length: 10 }, (_, i) => call('POST', '/api/barang-masuk', { t: ADMIN, body: { tanggal: tgl(), obat_id: idE, jumlah_dus: 1, supplier_id: sup2, no_faktur: 'F-RACE-' + i, no_batch: 'B' + i, expired_batch: tgl(400), harga_beli_dus: 10000 } })));
    const okM = parM.filter(x => x.s === 201).length;
    const stokM = await stokDb(idE);
    rec('BIZ-02', `10 barang masuk paralel (1 dus=10 satuan): stok = sukses x 10`, stokM === okM * 10, `sukses=${okM}, stok akhir=${stokM}, seharusnya=${okM * 10}`);

    // ===== BIZ-14/INJ-01 validasi angka
    const idF = await mk(1000);
    for (const jml of ['5.7', '5abc', 'abc', 0, -5, null, '1e999', 1.5]) {
      r = await call('POST', '/api/barang-keluar', { t: ADMIN, body: { tanggal: tgl(), obat_id: idF, jumlah: jml, keterangan: 'Penjualan' } });
      rec('BIZ-14', `barang-keluar jumlah=${JSON.stringify(jml)} -> 4xx (bukan 500/201)`, r.s >= 400 && r.s < 500, 'status ' + r.s);
    }
    r = await call('POST', '/api/barang-keluar', { t: ADMIN, body: { tanggal: 'infinity', obat_id: idF, jumlah: 1, keterangan: 'Penjualan' } });
    rec('INJ-11', 'barang-keluar tanggal="infinity" ditolak', r.s >= 400 && r.s < 500, 'status ' + r.s);
    r = await call('POST', '/api/barang-keluar', { t: ADMIN, body: { tanggal: tgl(), obat_id: idF, jumlah: 1, keterangan: 'Bebas' } });
    rec('BIZ-14c', 'keterangan di luar daftar -> 4xx', r.s >= 400 && r.s < 500, 'status ' + r.s);
    r = await call('POST', '/api/barang-masuk', { t: ADMIN, body: { tanggal: tgl(), obat_id: idF, jumlah_dus: 'NaN', supplier_id: sid, no_faktur: 'F1', no_batch: 'B1', expired_batch: tgl(300) } });
    rec('INJ-01', 'barang-masuk jumlah_dus="NaN" -> 4xx', r.s >= 400 && r.s < 500, 'status ' + r.s);
    r = await call('POST', '/api/barang-masuk', { t: ADMIN, body: { tanggal: tgl(), obat_id: idF, jumlah_dus: '1e12', supplier_id: sid, no_faktur: 'F2', no_batch: 'B2', expired_batch: tgl(300) } });
    rec('INJ-01b', 'barang-masuk jumlah_dus=1e12 -> 4xx', r.s >= 400 && r.s < 500, 'status ' + r.s);
    r = await call('POST', '/api/barang-masuk', { t: ADMIN, body: { tanggal: tgl(), obat_id: idF, jumlah_dus: 1, supplier_id: 999999, no_faktur: 'F3', no_batch: 'B3', expired_batch: tgl(300) } });
    rec('BIZ-14d', 'barang-masuk supplier fiktif -> 4xx', r.s >= 400 && r.s < 500, 'status ' + r.s);
    r = await call('POST', '/api/obat', { t: ADMIN, body: { nama: 'Racun', kategori: 'U', satuan: 'tab', harga_beli: 'NaN', stok: -500, service_level: 150, lead_time: -3, satuan_per_dus: -5, biaya_pesan: -100 } });
    const racun = r.j?.data?.id;
    rec('INJ-01c', 'POST /obat dengan NaN, stok negatif, SL 150, LT/biaya negatif ditolak', r.s >= 400, 'status ' + r.s + (racun ? ` (tersimpan id=${racun}, stok=${(await q('select stok,harga_beli,service_level from obat where id=$1', [racun]))[0] && JSON.stringify((await q('select stok,harga_beli::text,service_level,lead_time from obat where id=$1', [racun]))[0])})` : ''));
    r = await call('POST', '/api/supplier', { t: ADMIN, body: { nama: 'Supplier Neg', alamat: 'x', telepon: '0', lead_time_avg: -1, biaya_pesan: -100 } });
    rec('INJ-01d', 'supplier lead_time/biaya negatif ditolak', r.s >= 400, 'status ' + r.s);

    // ===== BIZ-12/kartu stok & hapus
    const idG = await mk(30);
    const k1 = await call('POST', '/api/barang-keluar', { t: ADMIN, body: { tanggal: tgl(-2), obat_id: idG, jumlah: 5, keterangan: 'Penjualan' } });
    const k2 = await call('POST', '/api/barang-keluar', { t: ADMIN, body: { tanggal: tgl(-1), obat_id: idG, jumlah: 5, keterangan: 'Penjualan' } });
    const del = await call('DELETE', `/api/barang-keluar/${k1.j?.data?.id}`, { t: ADMIN });
    const dem = (await q('select demand_harian::float d, stok from obat where id=$1', [idG]))[0];
    info(`hapus transaksi lama -> status ${del.s}, stok=${dem.stok}, demand_harian=${dem.d}`);
    const rows = await q('select id,stok_sebelum,stok_sesudah from barang_keluar where obat_id=$1 order by id', [idG]);
    const rantaiOk = rows.every(x => x.stok_sebelum - 0 >= 0);
    info('snapshot baris sisa: ' + JSON.stringify(rows));
    // delete obat dengan transaksi
    r = await call('DELETE', `/api/obat/${idG}`, { t: ADMIN });
    rec('BIZ-20', 'Hapus obat yang punya transaksi -> 409/400 dan data utuh', (r.s === 409 || r.s === 400) && (await q('select 1 from obat where id=$1', [idG])).length === 1, 'status ' + r.s);

    // ===== Simulasi
    const idH = await mk(200, { demand_harian: 5, demand_tahunan: 1800, std_dev_demand: 2 });
    r = await call('POST', '/api/simulasi/jalankan', { t: ADMIN, body: { obat_id: idH, demand_perubahan_pct: 20, lead_time_baru: null, biaya_simpan_baru: null, biaya_pesan_baru: null } });
    rec('BIZ-06', 'Simulasi payload sesuai docs (nilai null) menghasilkan angka valid', r.s === 200 && r.j?.data && !/null|NaN/.test(JSON.stringify(r.j.data.simulasi ?? r.j.data).replace(/"[^"]*":null/g, 'X') ) , 'status ' + r.s + ' ' + (r.txt || '').slice(0, 160));
    r = await call('POST', '/api/simulasi/jalankan', { t: ADMIN, body: { obat_id: idH, demand_perubahan_pct: -150 } });
    rec('BIZ-07', 'Simulasi pct=-150 ditolak', r.s >= 400 && r.s < 500, 'status ' + r.s);
    r = await call('POST', '/api/simulasi/jalankan', { t: ADMIN, body: { obat_id: idH, demand_perubahan_pct: '1e308', lead_time_baru: 'abc' } });
    rec('INJ-01e', 'Simulasi pct=1e308, LT="abc" ditolak', r.s >= 400 && r.s < 500, 'status ' + r.s + ' ' + (r.txt || '').slice(0, 120));

    // ===== Pengaturan
    const pg = await call('GET', '/api/pengaturan', { t: ADMIN }); const key = 'default_lead_time'; // kunci numerik; kunci teks bebas (mis. alamat_apotek) memang boleh bernilai "NaN"
    r = await call('PUT', '/api/pengaturan', { t: ADMIN, body: { [key]: 'NaN' } });
    const v = (await q('select value from pengaturan where key=$1', [key]))[0]?.value;
    rec('INJ-08', `Pengaturan "${key}"="NaN" ditolak`, r.s >= 400 && v !== 'NaN', `status ${r.s}, nilai tersimpan=${v}`);
    r = await call('PUT', '/api/pengaturan', { t: ADMIN, body: { key_asal_asalan: 'x' } });
    rec('INJ-08b', 'Pengaturan key tak dikenal ditolak', r.s >= 400, 'status ' + r.s);

    // ===== Bulk
    const idI = await mk(10), idJ = await mk(10);
    r = await call('POST', '/api/barang-keluar/bulk', { t: ADMIN, body: { tanggal: tgl(), keterangan: 'Penjualan', items: [{ obat_id: idI, jumlah: 5 }, { obat_id: idJ, jumlah: 999 }] } });
    rec('TC-08', 'Bulk keluar: satu item gagal -> semua dibatalkan', r.s >= 400 && (await stokDb(idI)) === 10, `status ${r.s}, stok item pertama=${await stokDb(idI)} (harus 10)`);
    r = await call('POST', '/api/barang-keluar/bulk', { t: ADMIN, body: { tanggal: tgl(), keterangan: 'Penjualan', items: [{ obat_id: idI, jumlah: 6 }, { obat_id: idI, jumlah: 6 }] } });
    rec('TC-10', 'Bulk keluar: obat sama 2x melebihi stok ditolak', r.s >= 400 && (await stokDb(idI)) >= 0, `status ${r.s}, stok=${await stokDb(idI)}`);
    const f1 = await call('POST', '/api/barang-masuk/bulk', { t: ADMIN, body: { tanggal: tgl(), supplier_id: sid, no_faktur: 'DUP-1', items: [{ obat_id: idJ, jumlah_dus: 1, no_batch: 'X', expired_batch: tgl(300), harga_beli_dus: 100 }] } });
    const f2 = await call('POST', '/api/barang-masuk/bulk', { t: ADMIN, body: { tanggal: tgl(), supplier_id: sid, no_faktur: 'DUP-1', items: [{ obat_id: idJ, jumlah_dus: 1, no_batch: 'X', expired_batch: tgl(300), harga_beli_dus: 100 }] } });
    rec('TC-21', 'Faktur duplikat (no_faktur sama) ditolak/diperingatkan', f2.s >= 400, `pertama=${f1.s}, kedua=${f2.s}`);

    // ===== Paginasi dan parsing
    r = await call('GET', '/api/obat/abc', { t: ADMIN }); rec('INJ-09', 'GET /obat/abc -> 4xx', r.s >= 400 && r.s < 500, 'status ' + r.s);
    r = await call('POST', '/api/obat', { t: ADMIN, raw: '{"a":' }); rec('INJ-09b', 'JSON rusak -> 400', r.s === 400, 'status ' + r.s);
    r = await call('GET', '/api/laporan/barang-masuk?dari=abc', { t: ADMIN }); rec('INJ-11b', 'laporan dari=abc -> 4xx', r.s >= 400 && r.s < 500, 'status ' + r.s);
    r = await call('GET', '/api/obat?search[x]=1', { t: ADMIN }); rec('INJ-12b', 'search berbentuk objek -> 4xx', r.s >= 400 && r.s < 500, 'status ' + r.s);
    // aktivitas superadmin tidak tercatat
    const la = (await q("select count(*)::int c from log_aktivitas")).at(0).c; info('baris log_aktivitas lokal: ' + la);
  } catch (e) { console.log('ERR suite:', e.stack.split('\n').slice(0, 3).join(' | ')); }
  await db.end(); srv.kill();
  const g = out.filter(x => !x.ok);
  console.log(`\nRINGKAS: ${out.length - g.length} lulus, ${g.length} gagal dari ${out.length}`);
  console.log('GAGAL: ' + g.map(x => x.id).join(', '));
  process.exit(0);
})();
