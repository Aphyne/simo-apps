const P=require('path').join(__dirname,'..','pgenv');
const {Client}=require('pg');const bcrypt=require('bcryptjs');
(async()=>{const c=new Client({connectionString:'postgresql://qa:qa@localhost:54329/simo_qa'});await c.connect();
await c.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE');
const h=bcrypt.hashSync('password',10);
console.log((await c.query('select id,username,role from users order by id')).rows);
await c.query("update users set password=$1",[h]);
console.log((await c.query("select column_name from information_schema.columns where table_name in('obat','barang_masuk','barang_keluar') order by table_name,ordinal_position")).rows.map(r=>r.column_name).join(','));
await c.end()})();
