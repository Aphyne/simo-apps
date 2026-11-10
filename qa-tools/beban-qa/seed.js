const P=require('path').join(__dirname,'..','pgenv');
const {Client}=require('pg');
(async()=>{const c=new Client({connectionString:'postgresql://qa:qa@localhost:54329/simo_qa'});await c.connect();
await c.query('truncate barang_keluar, barang_masuk, log_aktivitas restart identity');
await c.query('delete from obat');await c.query('delete from supplier');
for(let i=1;i<=5;i++)await c.query("insert into supplier(nama,alamat,telepon,lead_time_avg,biaya_pesan) values($1,'x','0',$2,50000)",['PBF '+i,i+1]);
const sup=(await c.query('select id from supplier')).rows.map(r=>r.id);
const kat=['Antibiotik','Analgesik','Vitamin','Antasida','Sirup'];
for(let i=1;i<=80;i++){
 await c.query(`insert into obat(kode,nama,kategori,satuan,satuan_per_dus,harga_beli,harga_jual,stok,biaya_pesan,biaya_simpan,lead_time,service_level,supplier_id,demand_harian,demand_tahunan,std_dev_demand,eoq,safety_stock,rop,total_biaya) values($1,$2,$3,'tablet',10,1000,1500,0,50000,100,3,95,$4,5,1825,2,100,10,25,0)`,['OB'+String(i).padStart(3,'0'),'Obat Beban '+i,kat[i%5],sup[i%5]]);}
const ids=(await c.query('select id from obat')).rows.map(r=>r.id);
// 4000 masuk, 9000 keluar selama 400 hari
await c.query(`insert into barang_masuk(tanggal,obat_id,jumlah_dus,jumlah_satuan,supplier_id,no_faktur,expired_batch,no_batch,harga_beli,user_id)
 select current_date - (g%400), (array[${ids.join(',')}])[1+g%80], 50, 500, (select id from supplier order by id limit 1 offset g%5), 'F-'||g, current_date + (g%700), 'B'||g, 1000, 1 from generate_series(1,4000) g`);
await c.query(`insert into barang_keluar(tanggal,obat_id,jumlah,keterangan,user_id,harga_jual)
 select current_date - (g%400), (array[${ids.join(',')}])[1+(g*7)%80], 1+g%9, case when g%10=0 then 'Rusak' else 'Penjualan' end, 1, 1500 from generate_series(1,9000) g`);
await c.query(`update obat o set stok=coalesce((select sum(jumlah_satuan) from barang_masuk where obat_id=o.id),0)-coalesce((select sum(jumlah) from barang_keluar where obat_id=o.id),0)`);
console.log((await c.query('select (select count(*) from obat) o,(select count(*) from barang_masuk) m,(select count(*) from barang_keluar) k,(select min(stok) from obat) mn')).rows);
await c.query('analyze');await c.end()})().catch(e=>console.log(e.message));
