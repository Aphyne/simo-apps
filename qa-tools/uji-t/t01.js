const REPO = require('path').resolve(__dirname, '..', '..').split(require('path').sep).join('/');
// jalankan: lihat run.sh (preload pengaman + env uji lokal)
const B=REPO + '/backend/';
const { OAuth2Client } = require(B+'node_modules/google-auth-library');
let payload;
OAuth2Client.prototype.verifyIdToken = async () => ({ getPayload: () => payload });
const pool = require(B+'src/db/pool');
const { googleLogin } = require(B+'src/controllers/authController');
const call = async (p) => { payload=p; let out; const res={status(c){this.c=c;return this;},json(b){out={c:this.c||200,b};return this;}};
  await googleLogin({ body:{credential:'x'}, headers:{}, ip:'1.1.1.1', originalUrl:'/api/auth/google', method:'POST', path:'/api/auth/google', get(){return ''} }, res); return out; };
(async()=>{
  await pool.query("UPDATE users SET email='uji-admin@example.com' WHERE username='admin'");
  const r=[]; let ok=true; const chk=(n,c)=>{r.push((c?'LULUS ':'GAGAL ')+n); if(!c) ok=false;};
  let o=await call({email:'uji-admin@example.com',email_verified:false});
  chk('AC1 verified=false ditolak 401 tanpa token', o.c===401 && !(o.b.data&&o.b.data.token));
  o=await call({email:'uji-admin@example.com'}); chk('AC1 email_verified hilang ditolak', o.c===401);
  o=await call({email:'uji-admin@example.com',email_verified:true}); chk('AC2 verified=true login berhasil + token', o.c===200 && !!o.b.data.token);
  await new Promise(r=>setTimeout(r,500));
  const n1=(await pool.query("select count(*)::int n from log_aktivitas where jenis='login_gagal' and deskripsi ilike '%Google%'")).rows[0].n;
  chk('AC3 penolakan tercatat login_gagal (>=2)', n1>=2);
  console.log(r.join('\n')); await pool.end(); process.exit(ok?0:1);
})();
