# Peran Staf (apa yang tampil dan boleh dilakukan)

Bagian dari [`docs/DESIGN.md`](../../DESIGN.md). Keputusan Boss 19 Nov 2026. Aturan akses dijalankan di **backend** (`backend/src/middleware/aksesStaf.js`), bukan hanya disembunyikan di tampilan; tampilan mengikutinya.

**Prinsip.** Staf bekerja cepat: mencatat transaksi, mengecek stok dan kedaluwarsa, lalu melapor ke admin. Staf **tidak melihat uang**, tidak memesan, dan tidak mengubah konfigurasi.

## Uang: dibuang dari respons API untuk staf
- Bidang yang dibuang: `harga_beli`, `harga_beli_dus`, `biaya_pesan`, `biaya_simpan`, `total_biaya`, `ppn_pct`, `diskon_pct`, `biaya_simpan_pct`.
- `harga_jual` per satuan **boleh** dilihat staf di **data obat** (`/api/obat/**`) dan di riwayat **Stok keluar** (membantu menghitung penjualan yang dia catat; keputusan Boss 19 Nov 2026). Di Stok masuk dan Laporan ikut dibuang.
- **Staf boleh MENGISI semua isian harga** saat mencatat Stok masuk (harga beli per dus, harga jual, PPN, biaya simpan %): ia ikut memegang fakturnya. Sifatnya **hanya menulis**: harga yang sudah tersimpan tidak dikembalikan ke staf (riwayat, rincian, laporan tetap tanpa uang). Form staf hanya tidak memuat ringkasan harga/margin. Mengubah catatan (PUT) hanya admin; **salah ketik harga: batalkan dalam 10 menit lalu catat ulang**.
- `GET /api/laporan/eoq-rop` dan `GET /api/dashboard/perbandingan-biaya` ditolak untuk staf (403).

## Pembatalan oleh staf
Staf boleh **membatalkan** (menghapus) catatan Stok masuk atau Stok keluar yang **dia sendiri buat**, dalam **10 menit** sejak dicatat (`MENIT_BATAL_STAF`). Selebihnya hanya admin. Memakai kode hapus yang sama dengan admin (stok dikembalikan, EOQ/ROP dihitung ulang; Stok masuk ditolak bila stok akan minus). Backend menandai baris yang boleh dibatalkan dengan `bisa_dibatalkan`; tombol "Batalkan stok masuk/keluar …" (ikon `Undo2`, dialog konfirmasi "Batalkan catatan") muncul hanya untuk baris itu. Mengubah (PUT) tetap hanya admin. Tidak perlu migrasi: tabel sudah punya `user_id` dan `created_at`.

## Dashboard staf
- Sapaan: tombol utama **Catat stok keluar**, lalu Catat stok masuk. **Tidak ada Tambah obat** (backend menolak staf).
- Ubin biru **"Perlu dilaporkan ke admin"** (jumlah obat di bawah ROP) dengan tombol "Lihat obatnya" ke `/obat?status=HARUS_REORDER`. Staf tidak memesan, jadi tidak ke Reorder.
- Ubin Akan kedaluwarsa dan **Habis dalam 7 hari** (kini tautan ke Data Obat dengan filter yang sama). Panel Kedaluwarsa dan Aktivitas hari ini tetap.
- **Tanpa panel daftar obat hampir habis** (dicoba lalu dibuang atas keputusan Boss, 19 Nov 2026): daftarnya sudah ada di lonceng dan di ubin biru (tombol "Lihat obatnya"), jadi panel itu hanya mengulang. Sama dengan panel Stok menipis admin yang dibuang lebih dulu.
- Lonceng: tanpa baris supplier; footer "Lihat semua N di Data Obat".

## Halaman lain
- **Stok keluar**: staf melihat harga jual per baris dan **total per transaksi** (kolom Total penjualan, rincian, form); tetap tersembunyi: ubin Rupiah (staf melihat jumlah transaksi), total hasil filter di kaki panel, grafik. **Stok masuk/keluar**: **tanpa panel grafik** (Tren stok masuk/keluar dan Masuk/Keluar per obat adalah analisis, hanya admin); tanpa ubin Rupiah (Pembelian, Penjualan Rp; staf melihat jumlah transaksi), tanpa kolom Subtotal/Total, tanpa total pengeluaran/penjualan, rincian tanpa harga, grafik hanya jumlah satuan. Form Stok masuk memuat semua isian harga (hanya mengisi) tetapi tanpa ringkasan harga/margin. Form Stok keluar menampilkan harga jual per satuan tetapi tanpa subtotal/total.
- **Data Obat** (keputusan Boss 19 Nov 2026: satu bentuk tabel untuk admin dan staf): kolom **Harga jual** untuk semua (di HP ikut di bawah nama); staf tanpa donat Kategori (batang Status stok melebar) dan ubin biru berjudul "Perlu dilaporkan ke admin"; ROP dan EOQ tetap terlihat. Detail tanpa "Harga beli" (harga jual tetap tampil). Rincian perhitungan EOQ/ROP tetap hanya admin.
- **Laporan**: tanpa ubin dan kolom uang (Nilai persediaan, Pembelian, Pendapatan, Total biaya/thn) termasuk di ekspor PDF/Excel.
- **Laporan**: urutan tab staf Kartu stok (bawaan), Kedaluarsa, Stok obat, Stok masuk, Stok keluar.
