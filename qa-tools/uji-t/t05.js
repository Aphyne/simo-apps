const REPO = require('path').resolve(__dirname, '..', '..').split(require('path').sep).join('/');
const B=REPO + '/backend/';
const pool=require(B+'src/db/pool'); const { hitungDemandDariRiwayat } = require(B+'src/services/demandService');
(async()=>{
  const r=[]; let ok=true; const chk=(n,c)=>{r.push((c?'LULUS ':'GAGAL ')+n); if(!c) ok=false;};
  const id=(await pool.query('select min(id) id from obat')).rows[0].id;
  await pool.query("DELETE FROM barang_keluar WHERE obat_id=$1",[id]);
  const tgl=async(off)=> (await pool.query("select ((NOW() AT TIME ZONE 'Asia/Jakarta')::date - $1::int)::text t",[off])).rows[0].t;
  // hari ke-30 (hari ini-29)=30, hari ini=6, hari ke-31 (hari ini-30)=999 (HARUS diabaikan)
  for(const [off,j] of [[29,30],[0,6],[30,999]]) await pool.query("INSERT INTO barang_keluar(tanggal,obat_id,jumlah,keterangan) VALUES($1,$2,$3,'Penjualan')",[await tgl(off),id,j]);
  const d=await hitungDemandDariRiwayat(id);
  chk('AC1/2 total demand jendela = 36 (hari ke-30 dihitung, ke-31 tidak)', Math.abs(d.demand_harian*30-36)<0.01);
  const n=(await pool.query("SELECT count(*)::int n FROM generate_series(((NOW() AT TIME ZONE 'Asia/Jakarta')::date - 29)::timestamp, (NOW() AT TIME ZONE 'Asia/Jakarta')::date::timestamp, INTERVAL '1 day')")).rows[0].n;
  chk('AC1 panjang rentang SQL = 30 hari', n===30);
  const c=await pool.connect(); const hs=[];
  for(const tz of ['UTC','Pacific/Kiritimati','America/Los_Angeles']){ await c.query(`SET TIME ZONE '${tz}'`); const x=await c.query("select ((NOW() AT TIME ZONE 'Asia/Jakarta')::date)::text h"); hs.push(x.rows[0].h); }
  c.release(); chk('AC3 hari WIB sama di zona sesi berbeda: '+hs.join(','), new Set(hs).size===1);
  await pool.query("DELETE FROM barang_keluar WHERE obat_id=$1",[id]);
  console.log(r.join('\n')); await pool.end(); process.exit(ok?0:1);
})();
