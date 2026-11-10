const REPO = require('path').resolve(__dirname, '..', '..').split(require('path').sep).join('/');
// Pemuat sementara KHUSUS pengujian: aman, tidak mengubah kode proyek.
// 1) Menolak berjalan jika DATABASE_URL bukan Postgres lokal pengujian.
// 2) Mematikan paksaan SSL (Postgres lokal tidak ber-SSL).
const u = process.env.DATABASE_URL || '';
if (!/^postgresql:\/\/qa:qa@localhost:54329\/simo_qa$/.test(u)) {
  console.error('PENGAMAN: DATABASE_URL bukan DB lokal pengujian. Berhenti.');
  process.exit(99);
}
const pg = require(REPO + '/backend/node_modules/pg');
const Orig = pg.Pool;
pg.Pool = class extends Orig {
  constructor(o) { const c = { ...o }; delete c.ssl; super(c); }
};
