# Halaman Dashboard

Bagian dari [`docs/DESIGN.md`](../../DESIGN.md). Aturan dan pola bersama ada di DESIGN.md; berkas ini hanya memuat keputusan khusus halaman ini.

**Isi Dashboard (18 Nov 2026, dua kali critique dan keputusan Boss).** Dashboard adalah pintu ke halaman lain dan setiap fakta ditulis sekali. Yang bisa ditindak ada di atas, yang reflektif di bawah. Angka uang hanya untuk admin.

```
Admin:
[ Sapaan + 3 aksi cepat (8) ......... ][ Ubin biru: Perlu reorder (4) ]
[ Pendapatan ][ Transaksi m/k ][ Akan kedaluwarsa ][ Habis dalam 7 hari ]   (3 kolom tiap ubin, semuanya tautan)
[ Kedaluwarsa: sudah lewat + akan expired (7) ][ Aktivitas hari ini, masuk + keluar (5) ]
[ Pembelian vs Penjualan, Rp, 6 bulan (8) ..... ][ Terlaris 30 hari terakhir (4) ]
[ Perlu dilengkapi (12, hanya bila ada yang belum lengkap) ]

Staf: sama, tanpa ubin Pendapatan (tiga ubin, 4 kolom tiap ubin), tanpa baris uang dan Perlu dilengkapi.
```

- **Angka uang khusus admin (keputusan Boss 18 Nov 2026).** Pendapatan, grafik Pembelian vs Penjualan (memuat harga beli), Terlaris, dan Perlu dilengkapi hanya untuk admin. Bukan sekadar menyembunyikan tampilan: `getSummary` tidak mengirim bidang uang ke peran lain, dan `GET /api/dashboard/pembelian-penjualan` memakai `requireRole('admin')` (hook `usePembelianPenjualan(aktif)` tidak memanggil API untuk staf). Tombol dan tautan ke `/reorder` juga hanya untuk admin (halaman itu khusus admin).
- **Sapaan** hanya tanggal, nama, dan tiga aksi (Catat stok masuk, Catat stok keluar, Tambah obat). Satu-satunya teks tambahan: pesan jujur bila data gagal dimuat.
- **Ubin biru** (satu-satunya): angka reorder dan rasionya ke total obat. Tombol "Lihat daftar reorder" hanya admin.
- **Empat ubin** (`StatTile href`): Pendapatan hari ini (Rp, "N penjualan", "N belum ber-harga" bila ada; ke Stok Keluar; admin), Transaksi hari ini ("N masuk · N keluar"; ke Laporan), Akan kedaluwarsa (angka 90 hari, baris merah "N batch sudah lewat" bila ada; ke Laporan Kedaluarsa), **Habis dalam 7 hari** (belum habis, stok dibagi kebutuhan harian <= 7 hari di antara obat yang perlu reorder, aturan yang sama dengan ubin di halaman Reorder; ke `/reorder?kondisi=segera`, tautan hanya admin). Ubin "Stok habis" dibuang: angkanya sudah ada di ubin biru dan lonceng, dan "habis dalam 7 hari" memberi informasi ke depan.
- **Panel Stok menipis dibuang**: daftar 5 teratas sudah ada di lonceng, jumlahnya di ubin biru, daftar lengkap di Reorder. Yang ikut hilang: peringatan dini "Mendekati ROP"; ditunda sampai Boss memutuskan ambang 1,5 atau 1,2. Komponen `StokMenipisCard` tetap ada (dipakai `/design`).
- **Kedaluwarsa** (`DaftarExpiredCard`): dua kelompok; tiap baris menulis kode obat, **nomor batch** (atau "Batch tanpa nomor"), dan sisa stok batch itu. "Sudah lewat" satu baris per batch (merah, paling atas, perkiraan FIFO dibatasi stok obat sekarang); "akan expired" satu baris per obat (batch terdekatnya). Satu tujuan tautan (Laporan Kedaluarsa).
- **Aktivitas hari ini** (`AktivitasHariIni`): stok masuk dan keluar digabung, terbaru di atas, maksimal 8 baris dengan ikon masuk/keluar, tanda +/- dan jam; baris "Riwayat faktur" tidak dihitung. Bila salah satu sumber gagal dimuat, panel menyatakannya.
- **Pembelian vs Penjualan** (`PembelianPenjualanChart`, menggantikan Tren permintaan): dua area (Boss memilih area; seri dibedakan warna dan gaya garis, pembelian putus-putus), dalam **Rupiah** karena satuan obat berbeda tidak bisa dijumlahkan. Pembelian = stok masuk x harga beli per satuan (sudah termasuk diskon dan PPN), tanpa baris "Stok Awal"; penjualan = hanya keterangan Penjualan x harga jual. Dibaca sebagai belanja stok vs hasil jual, **bukan laba**. **Bulan kosong di awal dibuang. Bulan yang punya penjualan tanpa harga ditandai** (tulisan "tidak lengkap" di sumbu X dan titik berpola putus-putus berwarna peringatan) dan dijelaskan di catatan bawah grafik, supaya garis yang rendah tidak terbaca sebagai penjualan yang memang kecil (data 18 Nov: Oktober 2026 punya 54 baris tanpa harga). Legenda bertulis, ada tabel `sr-only`.
- **Terlaris, 30 hari terakhir** (`TerlarisCard`): 5 obat teratas menurut pendapatan Rp (sepadan lintas satuan), tautan ke detail obat. Jendela bergulir, bukan bulan kalender, supaya tidak kosong di awal bulan. Penjualan tanpa harga tidak ikut.
- **Perlu dilengkapi** (`PerluDilengkapiCard`, admin, hilang bila semuanya nol): tiga hitungan masing-masing menuju halaman perbaikannya: penjualan belum ber-harga (ke Stok Keluar), obat belum punya supplier dan batch tanpa nomor (ke Stok Masuk). Hitungan nol tidak ditampilkan. Dasbor ini memakai harga, supplier, dan batch, sehingga kelengkapannya menentukan apakah angka Rupiah bisa dipercaya.
- **Tidak dipakai**: panel bukti penghematan EOQ (tidak ada fiturnya di aplikasi); nilai persediaan dan stok mati (ditunda). **Belum dikerjakan (tidak dipilih Boss)**: panah penanda di ubin tautan dan tombol coba lagi di panel yang gagal; ejaan "kedaluwarsa" (Dashboard) vs "kedaluarsa" (Laporan) belum diseragamkan.
- **Backend** (`dashboardController.js`, hanya kueri baca): `summary` memuat `obat_segera_habis`, `kedaluwarsa_lewat`, `daftar_lewat` (per batch), `daftar_expired` (dengan batch dan kode), serta khusus admin `pendapatan_hari_ini`, `penjualan_transaksi`, `penjualan_tanpa_harga`, `terlaris_30_hari`, `perlu_dilengkapi`; endpoint `GET /api/dashboard/pembelian-penjualan` (admin). Server backend harus dijalankan ulang agar bidang baru muncul (frontend menahan bidang yang belum ada).

