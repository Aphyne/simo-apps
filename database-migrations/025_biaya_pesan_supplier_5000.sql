-- Migration 025: biaya pesan per faktur semua supplier = Rp 5.000
--
-- Sampai sekarang supplier.biaya_pesan umumnya 0, sehingga perhitungan jatuh ke pengaturan `biaya_pesan_per_faktur`
-- (5000; lihat hitungBiayaPesanPerObat di barangMasukController.js). Migrasi ini mengisi 5000 di tiap supplier
-- supaya sumbernya jelas dan terlihat di halaman Supplier.
--
-- Hanya mengubah supplier yang biaya pesannya masih 0 (yang sedang memakai cadangan dari pengaturan). Supplier yang
-- sudah diisi nilai lain sengaja TIDAK ditimpa. Hasil perhitungan tidak berubah selama pengaturan
-- `biaya_pesan_per_faktur` = 5000, karena angka cadangan yang dipakai selama ini sama. Maka tidak perlu menghitung ulang
-- EOQ/ROP; bila pengaturan itu pernah diubah dari 5000, hitung ulang obat dari supplier terkait setelah migrasi.
--
-- Aditif dan aman diulang. Diterapkan manual setelah Boss setuju (jangan `migrate up`, lihat CLAUDE.md).

UPDATE supplier
   SET biaya_pesan = 5000,
       updated_at  = NOW()
 WHERE biaya_pesan = 0;
