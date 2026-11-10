const REPO = require('path').resolve(__dirname, '..', '..').split(require('path').sep).join('/');
const B=REPO + '/backend/';
const pool = require(B+'src/db/pool');
const { login } = require(B+'src/controllers/authController');
const call = async (u,p) => { let out; const res={status(c){this.c=c;return this;},json(b){out={c:this.c||200,b};return this;}};
  const t=process.hrtime.bigint(); await login({ body:{username:u,password:p}, headers:{}, ip:'1.1.1.1', originalUrl:'/api/auth/login', method:'POST', path:'/', get(){return ''} }, res); out.ms=Number(process.hrtime.bigint()-t)/1e6; return out; };
(async()=>{
  await call('admin','salah'); await call('tidakada','salah');
  const N=30, A=[],Bv=[]; let a,b;
  for(let i=0;i<N;i++){ a=await call('tidakada_'+i,'salah'); A.push(a.ms); b=await call('admin','salah'); Bv.push(b.ms); }
  const avg=x=>x.reduce((s,v)=>s+v,0)/x.length; const d=Math.abs(avg(A)-avg(Bv));
  const r=[]; let ok=true; const chk=(n,c)=>{r.push((c?'LULUS ':'GAGAL ')+n); if(!c) ok=false;};
  console.log('rata-rata tidak ada:',avg(A).toFixed(1),'ms; ada+salah:',avg(Bv).toFixed(1),'ms; selisih',d.toFixed(2),'ms');
  chk('AC1 selisih < 20 ms (N=30)', d<20);
  chk('AC2 pesan identik', a.b.message==='Username atau password salah' && b.b.message===a.b.message && a.c===401 && b.c===401);
  const v=await call('admin','password'); chk('AC3 login valid 200+token', v.c===200 && !!v.b.data.token);
  await pool.query("UPDATE users SET is_active=false WHERE username='staf1'");
  const n=await call('staf1','password'); chk('AC3 akun nonaktif 401 pesan sama', n.c===401 && n.b.message==='Username atau password salah');
  await pool.query("UPDATE users SET is_active=true WHERE username='staf1'");
  console.log(r.join('\n')); await pool.end(); process.exit(ok?0:1);
})();
