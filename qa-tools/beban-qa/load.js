const L=require('./lib');const autocannon=require('autocannon');
(async()=>{
 const port=8003,base=`http://localhost:${port}`;
 const srv=await L.startServer(port,'srv-load.log');
 const T=await L.login(base,'admin');
 const eps=['/api/dashboard/summary','/api/monitoring','/api/obat','/api/obat?limit=100','/api/laporan/stok','/api/laporan/barang-masuk','/api/laporan/barang-keluar','/api/laporan/kedaluarsa','/api/laporan/eoq-rop','/api/analisis/perbandingan','/api/barang-keluar','/api/dashboard/tren-permintaan'];
 let peak=0;const mt=setInterval(()=>{peak=Math.max(peak,L.rss(srv.pid)||0)},500);
 console.log('rss awal MB',L.rss(srv.pid));
 console.log('| endpoint | conn | req/s | p50 | p95 | p99 | max | non2xx | timeout/err | bytes/resp |');
 for(const ep of eps){
  // ukuran respon
  const one=await L.call(base,'GET',ep,{t:T});
  for(const c of [10,50,200]){
   const r=await autocannon({url:base+ep,connections:c,duration:8,timeout:30,headers:{authorization:'Bearer '+T}});
   console.log(`| ${ep} | ${c} | ${r.requests.average.toFixed(0)} | ${r.latency.p50} | ${r.latency.p97_5} (p97.5) | ${r.latency.p99} | ${r.latency.max} | ${r.non2xx} | ${r.timeouts+r.errors} | ${one.len} |`);
  }
 }
 clearInterval(mt);console.log('rss puncak MB',peak.toFixed(0),'akhir',L.rss(srv.pid));
 srv.kill();
})().catch(e=>{console.log('ERR',e);process.exit(1)});
