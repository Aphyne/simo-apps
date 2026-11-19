// Config KHUSUS untuk menggabungkan laporan (dipakai `node jalankan-semua.js`), bukan untuk menjalankan uji.
// Uji e2e (folder e2e/) dan uji per peran (folder uji-peran/) punya folder uji berbeda; merge-reports butuh
// satu folder induk bersama, yaitu qa-tools.
module.exports = { testDir: __dirname };
