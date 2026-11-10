const L=require('./lib');
const pct=(a,p)=>{a=[...a].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*p))]};
(async()=>{
 const port=8004,base=`http://localhost:${port}`;
 const srv=await L.startServer(port,'srv-dos.log');const c=(...a)=>L.call(base,...a);
 const T=await L.login(base,'admin');const db=await L.db();
 const show=(n,r)=>console.log(`${n} -> status ${r.s} ${r.ms}ms len=${r.len} ${r.err||''} ${r.j&&!r.j.success?r.j.message:''}`);
 let peak=0;const mt=setInterval(()=>{peak=Math.max(peak,L.rss(srv.pid)||0)},300);
 console.log('rss awal',L.rss(srv.pid));
 show('page=99999999999',await c('GET','/api/obat?page=99999999999',{t:T}));
 show('page=1e30',await c('GET','/api/obat?page=1e30',{t:T}));
 show('page=9223372036854775807',await c('GET','/api/obat?page=9223372036854775807',{t:T}));
 show('limit=1000000',await c('GET','/api/obat?limit=1000000',{t:T}));
 show('barang-keluar limit=1e6',await c('GET','/api/barang-keluar?limit=1000000',{t:T}));
 show('page=99999999999 BK',await c('GET','/api/barang-keluar?page=99999999999',{t:T}));
 show('search %_%',await c('GET','/api/obat?search='+encodeURIComponent('%_%_%_%_%_%'),{t:T}));
 show('search 5000 char',await c('GET','/api/obat?search='+'a'.repeat(5000),{t:T}));
 show('search 8000 char %',await c('GET','/api/barang-keluar?search='+encodeURIComponent('%a'.repeat(4000)),{t:T}));
 show('search 100KB (URL terlalu panjang?)',await c('GET','/api/obat?search='+'a'.repeat(100000),{t:T}));
 show('laporan kartu-stok tanpa filter',await c('GET','/api/laporan/kartu-stok',{t:T}));
 show('laporan kedaluarsa hari=99999999999',await c('GET','/api/laporan/kedaluarsa?hari=99999999999',{t:T}));
 show('laporan kedaluarsa hari=1e9',await c('GET','/api/laporan/kedaluarsa?hari=1000000000',{t:T}));
 // body besar
 show('POST login body 5MB',await c('POST','/api/auth/login',{raw:JSON.stringify({username:'a'.repeat(5e6),password:'x'})}));
 show('POST login body 101KB',await c('POST','/api/auth/login',{raw:JSON.stringify({username:'a'.repeat(101000),password:'x'})}));
 show('POST login password 100KB (bcrypt)',await c('POST','/api/auth/login',{body:{username:'admin',password:'p'.repeat(90000)}}));
 // bulk keluar
 const ids=(await db.query('select id from obat order by id')).rows.map(r=>r.id);
 const tgl=new Date().toISOString().slice(0,10);
 for(const n of [500,1000,1500,2000]){
  const items=Array.from({length:n},(_,i)=>({obat_id:ids[i%ids.length],jumlah:1}));
  const body=JSON.stringify({tanggal:tgl,keterangan:'Penjualan',items});
  const sb=await db.query('select coalesce(sum(jumlah),0)::int k from barang_keluar');
  const r=await c('POST','/api/barang-keluar/bulk',{t:T,raw:body});
  const sa=await db.query('select coalesce(sum(jumlah),0)::int k from barang_keluar');
  console.log(`bulk keluar ${n} item (${(body.length/1024).toFixed(0)}KB) -> ${r.s} ${r.ms}ms ${r.err||''} ${r.j?.message||''}; keluar bertambah ${sa.rows[0].k-sb.rows[0].k}; rss=${L.rss(srv.pid)}`);
 }
 // bulk masuk
 for(const n of [100,300,600]){
  const items=Array.from({length:n},(_,i)=>({obat_id:ids[i%ids.length],jumlah_dus:1,no_batch:'DB'+n+'-'+i,expired_batch:'2030-01-01'}));
  const body=JSON.stringify({tanggal:tgl,supplier_id:(await db.query('select min(id) i from supplier')).rows[0].i,no_faktur:'DOS-'+n+'-'+Date.now(),items});
  const r=await c('POST','/api/barang-masuk/bulk',{t:T,raw:body});
  console.log(`bulk masuk ${n} item (${(body.length/1024).toFixed(0)}KB) -> ${r.s} ${r.ms}ms ${r.err||''} ${r.j?.message||''}; rss=${L.rss(srv.pid)}`);
 }
 // baseline latensi endpoint lain
 const lat=async(n)=>{const a=[];for(let i=0;i<n;i++)a.push((await c('GET','/api/dashboard/summary',{t:T})).ms);return a};
 let b=await lat(20);console.log('baseline summary p50/max',pct(b,.5),Math.max(...b));
 // login gagal paralel
 const logBefore=(await db.query('select count(*)::int n from log_aktivitas')).rows[0].n;
 const N=300;const t0=Date.now();
 const fail=Array.from({length:N},(_,i)=>c('POST','/api/auth/login',{body:{username:'admin',password:'salah'+i},timeout:120000}));
 // saat itu ukur endpoint lain
 await new Promise(r=>setTimeout(r,300));
 let done=false;const during=[];const probe=(async()=>{while(Date.now()-t0<60000&&!done){const r=await c('GET','/api/dashboard/summary',{t:T,timeout:60000});during.push(r.s?r.ms:-1);}})();
 const fr=await Promise.all(fail);done=true;await probe;
 const st={};fr.forEach(r=>st[r.s]=(st[r.s]||0)+1);
 console.log(`300 login gagal paralel: selesai ${Date.now()-t0}ms status`,JSON.stringify(st),'lat login p50/p95/max',pct(fr.map(r=>r.ms),.5),pct(fr.map(r=>r.ms),.95),Math.max(...fr.map(r=>r.ms)));
 console.log('summary selama serangan: n',during.length,'p50',pct(during,.5),'p95',pct(during,.95),'max',Math.max(...during),'gagal',during.filter(x=>x<0).length);
 await new Promise(r=>setTimeout(r,1500));
 const logAfter=(await db.query('select count(*)::int n from log_aktivitas')).rows[0].n;
 console.log('log_aktivitas bertambah',logAfter-logBefore,'ukuran tabel',(await db.query("select pg_size_pretty(pg_total_relation_size('log_aktivitas')) s")).rows[0].s);
 // 2000 login gagal username tidak ada (cepat, tanpa bcrypt) -> log
 const t1=Date.now();const f2=await Promise.all(Array.from({length:1500},(_,i)=>c('POST','/api/auth/login',{body:{username:'x'+i,password:'y'},timeout:120000})));
 const st2={};f2.forEach(r=>st2[r.s]=(st2[r.s]||0)+1);console.log('1500 login user tak ada paralel',Date.now()-t1,'ms',JSON.stringify(st2));
 await new Promise(r=>setTimeout(r,2000));
 console.log('log_aktivitas total',(await db.query('select count(*)::int n from log_aktivitas')).rows[0].n);
 b=await lat(10);console.log('pasca serangan summary p50/max',pct(b,.5),Math.max(...b));
 clearInterval(mt);console.log('rss puncak',peak.toFixed(0),'akhir',L.rss(srv.pid),'server hidup',!srv.exited);
 await db.end();srv.kill();
})().catch(e=>{console.log('ERR',e);process.exit(1)});
