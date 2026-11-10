const REPO = require('path').resolve(__dirname, '..', '..').split(require('path').sep).join('/');
// AC-T03-1 end-to-end: bandingkan estimasi di endpoint obat vs monitoring (DB lokal)
const B=REPO + '/backend/';
const pool=require(B+'src/db/pool'); const mon=require(B+'src/controllers/monitoringController'); const obat=require(B+'src/controllers/obatController');
const run=async(fn,req)=>{let o;await fn(req,{status(){return this;},json(b){o=b;}});return o;};
(async()=>{
  await pool.query("UPDATE obat SET demand_harian=7, stok=100 WHERE id=(select min(id) from obat)");
  await pool.query("UPDATE obat SET demand_harian=7, stok=0 WHERE id=(select min(id)+1 from obat)");
  const m=await run(mon.getMonitoring,{query:{}});
  const a=await run(obat.getAll,{query:{limit:'100'},user:{role:'admin'}});
  const list=Array.isArray(a.data)?a.data:(a.data.data||a.data); let bad=0,n=0;
  for(const x of m.data){const y=list.find(z=>z.id===x.id); if(y){n++; if(y.estimasi_habis_hari!==x.estimasi_habis_hari){bad++;console.log('BEDA',x.id,x.estimasi_habis_hari,y.estimasi_habis_hari);}}}
  console.log('dibandingkan',n,'obat; beda',bad, bad===0&&n>0?'LULUS':'GAGAL'); await pool.end(); process.exit(bad===0&&n>0?0:1);
})();
