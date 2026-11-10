const REPO = require('path').resolve(__dirname, '..', '..').split(require('path').sep).join('/');
const B=REPO + '/backend/';
const { kalkulasiLengkap, kalkulasiStepByStep } = require(B+'src/services/eoqService');
const r=[]; let ok=true; const chk=(n,c)=>{r.push((c?'LULUS ':'GAGAL ')+n); if(!c) ok=false;};
const base={demand_tahunan:3650,biaya_pesan:50000,biaya_simpan:2000,demand_harian:10,std_dev_demand:3,service_level:95};
const fin=o=>Object.values(o).every(v=>v===null||Number.isFinite(v));
for(const lt of [0,-5,'abc',null]){ const k=kalkulasiLengkap({...base,lead_time:lt}); chk(`AC1 lead_time=${lt} -> terhingga, setara LT=1`, fin(k)&&JSON.stringify(k)===JSON.stringify(kalkulasiLengkap({...base,lead_time:1}))); }
const st=kalkulasiStepByStep({...base,lead_time:-5}); chk('AC1 step-by-step LT=1 + catatan dilaporkan', st.input.LT===1 && !!st.catatan_lead_time && fin({a:st.langkah_rop.hasil,b:st.langkah_safety_stock.hasil}));
chk('AC1 LT valid tanpa catatan', !kalkulasiStepByStep({...base,lead_time:3}).catatan_lead_time);
for(const s of [-4,-0.1,'x']){ const k=kalkulasiLengkap({...base,lead_time:3,std_dev_demand:s}); chk(`AC2 sigma=${s} -> SS>=0`, k.safety_stock>=0 && fin(k)); }
chk('AC2 step-by-step sigma negatif SS>=0', kalkulasiStepByStep({...base,lead_time:3,std_dev_demand:-4}).langkah_safety_stock.hasil>=0);
const getZ=sl=>{sl=Number(sl);return sl>=99?2.33:sl>=97?1.88:sl>=95?1.65:1.28;};
const lama=o=>{const D=+o.demand_tahunan,S=+o.biaya_pesan,H=+o.biaya_simpan,d=+o.demand_harian,sg=+o.std_dev_demand,LT=parseInt(o.lead_time)||1;
  const eoq=Math.sqrt(2*D*S/H),ss=getZ(o.service_level)*sg*Math.sqrt(LT),rop=d*LT+ss,tc=(D/eoq)*S+(eoq/2)*H;
  return {eoq:+eoq.toFixed(2),safety_stock:+ss.toFixed(2),rop:+rop.toFixed(2),total_biaya:+tc.toFixed(2)};};
const sampel=[{demand_tahunan:1200,biaya_pesan:40000,biaya_simpan:1500,demand_harian:3.3,std_dev_demand:1.2,lead_time:2,service_level:90},
{demand_tahunan:5000,biaya_pesan:75000,biaya_simpan:900,demand_harian:13.7,std_dev_demand:4.1,lead_time:7,service_level:95},
{demand_tahunan:800,biaya_pesan:30000,biaya_simpan:2500,demand_harian:2.2,std_dev_demand:0.8,lead_time:1,service_level:97},
{demand_tahunan:9000,biaya_pesan:100000,biaya_simpan:3000,demand_harian:24.6,std_dev_demand:9.9,lead_time:14,service_level:99},
{demand_tahunan:300,biaya_pesan:20000,biaya_simpan:700,demand_harian:0.8,std_dev_demand:0.5,lead_time:5,service_level:95}];
sampel.forEach((o,i)=>chk(`AC3 sampel ${i+1} identik dgn rumus lama`, JSON.stringify(kalkulasiLengkap(o))===JSON.stringify(lama(o))));
console.log(r.join('\n')); process.exit(ok?0:1);