**Kartu bertinggi tetap, isi digulir (18 Nov 2026, permintaan Boss).** Kedaluwarsa, Aktivitas hari ini, dan Terlaris tidak lagi memanjang mengikuti jumlah baris: Kedaluwarsa dan Aktivitas `h-[27rem]`, Terlaris mengikuti tinggi grafik di `lg` (di bawah `lg` tetap `27rem`); daftarnya dalam wadah gulir yang bisa difokus keyboard (`tabIndex=0`, `role=region`, label "bisa digulir"). Backend mengirim lebih banyak baris (kedaluwarsa 30 per kelompok, terlaris 10; Aktivitas semua baris hari ini). Tautan "Lihat semuanya di Laporan" di bawah Kedaluwarsa dibuang karena mengulang tautan "Lihat laporan" di kepala kartu.

**Penyesuaian (18 Nov 2026, laporan Boss):** scrollbar kartu bergulir disembunyikan (`scrollbar-width: none`; tetap bisa digulir dengan roda, sentuh, dan keyboard, baris yang terpotong di tepi bawah menjadi petunjuk). Tautan kepala "Aktivitas hari ini" kini dua: **Stok masuk** dan **Stok keluar**, menuju `/barang-masuk?tanggal=hari-ini` dan `/barang-keluar?tanggal=hari-ini` (sebelumnya "Lihat laporan" membuka Laporan di tab Stok obat, tidak nyambung). Ubin "Transaksi hari ini" tidak lagi tautan karena tidak punya satu tujuan yang tepat (angkanya gabungan masuk dan keluar).

**Ubin Transaksi hari ini dibuang (18 Nov 2026, keputusan Boss):** angkanya sudah dilayani panel Aktivitas hari ini. Admin kini tiga ubin (Pendapatan, Akan kedaluwarsa, Habis dalam 7 hari; 4 kolom tiap ubin), staf dua ubin (6 kolom). Ubin Nilai persediaan tidak jadi dibuat.
