const REPO = require('path').resolve(__dirname, '..', '..').split(require('path').sep).join('/');
const PGENV=require('path').join(__dirname,'..','pgenv');
const {spawn,execSync}=require('child_process');const fs=require('fs');
const {Client}=require('pg');
const DBURL='postgresql://qa:qa@localhost:54329/simo_qa';
exports.DBURL=DBURL;
exports.startServer=async(port,logf)=>{
 const out=fs.openSync(logf,'w');
 const srv=spawn('node',['-r',PGENV+'/preload.js','src/app.js'],{cwd:REPO + '/backend',env:{...process.env,PORT:String(port),DATABASE_URL:DBURL,JWT_SECRET:'rahasia-uji-lokal-0123456789-abcdefghijklmnopqrstuv',NODE_ENV:'test',FRONTEND_URL:'http://localhost:3000'},stdio:['ignore',out,out]});
 srv.exited=false;srv.on('exit',(c)=>{srv.exited=true;srv.code=c});
 for(let i=0;i<40;i++){try{if((await fetch(`http://localhost:${port}/api/health`)).ok)return srv}catch{await new Promise(r=>setTimeout(r,500))}}
 throw new Error('server gagal start');
};
exports.rss=(pid)=>{try{const o=execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`).toString();const m=o.match(/"([\d,\.]+) K"/);return m?parseInt(m[1].replace(/[,.]/g,''))/1024:null}catch{return null}};
exports.db=async()=>{const c=new Client({connectionString:DBURL});await c.connect();return c};
exports.call=async(base,m,p,{t,body,raw,timeout=60000}={})=>{const h={};if(t)h.Authorization='Bearer '+t;let b;if(raw!==undefined){b=raw;h['Content-Type']='application/json'}else if(body!==undefined){b=JSON.stringify(body);h['Content-Type']='application/json'}
 const t0=Date.now();try{const r=await fetch(base+p,{method:m,headers:h,body:b,signal:AbortSignal.timeout(timeout)});const txt=await r.text();let j=null;try{j=JSON.parse(txt)}catch{}return{s:r.status,j,ms:Date.now()-t0,len:txt.length}}catch(e){return{s:0,err:e.name+':'+e.message,ms:Date.now()-t0}}};
exports.login=async(base,u)=>(await exports.call(base,'POST','/api/auth/login',{body:{username:u,password:'password'}})).j.data.token;
