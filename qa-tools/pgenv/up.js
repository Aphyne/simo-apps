const REPO = require('path').resolve(__dirname, '..', '..').split(require('path').sep).join('/');
const fs = require('fs');
const path = require('path');
const EmbeddedPostgres = require('embedded-postgres').default || require('embedded-postgres');
const { Client } = require('pg');
const DATA = path.join(__dirname, 'data');
const MIG = REPO + '/database-migrations';
(async () => {
  const pg = new EmbeddedPostgres({ databaseDir: DATA, user: 'qa', password: 'qa', port: 54329, persistent: false });
  if (!fs.existsSync(DATA)) await pg.initialise();
  await pg.start();
  await pg.createDatabase('simo_qa');
  const c = new Client({ host: 'localhost', port: 54329, user: 'qa', password: 'qa', database: 'simo_qa' });
  await c.connect();
  const files = fs.readdirSync(MIG).filter(f => /^\d+.*\.sql$/.test(f)).sort();
  for (const f of files) {
    try { await c.query(fs.readFileSync(path.join(MIG, f), 'utf8')); console.log('OK  ', f); }
    catch (e) { console.log('ERR ', f, e.message.split('\n')[0]); }
  }
  const t = await c.query("select table_name from information_schema.tables where table_schema='public' order by 1");
  console.log('tabel:', t.rows.map(r => r.table_name).join(', '));
  const o = await c.query('select count(*)::int n from obat'); console.log('obat:', o.rows[0].n);
  await c.end();
  fs.writeFileSync(path.join(__dirname, 'pg.ready'), 'ready');
  console.log('POSTGRES LOKAL SIAP di port 54329');
  // tetap hidup sampai file stop muncul
  const t0 = setInterval(async () => {
    if (fs.existsSync(path.join(__dirname, 'pg.stop'))) { clearInterval(t0); await pg.stop(); process.exit(0); }
  }, 1000);
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
